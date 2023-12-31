import type { ObserverContext } from "./ObserverContext";

export class Signal {
  private contexts = new Set<ObserverContext>();
  constructor(public getValue: () => unknown) {}
  addContext(context: ObserverContext) {
    this.contexts.add(context);
  }
  removeContext(context: ObserverContext) {
    this.contexts.delete(context);
  }
  notify() {
    this.contexts.forEach((context) => context.notify());
  }
}
