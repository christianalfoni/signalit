import { useRef, useSyncExternalStore } from "react";
import { createObserveDebugEntry, createSetterDebugEntry } from "./debugger";
import * as CachedPromise from "./CachedPromise";

import { ObserverContext } from "./ObserverContext";
import { Signal } from "./Signal";



export const useSignalPromise = CachedPromise.usePromise;

export function signal<T>(value: T) {
  const signal = new Signal(() => value);

  return {
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
      const isUpdatingFulfilledPromise =
        newValue instanceof Promise &&
        CachedPromise.isFulfilledCachedPromise(value);

      value = newValue;

      if (process.env.NODE_ENV === "development") {
        createSetterDebugEntry(signal, value);
      }

      if (isUpdatingFulfilledPromise) {
        const promise = newValue;

        newValue
          .then((resolvedValue) => {
            CachedPromise.makePromiseFulfilledCachedPromise(
              promise,
              resolvedValue
            );
          })
          .catch((error) => {
            CachedPromise.makePromiseRejectedCachedPromise(promise, error);
          })
          .finally(() => {
            signal.notify();
          });
      } else if (newValue instanceof Promise) {
        const promise = newValue;
        CachedPromise.makePromisePendingCachedPromise(promise);
        signal.notify();
        newValue
          .then((resolvedValue) => {
            CachedPromise.makePromiseFulfilledCachedPromise(
              promise,
              resolvedValue
            );
          })
          .catch((error) => {
            CachedPromise.makePromiseRejectedCachedPromise(promise, error);
          });
      } else {
        signal.notify();
      }
    },
  } as {
    get value(): T extends Promise<infer Value>
      ? CachedPromise.CachedPromise<Value>
      : T;
    set value(value: T);
  };
}

export function compute<T>(cb: () => T) {
  let value: T;
  let disposer: () => void;
  let isDirty = true;
  const signal = new Signal(() => value);

  return {
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
          signal.notify();
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

export function observer() {
  const context = new ObserverContext();

  useSyncExternalStore(
    (update) => context.subscribe(update),
    () => context.snapshot
  );

  return context;
}

export function useSignal<T>(initialValue: T) {
  const signalRef = useRef<{ value: T }>();

  if (!signalRef.current) {
    signalRef.current = signal(initialValue);
  }

  return signalRef.current as { value: T };
}
