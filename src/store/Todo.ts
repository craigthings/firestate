import FirestoreDocument from "../Firestate/FirestoreDocument";
import Todos from "./Todos";

export class TodoDefaults {
  name = "";
  index = 0;
  done = false;
}

export class TodoDocument extends FirestoreDocument<TodoDefaults> {
  static schema = TodoDefaults;
  public parent: Todos;

  toggleDone = () => {
    this.update({ done: !this.data.done });
  };

  setName = (name: string) => {
    this.update({ name });
  };

  setIndex = (index: number) => {
    this.update({ index });
  };

  remove = () => {
    this.delete();
  };
}