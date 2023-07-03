import type { Signal } from "./Signal";

Symbol.dispose ??= Symbol("Symbol.dispose");

export class ObserverContext {
  static current?: ObserverContext;
  static prev?: ObserverContext;
  private _signals = new Set<Signal>();
  private _onUpdate?: () => void;
  private _snapshot: { signals: unknown[] } = {
    signals: [],
  };
  get snapshot() {
    return this._snapshot;
  }
  constructor() {
    ObserverContext.prev = ObserverContext.current;
    ObserverContext.current = this;
  }
  registerSignal(signal: Signal) {
    this._signals.add(signal);

    this._snapshot.signals.push(signal.getValue());
  }
  /**
   * There is only a single subscriber to any ObserverContext
   */
  subscribe(onUpdate: () => void) {
    this._onUpdate = onUpdate;
    this._signals.forEach((signal) => {
      signal.addContext(this);
    });

    return () => {
      this._signals.forEach((signal) => {
        signal.removeContext(this);
      });
    };
  }
  notify() {
    this._snapshot = {
      ...this._snapshot,
    };
    this._onUpdate?.();
  }

  [Symbol.dispose]() {
    ObserverContext.current = ObserverContext.prev;
  }
}
