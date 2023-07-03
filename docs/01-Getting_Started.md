# Getting Started

```bash
npm install signalit
```

When using `babel` you currently need the `@babel/plugin-proposal-explicit-resource-management` plugin and TypeScript 5.2.

## Example

```ts
import { signal, observer } from 'signalit'

const count = signal(0)

const SomeComponent = () => {
    using _ = observer()
    
    return (
        <div>
            <h4>The count is ${count.value}</h4>
            <button onClick={() => count.value++}>Increase</button>
        </div>
    )
}
```

## For what kinds of apps?

`signalit` is built for rich single page applications. These are applications that has a high level of client side managed state and granular control of data fetching, caching and other asynchronous flows. Route related data fetching and server side rendering are not the main drivers of the application where frameworks like Next JS or Remix would be indicators of not being a good fit for this library.