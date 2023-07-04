# Understanding The Design

There are several implementations of reactive state for React. What sets `signalit` apart is that it does not force you into a specifc programming paradigm, but rather encourages good programming practices. You can use it for traditional object oriented code with classes:

```ts
import { signal } from 'signalit'

class SomeFeature {
  count = signal(0)    
}
```

Or just use a module pattern:

```ts
import { signal } from 'signalit'

export const count = signal(0)
```

## Signal.value

The usage of `signal.value` is a technical requirement to enable observing changes to the value, but it could have been expressed differently:

```ts
// An explicit getter and setter
signal.get()
signal.set(1)

// Function call getter and setter
signal()
signal(1)
```

The reason `signal.value` was chosen is that it does not hint to any specific programming paradigm, like object oriented programming. It also reflects how values are accessed in JavaScript at a low level, meaning it is natural to use in any programming paradigm and context. From a stylistic perspective it also avoids expressing that there is something "special" or "heavy" about accessing these signals. They are plain values, using getters/setters under the hood.

## Consuming signals

There are also alternatives in expressing how a component would consume signals. What we need to achieve is to create an active `ObserverContext` and let React subscribe to any signals accessed during the execution of the component function body.

For `signalit` it is valued to have one way to approach observation of signals, which means it needs to decide which one of them is most flexible with as little drawbacks as possible.

### Higher Order Component

The most straight forward way to do this is:

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

**Render callbacks** can not use the **observer** higher order component directly:

```tsx
import { signal, observer } from 'signalit'

const count = signal(0)

const SomeComponent = observer(() => {
    return (
        <div>
            <SomeOtherComponent item={() => <div>{count.value}</div>} />
        </div>
    )
})
```

You are forced to lift the contents of the callback into its own observed component.

## Observer component

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

## Observer hook

A hook would prevent the drawbacks of both previous approach:

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

## Explicit resource management

A new feature to JavaScript and TypeScript is **explicit resource management**. In practice you are able to use an object during the lifetime of a scope and it will automatically dispose of itself when the scope is dropped. This is a perfect solution for the problem we are trying to solve. Now we get rid of all the previous mentioned drawbacks:

```tsx
import { signal, observer } from 'signalit'

const count = signal(0)

const SomeComponent = () => {
    using _ = observer()
    
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

Now we avoid the following:

- Flooding our component tree with wrapper components
- Components without a name
- Forward refs
- Having multiple ways to express observation
- Risking wrong usage of API

You can certainly argue that using a new API of the language is not ideal, especially when it means using a new keyword like `using`. I would expect a similar pushback like `async/await`, but this is the right tool for the job.

## Async signals

With a new hook called `use` React will get first class support for promises. A part of this specification is that the hook expects to be able to read resolved promises synchonously. This is not possible with native promises, but can be extended to do so. This hook is currently not available, but `signalit` takes inspiration from the current suggestion to create first class promise support in signals. This means whenever you give a signal a promise it will optimally notify React when it is ready for consumption and you can use the accompanying `useSignalPromise` hook to get suspense behaviour with synchronous reads from resolved promises. When `use` is released, it should be a simple swap.

## Control state access

The API needs to fit with common principles like controlling access to state. As an example you want to control how a signal is changed from within the class:

```ts
import { signal } from 'signalit'

class SomeClass {
    private _count = signal(0)
    get count() {
        return this._count.value
    }
    increaseCount() {
        this._count.value++
    }
}
```

The same would apply for the module pattern:

```ts
import { signal } from 'signalit'

const count = signal(0)

export default {
    get count() {
        return count.value
    },
    increaseCount() {
        count.value++
    }
}
```






