# Async Signals

An exciting feature of signals is that they support the upcoming first class support for promises in React. This does not only make it easier to consume promises in React, but it also solves a fundamental issue on how you express and consume asynchronous values.

## Accessing async values

A challenging aspect of dealing with asynchronous values comes first and foremost from the perspective of a component:

```tsx
const SomeComponent = ({ id }) => {
    const [data, setData] = useState(null)
    
    useEffect(() => {
        getSomeData(id).then(setData)
    }, [])
    
    if (!data) {
        return 'Loading...'
    }
    
    return data
}
```

You need to separate the promise from the actual reading of the value inside of it. With the new first class support for promises in React you would express the same thing as:

```tsx
const SomeComponent = ({ id }) => {
    const data = use(getSomeData(id))
    
    return data
}
```

During a pending promise it throws to the `Suspense` boundary and with an error, to the `ErrorBoundary`. When the component renders after the promise is resolved, just like `useState`, it keeps the initial promise of the hook.

But there is a limitation here and that limitation is caching. If other components needed the same data, or the data needed to be accessed later, there is no mechanism in React that deals with this.

There are certainly libraries that deals with caching promises, but they are all tied to the context of React, whereas we need to access these promises from outside of React.

An implementation of this could look something like:

```ts
const dataCache = <{
    [id: string]: Signal<Data>
}> = {}

export default {
    getData(id: string) {
        if (!dataCache[id]) {
            dataCache[id] = signal(getSomeData(id))
        }
        
        return dataCache[id].value
    }
}
```

The signal will enhance the promise with the status of the promise, so regardless of when it is accessed by a component it can be accessed synchronously if already resolved.

```tsx
const SomeComponent = ({ id }) => {
    using _ = observer()
    const data = use(dataModule.getData(id))
    
    return data
}
```

But what if we want to refresh the data? Since this is a signal the promise is already observered by the component. That means if we wanted to refresh the data, we could replace the signal value with a new promise:

```ts
const dataCache = <{
    [id: string]: Signal<Data>
}> = {}

export default {
    getData(id: string) {
        if (!dataCache[id]) {
            dataCache[id] = signal(getSomeData(id))
        }
        
        return dataCache[id].value
    },
    refreshData(id: string) {
        if (dataChache[id]) {
            dataCache[id].value = getSomeData(id)    
        }
    }
}
```

Now, the signal value is immediately updated, but since it already contained a resolved promise it will not notify a signal update until the new promise is resolved. That means any components consuming this signal will not update until the new promise is resolved. Which is great, as there will be no new suspending of the component.

This is also related to subscriptions:

```ts
const dataCache = <{
    [id: string]: {
        signal: Signal<Data>,
        disposeSubscription: () => void
    }
}> = {}

export default {
    getData(id: string) {
        if (!dataCache[id]) {
            const signal = signal(getSomeData(id))
            dataCache[id] = {
                signal,
                disposeSubscription: subscribeSomeData(id, (updatedData) => {
                    signal.value = Promise.resolve(updatedData)
                })
            }
        }
        
        return dataCache[id].signal.value
    },
    refreshData(id: string) {
        if (dataChache[id]) {
            dataCache[id].signal.value = getSomeData(id)    
        }
    }
}
```

Now we keep the data as an asynchronous value, a promise, even though we update the value inside the signal. Again any consuming components will not be notified until the new promise is resolved.