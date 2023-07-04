import React, { useState } from "react";
import ReactDOM from "react-dom/client";
import { App } from "./App";

Symbol.dispose ??= Symbol("Symbol.dispose");

const AppWrapper = () => {
  const [show, setShow] = useState(true);

  return (
    <div>
      <button onClick={() => setShow((current) => !current)}>Toggle</button>
      {show ? <App /> : null}
    </div>
  );
};

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <AppWrapper />
  </React.StrictMode>
);
