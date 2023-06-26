import { useEffect, useMemo, useRef, useState } from "react";
import { ObserverContext } from "./ObserverContext";
import { Signal } from "./Signal";

let observerContext: ObserverContext | undefined;

export function useSignals<T extends () => any>(fn: T, deps?: any[]) {
  const [version, setState] = useState(0);

  const context = (observerContext = new ObserverContext(() =>
    setState((current) => current + 1)
  ));

  const result = deps ? useMemo(() => fn(), [version, ...deps]) : fn();

  useEffect(() => context.subscribe(), [context]);

  observerContext = undefined;

  return result;
}

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

    observerContext = new ObserverContext(() => {
      isDirty = true;
      signal.notify();
    });

    const result = cb();
    disposer = observerContext.subscribe();

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
