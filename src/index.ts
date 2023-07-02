import { useRef, useSyncExternalStore } from "react";
import { createObserveDebugEntry, createSetterDebugEntry } from "./debugger";

import { ObserverContext } from "./ObserverContext";
import { Signal } from "./Signal";

let observerContext: ObserverContext | undefined;

export function signal<T>(value: T) {
  const signal = new Signal();

  return {
    get value() {
      if (observerContext) {
        observerContext.registerSignal(signal);
        if (process.env.NODE_ENV === "development") {
          createObserveDebugEntry(signal);
        }
      }

      return value;
    },
    set value(newValue) {
      value = newValue;

      if (process.env.NODE_ENV === "development") {
        createSetterDebugEntry(signal, value);
      }

      if (value instanceof Promise) {
        Object.assign(value, {
          status: "pending",
        });
        value
          .then((resolvedValue) => {
            Object.assign(value, {
              status: "fulfilled",
              value: resolvedValue,
            });
          })
          .catch((error) => {
            Object.assign(value, {
              status: "error",
              error,
            });
          })
          .finally(() => {
            signal.notify();
          });
      } else {
        signal.notify();
      }
    },
  };
}

export function compute<T>(cb: () => T) {
  const signal = new Signal();
  let value: T;
  let disposer: () => void;
  let isDirty = true;

  return {
    get value() {
      if (observerContext) {
        observerContext.registerSignal(signal);
        if (process.env.NODE_ENV === "development") {
          createObserveDebugEntry(signal);
        }
      }

      if (isDirty) {
        disposer?.();

        const prevObserverContext = observerContext;

        observerContext = new ObserverContext();

        value = cb();

        disposer = observerContext.subscribe(() => {
          isDirty = true;
          signal.notify();
        });

        observerContext = prevObserverContext;

        isDirty = false;

        if (process.env.NODE_ENV === "development") {
          createSetterDebugEntry(signal, value, true);
        }
      }

      return value;
    },
  };
}

export function useObserver() {
  const context = (observerContext = new ObserverContext());

  useSyncExternalStore(
    (update) => {
      observerContext = undefined;
      return context.subscribe(update);
    },
    () => ObserverContext.notifyCount
  );
}

export function useSignal<T>(initialValue: T) {
  const signalRef = useRef<{ value: T }>();

  if (!signalRef.current) {
    signalRef.current = signal(initialValue);
  }

  return signalRef.current;
}
