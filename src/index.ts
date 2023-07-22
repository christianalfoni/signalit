import { useRef, useSyncExternalStore } from "react";
import { createObserveDebugEntry, createSetterDebugEntry } from "./debugger";
import * as CachedPromise from "./CachedPromise";

import { ObserverContext } from "./ObserverContext";
import { Signal as SignalClass } from "./Signal";

export type Signal<T> = {
  get value(): T extends Promise<infer Value>
    ? CachedPromise.CachedPromise<Value>
    : T;
  set value(value: T);
  onChange(listener: (newValue: T, prevValue: T) => void): () => void;
};

export function signal<T>(value: T) {
  const signal = new SignalClass(() => value);
  let listeners: Set<(newValue: T, prevValue: T) => void> | undefined;

  const onChange = (listener: (newValue: T, prevValue: T) => void) => {
    listeners = listeners || new Set();

    listeners.add(listener);

    return () => {
      listeners?.delete(listener);
    };
  };

  if (value instanceof Promise) {
    let promiseValue = CachedPromise.create<T>(value);

    return {
      onChange,
      get value() {
        if (ObserverContext.current) {
          ObserverContext.current.registerSignal(signal);
          if (process.env.NODE_ENV === "development") {
            createObserveDebugEntry(signal);
          }
        }

        return promiseValue;
      },
      set value(newValue) {
        const isUpdatingFulfilledPromise =
          newValue instanceof Promise &&
          CachedPromise.isFulfilledCachedPromise(promiseValue);

        const prevPromiseValue = promiseValue;
        promiseValue = newValue;

        if (process.env.NODE_ENV === "development") {
          createSetterDebugEntry(signal, promiseValue);
        }

        if (isUpdatingFulfilledPromise) {
          const promise = newValue;

          newValue
            .then((resolvedValue) => {
              CachedPromise.makePromiseFulfilledCachedPromise(
                promise,
                resolvedValue
              );
              signal.notify();
              Promise.all([promiseValue, prevPromiseValue]).then(
                ([value, prevValue]) => {
                  listeners?.forEach((listener) => listener(value, prevValue));
                }
              );
            })
            .catch((error) => {
              CachedPromise.makePromiseRejectedCachedPromise(promise, error);
              signal.notify();
            });
        } else {
          const promise = newValue;
          CachedPromise.makePromisePendingCachedPromise(promise);
          signal.notify();
          newValue
            .then((resolvedValue) => {
              CachedPromise.makePromiseFulfilledCachedPromise(
                promise,
                resolvedValue
              );

              Promise.all([promiseValue, prevPromiseValue]).then(
                ([value, prevValue]) => {
                  listeners?.forEach((listener) => listener(value, prevValue));
                }
              );
            })
            .catch((error) => {
              CachedPromise.makePromiseRejectedCachedPromise(promise, error);
            });
        }
      },
    } as Signal<T>;
  }

  return {
    onChange,
    get value() {
      if (ObserverContext.current) {
        ObserverContext.current.registerSignal(signal);
        if (process.env.NODE_ENV === "development") {
          createObserveDebugEntry(signal);
        }
      }

      return value;
    },
    set value(newValue) {
      const prevValue = value;
      value = newValue;

      if (process.env.NODE_ENV === "development") {
        createSetterDebugEntry(signal, value);
      }

      signal.notify();

      listeners?.forEach((listener) => listener(value, prevValue));
    },
  } as Signal<T>;
}

export function compute<T>(cb: () => T) {
  let value: T;
  let disposer: () => void;
  let isDirty = true;
  const signal = new SignalClass(() => value);
  let listeners: Set<(newValue: T, prevValue: T) => void> | undefined;

  return {
    onChange: (listener: (newValue: T) => void) => {
      listeners = listeners || new Set();

      listeners.add(listener);

      return () => {
        listeners?.delete(listener);
      };
    },
    get value() {
      if (ObserverContext.current) {
        ObserverContext.current.registerSignal(signal);
        if (process.env.NODE_ENV === "development") {
          createObserveDebugEntry(signal);
        }
      }

      if (isDirty) {
        disposer?.();

        const context = new ObserverContext();

        value = cb();

        disposer = context.subscribe(() => {
          isDirty = true;

          const prevValue = value;

          if (listeners?.size) {
            isDirty = false;
            value = cb();
          }

          signal.notify();

          listeners?.forEach((listener) => listener(value, prevValue));
        });

        isDirty = false;

        if (process.env.NODE_ENV === "development") {
          createSetterDebugEntry(signal, value, true);
        }
      }

      return value;
    },
  };
}

export function observe() {
  const context = new ObserverContext();

  useSyncExternalStore(
    (update) => context.subscribe(update),
    () => context.snapshot
  );

  return context;
}

export function useSignal<T>(initialValue: T) {
  const signalRef = useRef<Signal<T>>();

  if (!signalRef.current) {
    signalRef.current = signal(initialValue);
  }

  return signalRef.current as { value: T };
}
