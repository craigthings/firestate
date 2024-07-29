import "./styles.css";
import store from "../store/Root";
import { observer } from "mobx-react";
import Todo from "./components/Todo";
import NewTodoForm from "./components/NewTodoForm";

Object(window).store = store;

function App() {
  let todos = store.todos.children;

  const handleSubmit = (name: string) => {
    store.todos.create(name, store.todos.children.length, false);
  };

  return (
    <div>
      <NewTodoForm onSubmit={handleSubmit} />

      {todos.map((todo) => (
        <Todo doc={todo} key={todo.id} />
      ))}
    </div>
  );
}

export default observer(App);
