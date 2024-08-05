import "./styles.css";
import { observer } from "mobx-react";
import TodoDocument from "../../store/Todo";

function Todo(props: { doc: TodoDocument }) {
  let todo = props.doc;
  let { name, done } = todo.data;

  const handleCheckboxChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    todo.update({ done: event.target.checked });
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    todo.update({ name: event.target.value });
  };

  const handleDelete = (event: React.MouseEvent<HTMLButtonElement>) => {
    todo.remove();
  };

  return (
    <div className="todo">
      <input type="checkbox" checked={done} onChange={handleCheckboxChange} />
      <input type="text" value={name} onChange={handleInputChange} />
      <button onClick={handleDelete}>Delete</button>
    </div>
  );
}

export default observer(Todo);
