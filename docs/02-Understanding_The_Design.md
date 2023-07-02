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

The reason `signal.value` was chosen is that it does not hint to any specific programming paradigm, like object oriented programming. It also reflects how values are normally accessed in JavaScript, meaning it is natural to use in any programming paradigm and context. From a stylistic perspective it also avoids expressing that there is something "special" or "heavy" about accessing these signals. They are plain values, using getters/setters.

## Prevent state access

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

## Consuming signals

There are also alternatives in expressing how a component would consume signals. What we need to achieve is to create an active `ObserverContext` and let React subscribe to any signals accessed durig the execution of the component function body.

The most straight forward way to keep this `ObserverContext` bound to the execution of the component function body is to create an `observer` higher order component:

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

This would work, but you will be accessing signals in many components and having these higher order components spread through your component tree is not ideal. Many developers prefer defining their component as a normal function, but here we are pushed towards using an anonymous arrow function as the the following example shows how unnatural the usage of it would be:

```tsx
export const SomeExportedComponent = observer(function SomeExportedComponent() {})

function SomeComponent {}

export default observer(SomeComponent)
```

In addition you will need to use `forwardRef`.


We could use an `Observer` component instead:

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

As we want to avoid having multiple ways to observe signals this approach is really out of the question, cause it only works for signals expressed in JSX.

To avoid the issues stated we have to look closer at how we can use a hook:

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

With a `useSignals` hook we avoid creating a higher order component, but we still have some issues. Returning JSX from a hook like this creates conceptual confusion. You do not normally relate hooks to creating JSX. But more importantly it

```tsx

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

Even though technically `signalit` can guarantee that the callback of `useSignals` always runs, also ensuring that all hooks expressed inside runs, any outside code analysis can not. Just like how `new Promise(() => {})` runs synchonously, but TypeScript will yell if you try to access an optional property already verified in the outer scope.

If we go down the path of using `observer` we require you to pass all React references as `forwardRef`, due to the `observer` being a higher order component. Also we create friction exporting named components:


But there is one more way to express this observing of signals:

```tsx
const SomeComponent = () => {
    const render = useSignals()
    
    return render(
        <div>
            {count.value}
        </div>
    )
}
```

Now we create an `ObserverContext` first which tracks signal access until its returned `render` function is called. This is exactly what the previous `useSignals` hook does, but we are not using a callback anymore.

One can easily argue that this API is not intuitive at first glance, but it does solve all the issues:

- No HOC forcing usage of `forwardRef` and breaking common export patterns
- No risk of code analysis tools creating errors when using hooks inside a callback
- You typically already return JSX using parenthesis, we just make it a function call

What about **suspense** though? Between `useSignals` and `render` the component could throw. This is actually not a problem and the reason is that every call to the component body creates a new `ObserverContext` and even though we track signals accessed until something throws, we do not subscribe to them until the component body is executed. That means the garbage collector will just throw away this "partial" `ObserverContext`.


