import { compute, signal } from "../src";

export interface Todo {
  title: string;
  completed: boolean;
  changeTitle(newTitle: string): void;
  toggleCompleted(): void;
}

export type Filter = "all" | "completed" | "remaining";

function createTodo(initialTitle: string): Todo {
  const title = signal(initialTitle);
  const completed = signal(false);

  return {
    get title() {
      return title.value;
    },
    get completed() {
      return completed.value;
    },
    changeTitle(newTitle: string) {
      title.value = newTitle;
    },
    toggleCompleted() {
      completed.value = !completed.value;
    },
  };
}

const todos = signal<Todo[]>([]);
const filter = signal<Filter>("all");

const filteredTodos = compute(() =>
  todos.value.filter((todo) => {
    if (filter.value === "all") {
      return true;
    } else if (filter.value === "completed" && todo.completed) {
      return true;
    } else if (filter.value === "remaining" && !todo.completed) {
      return true;
    }

    return false;
  })
);

const promise = signal(
  new Promise<string>((resolve) => {
    setTimeout(() => resolve("MIIIP"), 5000);
  })
);

export default {
  get todos() {
    return filteredTodos.value;
  },
  get promise() {
    return promise.value;
  },
  addTodo(title: string) {
    todos.value = [createTodo(title), ...todos.value];
  },
  changeFilter(newFilter: Filter) {
    filter.value = newFilter;
  },
  changePromise() {
    promise.value = new Promise<string>((resolve) => {
      setTimeout(() => resolve("HOHO"), 2000);
    });
  },
};
