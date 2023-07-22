type TPendingCachedPromise<T> = Promise<T> & {
  status: "pending";
  use(): T;
};

type TFulfilledCachedPromise<T> = Promise<T> & {
  status: "fulfilled";
  value: T;
  use(): T;
};

type TRejectedCachedPromise = Promise<never> & {
  status: "rejected";
  reason: unknown;
  use(): never;
};

export type CachedPromise<T> =
  | TPendingCachedPromise<T>
  | TFulfilledCachedPromise<T>
  | TRejectedCachedPromise;

// There is an official RFC for this hook: https://github.com/reactjs/rfcs/pull/229
export function usePromise<T>(promise: CachedPromise<T>) {
  if (isFulfilledCachedPromise(promise)) {
    return promise.value as T;
  }

  if (isRejectedCachedPromise(promise)) {
    throw promise.reason;
  }

  promise
    .then((value) => {
      makePromiseFulfilledCachedPromise(promise, value);
    })
    .catch((reason) => {
      makePromiseRejectedCachedPromise(promise, reason);
    });

  throw makePromisePendingCachedPromise(promise);
}

export function makePromiseFulfilledCachedPromise<T>(
  promise: Promise<T>,
  value: T
) {
  return Object.assign(promise, {
    status: "fulfilled",
    value,
    use: () => usePromise(promise as TFulfilledCachedPromise<T>),
  }) as TFulfilledCachedPromise<T>;
}

export function makePromiseRejectedCachedPromise(
  promise: Promise<unknown>,
  reason: unknown
) {
  return Object.assign(promise, {
    status: "rejected",
    reason,
    use: () => usePromise(promise as TRejectedCachedPromise),
  }) as TRejectedCachedPromise;
}

export function makePromisePendingCachedPromise<T>(promise: Promise<T>) {
  return Object.assign(promise, {
    status: "pending",
    use: () => usePromise(promise as TPendingCachedPromise<T>),
  }) as TPendingCachedPromise<T>;
}

export function isFulfilledCachedPromise(
  promise: unknown
): promise is TFulfilledCachedPromise<unknown> {
  return (
    promise instanceof Promise &&
    "status" in promise &&
    "value" in promise &&
    promise.status === "fulfilled"
  );
}

export function isRejectedCachedPromise(
  promise: unknown
): promise is TRejectedCachedPromise {
  return (
    promise instanceof Promise &&
    "status" in promise &&
    "reason" in promise &&
    promise.status === "rejected"
  );
}

export function create<T>(nativePromise: Promise<T>) {
  nativePromise
    .then((value) => {
      makePromiseFulfilledCachedPromise(nativePromise, value);
    })
    .catch((reason) => {
      makePromiseRejectedCachedPromise(nativePromise, reason);
    });

  return makePromisePendingCachedPromise(nativePromise);
}
