import { useRef, useSyncExternalStore } from "react";
import { Signal } from "./Signal";
import { ObserverContext } from "./ObserverContext";

let observerContext: ObserverContext | undefined;

export function signal<T>(value: T) {
  const signal = new Signal();

  return {
    get value() {
      if (observerContext) {
        observerContext.registerSignal(signal);
      }

      return value;
    },
    set value(newValue) {
      value = newValue;

      signal.notify();
    },
  };
}

export function compute<T>(cb: () => T) {
  const signal = new Signal();
  let value: T;
  let disposer: () => void;
  let isDirty = true;

  const recompute = () => {
    disposer?.();

    observerContext = new ObserverContext();

    const result = cb();
    disposer = observerContext.subscribe(() => {
      isDirty = true;
      signal.notify();
    });

    observerContext = undefined;

    return result;
  };

  return {
    get value() {
      if (observerContext) {
        observerContext.registerSignal(signal);
      }

      if (isDirty) {
        value = recompute();
        isDirty = false;
      }

      return value;
    },
  };
}

export function useSignals<T>() {
  const context = (observerContext = new ObserverContext());

  useSyncExternalStore(
    (update) => context.subscribe(update),
    () => ObserverContext.notifyCount
  );

  return (value: T): T => {
    observerContext = undefined;
    return value;
  };
}

export function useSignal<T>(initialValue: T) {
  const signalRef = useRef<{ value: T }>();

  if (!signalRef.current) {
    signalRef.current = signal(initialValue);
  }

  return signalRef.current;
}
