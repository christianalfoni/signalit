# Getting Started

```bash
npm install signalit
```

## Example

```ts
import { signal, useSignals } from 'signalit'

const count = signal(0)

const SomeComponent = () => {
    const render = useSignals()
    
    return render(
        <div>
            <h4>The count is ${count.value}</h4>
            <button onClick={() => count.value++}>Increase</button>
        </div>
    )
}
```
