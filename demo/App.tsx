import todos from "./todos";
import { useSignal, useObserver } from "../src";

const JustATest = () => {
  return <div>{todos.todos.length}</div>;
};

export const App = () => {
  useObserver();
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
      <JustATest />
    </div>
  );
};
