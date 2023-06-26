# Getting Started

```bash
npm install signalit
```

## Example

```ts
import { signal, useSignals } from 'signalit'

const count = signal(0)

const SomeComponent = () => {
    return useSignals(() => (
        <div>
            <h4>The count is ${count.value}</h4>
            <button onClick={() => count.value++}>Increase</button>
        </div>
    ))
}
```

## 
