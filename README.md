# 📻 SignalIt
Simple and performant reactive primitive for React

**NOTE!** This tool is not ready for production as Prettier, Linters etc. needs to support the incoming `using` keyword for JavaScript/TypeScript. This should be available by end of August 2023

- 🗄️ Allows you to define observable state outside the component tree
- 🚀 Increases performance as components only reconciles based on what it observes
- 🔐 Does not use proxies to achieve reactiveness through mutation. It rather relies on simple getter/setter and treats its value as immutable, just like React expects
- 🐛 Uses [explicit resource management](https://github.com/tc39/proposal-explicit-resource-management) to observe signals in components, which eliminates overhead to the component tree and improves the debugging experience
- 🕐 Async signals with suspense
- :accessibility: Allows debugging and exploring signals at runtime with source mapped references to the code observing and changing signals. This allows you and fellow developers understand what CODE drives your state changes, not just abstract action names

**Table Of Contents**

- [Getting Started](#getting-started)
- [Example](#example)
- [API](#api)
    - [Signal](#signal)
    - [Signal.value](#signal.value)
    - [Signal.onChange](#signal.onChange)
    - [AsyncSignal](#asyncsignal)
    - [AsyncSignal.value](#asyncsignal.value)
    - [AsyncSignal.value.use](#asyncsignal.value.use)
    - [observer](#observe)
    - [useSignal](#usesignal)
- [Design Decisions](#design-decisions)

## Getting Started

```bash
npm install signalit
```


<img align="center" src="https://github.com/christianalfoni/signalit/assets/3956929/5c4a8b43-27a2-4553-a710-146d94fbc612" width="25"/> **TypeScript 5.2** (Currently in Beta)

<img align="center" src="https://github.com/christianalfoni/signalit/assets/3956929/eb74b1ea-0ff1-4d18-9ba5-97150408ae86" width="25"/> **@babel/plugin-proposal-explicit-resource-management**

## Example

```tsx
import { signal, observe } from 'signalit'

// Create a signal wherever
const count = signal(0)

const SomeComponent = () => {
    // Use the new "using" keyword to observe the component scope for signal access
    using _ = observe()
    
    // Access the value using "signal.value", which is also how you change it
    return (
        <div>
            <h4>The count is ${count.value}</h4>
            <button onClick={() => {
                count.value++
            }}>Increase</button>
        </div>
    )
}
```

## API

### Signal

The signal instance.

Created with factory `signal<T>(initialValue: T): Signal<T>`:

```ts
import { signal } from 'signalit'

const count = signal(0)
```

### Signal.value

Access and change the value.

```ts
import { signal } from 'signalit'

const count = signal(0)

// Access the current value
count.value

// Change the current value
count.value += 1
```

### Signal.onChange

Subscribe to changes on the signal with `Signal<T>.onChange(listener: (value: T, prevValue: T) => void): () => void`.

```ts
import { signal } from 'signalit'

const count = signal(0)

const dispose = count.onChange((newCount, prevCount) => {
  
})
```

### AsyncSignal

An async signal instance which enhances the promise with suspense support.

```ts
import { asyncSignal } from 'signalit'

// fetchSomeData returns a native Promise
const data = asyncSignal(fetchSomeData())

// AsyncSignal converts it to a CachedPromise
data.value
```

### AsyncSignal.value

Access and change the value of the promise.

```ts
import { signal } from 'signalit'

const data = signal(fetchSomeData())

// Immediately changes the promise, but will only notify observers when promise is resolved/rejected
data.value = fetchSomeOtherData()

// Just updating a signal promise with a new value keeps it as a promise and notifies observers 
// as the value is being resolved
data.value = {}
```

### AsyncSignal.value.use()

A hook which allows synchronous access to resolved values, throw to suspense when pending or throw to error boundary when rejected.

**Note!** This hook is likely to become a native hook in React in the near future.

```tsx
import { signal, observe } from 'signalit'

const dataPromise = signal(fetchSomeData())

const SomeComponent = () => {
    using _ = observe()

    // Will throw to suspense/error when pending/rejected, or synchronously access the promise
    // if it is already resolved
    const data = dataPromise.value.use()

    // When native hook available
    const data = use(dataPromise.value)
    
    return (
        <div>
            <h4>The data is ${data}</h4>
        </div>
    )
}
```

## observe()

Creates an observation context which stops observing when the component scope exits.

```tsx
import { signal, observe } from 'signalit'

const count = signal(0)

const SomeComponent = () => {
    // Creates the observation context
    using _ = observe()
    
    return (
        <div>
            <h4>The count is ${count.value}</h4>
        </div>
    )
    // Stops observing and subscribes to any signals observed
}
```

## useSignal()

Create using `useSignal<T>(initialValue: T): Signal<T>`. Local component state which is useful to embrace signals for state management. Also improves debugging experience.

```tsx
import { observe, useSignal } from 'signalit'

const SomeComponent = () => {
    using _ = observe()

    const count = useSignal(0)
    
    return (
        <div>
            <h4>The count is ${count.value}</h4>
            <button onClick={() => {
                count.value++
            }}>Increase</Button>
        </div>
    )
}
```

## Design Decisions

It was decided that **SignalIt** should be as simple as possible, with no magic and adhere to the principles of React. This is why there are no proxies, but rather a `setter` which creates the reactive mechanism. Even though you might define your signals in a mutable context, like classes, you will still change them with immutable principles. In other words you will always replace the signal value, never change nested objects or use other mutable APIs like array push etc.

To understand why **SignalIt** approach observability with the `using` keyword you have to understand the tradeoffs being made with existing approaches.

The most straight forward way to observe changes is with a **higher order component**:

```tsx
import { signal, observer } from 'signalit'

const count = signal(0)

const SomeComponent = observer(() => {
    return (
        <div>
            {count.value}
        </div>
    )
})
```

Here we create a higher order component which encapsulates the observing in the component function body. From a syntax and mental model perspective this makes a lot of sense, but it has several drawbacks.

**It fills up your component tree** with wrapper components named `Observer` where your previously named components becomes an `Anonymous` child in the React Developer tools. Having these wrapper components and lack of named components it not ideal for debugging purposes.

**Passing refs** will now require you to do a `forwardRef` as we are passing the ref through a parent component. It is not often you do this, but it is not ideal.

We could use an `Observer` component which creates its own isolated scope for tracking signals as well:

```tsx
import { signal, Observer } from 'signalit'

const count = signal(0)

const SomeComponent = () => {
    return (
        <Observer>
            {() => (
                <div>
                    {count.value}
                </div>
            )}
        </Observer>
    )
}
```


The drawback of the `Observer` component is that it only works in JSX, meaning any tracking of signals used related to hooks will not be tracked.

We could also go for a `useSignals` hook which would prevent the drawbacks of previous approachs:

```tsx
import { signal, useSignals } from 'signalit'

const count = signal(0)

const SomeComponent = () => {
    return useSignals(() => (
        <div>
            {count.value}
        </div>
    ))
}
```

But the `useSignals` hook has subtle, but important drawbacks to highlight. For example when you want to track signals related to an other hook:

```tsx
import { signal, observer } from 'signalit'

const count = signal(0)

const SomeComponent = () => {
    return useSignals(() => {
        useEffect(() => {
          console.log("Count has changed", count.value)    
        }, [count.value])
        
        return (
            <div>
                {count.value}
            </div>
        )
    })
}
```

Even though technically `signalit` can guarantee that the callback of `useSignals` always runs, also ensuring that all hooks expressed inside runs, any static code analysis can not. Just like how `new Promise(() => {})` runs synchonously, but TypeScript will yell if you try to access an optional property already verified in the outer scope. This can cause issues with linting and also typescript evaluating values in the outside component scope.

Additionally it creates quite of an exotic API that could be misused. For example users might start doing:

```tsx
import { signal, observer } from 'signalit'

const count = signal(0)

const SomeComponent = () => {
    const signals = useSignals(() => ({ count: count.value }))
}
```

Which really goes against the concept of signals as you are now explicitly subscribing to signals as opposed to let the nature of just accessing a signal in a component creating the subscription.

With **explicit resource management**, or the `using` keyword, we are able to resolve all the before mentioned issues.

```tsx
import { signal, observe } from 'signalit'

const count = signal(0)

const SomeComponent = () => {
    using _ = observe()
    
    useEffect(() => {
        console.log("Count has changed", count.value)    
    }, [count.value])
    
    return (
        <div>
            {count.value}
        </div>
    )
}
```

**We specifically avoid**:

- Flooding our component tree with wrapper components
- Components without a name
- Forward refs
- Having multiple ways to express observation
- Risking wrong usage of API
- Linter issues

You can certainly argue that using a new API of the language is not ideal, especially when it means using a new keyword like `using`. I would expect a similar pushback like `async/await`, but this is the right tool for the job.