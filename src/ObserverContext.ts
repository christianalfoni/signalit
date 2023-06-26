import type { Signal } from "./Signal";

export class ObserverContext {
  private signals = new Set<Signal>();
  constructor(private onUpdate: () => void) {}
  registerSignal(signal: Signal) {
    this.signals.add(signal);
  }
  /**
   * There is only a single subscriber to any ObserverContext
   */
  subscribe() {
    this.signals.forEach((signal) => {
      signal.addContext(this);
    });

    return () => {
      this.signals.forEach((signal) => {
        signal.removeContext(this);
      });
    };
  }
  notify() {
    this.onUpdate();
  }
}
