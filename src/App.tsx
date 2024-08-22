import "./styles.css";
import store from "./store/RootStore";
import { observer } from "mobx-react";
import Todo from "./components/Todo";
import NewTodoForm from "./components/NewTodoForm";

Object(window).store = store;

function App() {
  let todos = store.todos.docs;

  const handleSubmit = (name: string) => {
    store.todos.addNew(name, store.todos.docs.length, false);
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
