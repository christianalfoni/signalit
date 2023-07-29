import todos from "./todos";
import { observe } from "../src";
import { Suspense, useEffect, useState } from "react";

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
  const [newTodoTitle, setNewTodoTitle] = useState('')

  const onTitleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setNewTodoTitle(event.target.value)
  };

  const onTitleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      todos.addTodo(newTodoTitle);
      setNewTodoTitle("")
    }
  };

  useEffect(() => todos.onFilteredTodosChange(console.log), [])

  useEffect(() => todos.onPromiseChanged(console.warn), [])

  return (
    <div className="App">
      <div
        style={{
          margin: "10px",
        }}
      >
        <input
          value={newTodoTitle}
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
