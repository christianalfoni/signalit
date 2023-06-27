import type { Signal } from "./Signal";

export class ObserverContext {
  static notifyCount = 0;
  private _signals = new Set<Signal>();
  onUpdate?: () => void;
  registerSignal(signal: Signal) {
    this._signals.add(signal);
  }
  /**
   * There is only a single subscriber to any ObserverContext
   */
  subscribe(onUpdate: () => void) {
    this.onUpdate = onUpdate;
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
    ObserverContext.notifyCount++;
    this.onUpdate?.();
  }
}
