import { useRef, useSyncExternalStore } from "react";
import { createObserveDebugEntry, createSetterDebugEntry } from "./debugger";

import { ObserverContext } from "./ObserverContext";
import { Signal as SignalClass } from "./Signal";

import * as CachedPromise from "./CachedPromise";

export type { CachedPromise } from "./CachedPromise";

export type Signal<T> = {
  get value(): T;
  set value(value: T);
  onChange(listener: (newValue: T, prevValue: T) => void): () => void;
};

export function signal<T>(value: T) {
  const signal = new SignalClass(() => value);
  let listeners: Set<(newValue: T, prevValue: T) => void> | undefined;

  return {
    onChange(listener: (newValue: T, prevValue: T) => void) {
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

export type AsyncSignal<T> = {
  get value(): CachedPromise.CachedPromise<T>;
  set value(value: T | Promise<T>);
  onChange(listener: (newValue: T, prevValue: T) => void): () => void;
};

export function asyncSignal<T>(value: Promise<T>) {
  const signal = new SignalClass(() => value);
  let listeners: Set<(newValue: T, prevValue: T) => void> | undefined;

  value = CachedPromise.from(value);

  return {
    onChange(listener: (newValue: T, prevValue: T) => void) {
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

      return value;
    },
    set value(newValue) {
      const prevValue = value;

      if (newValue instanceof Promise) {
        value = CachedPromise.from(newValue);
      } else {
        value = CachedPromise.fromValue(newValue);
      }

      if (process.env.NODE_ENV === "development") {
        createSetterDebugEntry(signal, value);
      }

      value
        .then((resolvedValue) => {
          prevValue.then((resolvedPrevValue) => {
            listeners?.forEach((listener) =>
              listener(resolvedValue, resolvedPrevValue)
            );
          });
        })
        .finally(() => {
          signal.notify();
        });
    },
  } as AsyncSignal<T>;
}

export function compute<T>(cb: () => T) {
  let value: T;
  let disposer: () => void;
  let isDirty = true;
  const signal = new SignalClass(() => value);
  let listeners: Set<(newValue: T, prevValue: T) => void> | undefined;

  return {
    onChange: (listener: (newValue: T, prevValue: T) => void) => {
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

        context[Symbol.dispose]();

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

  return signalRef.current;
}
