import todos from "./todos";
import { useSignal, observer, useSignalPromise } from "../src";
import { Suspense } from "react";

const JustATest = () => {
  using _ = observer()
  
  const foo = useSignalPromise(todos.promise);
  return (
    <div>
      <div onClick={() => todos.changePromise()}>{foo}</div>
      <div>{todos.todos.length}</div>
    </div>
  );
}

export const App = () => {
  using _ = observer()
  
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
      <Suspense fallback={<h4>Loading...</h4>}>
        <JustATest />
      </Suspense>
      
    </div>
  );
}
