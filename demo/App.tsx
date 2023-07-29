import todos from "./todos";
import { useSignal, observe } from "../src";
import { Suspense, useEffect } from "react";
import { ObserverContext } from "../src/ObserverContext";

const PromiseComponent = () => {
  using _ = observe()

  const value = todos.promise.use()
  
  return (
    <h3 onClick={() => todos.changePromise()}>
      {value}
    </h3>
  )
}

export const App = () => {
  using _ = observe()
  
  const newTodoTitle = useSignal("");

  const onTitleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    newTodoTitle.value = event.target.value;
  };

  const onTitleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      todos.addTodo(newTodoTitle.value);
      newTodoTitle.value = "";
    }
  };

  useEffect(() => todos.onFilteredTodosChange((value, prevValue) => {
    console.log("Filtered todos changed", value, prevValue)
  }), [])

  useEffect(() => todos.onPromiseChanged((value, prevValue) => {
    console.warn("Promise changed", value, prevValue)
  }), [])

  return (
    <div className="App">
      <div
        style={{
          margin: "10px",
        }}
      >
        <input
          value={newTodoTitle.value}
          onChange={onTitleChange}
          onKeyDown={onTitleKeyDown}
        />
      </div>
      
      <button
        onClick={() => {
          todos.changeFilter("all");
        }}
      >
        All
      </button>
      <button
        onClick={() => {
          todos.changeFilter("remaining");
        }}
      >
        Remaining
      </button>
      <button
        onClick={() => {
          todos.changeFilter("completed");
        }}
      >
        Completed
      </button>
      <div>
        <ul>
          {todos.todos.map((todo, index) => (
            <li key={index}>
              <input
                type="checkbox"
                checked={todo.completed}
                onChange={() => todo.toggleCompleted()}
              />{" "}
              {todo.title}
            </li>
          ))}
        </ul>
      </div>   
      <Suspense fallback="Loading...">
        <PromiseComponent />
      </Suspense>
    </div>
  );
}
