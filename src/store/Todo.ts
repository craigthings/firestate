import { FirestateDocument } from "../Firestate";
import type Todos from "./Todos";

export class TodoDefaults {
  name = "";
  index = 0;
  done = false;
}

export class TodoDocument extends FirestateDocument<TodoDefaults, Todos> {
  static schema = TodoDefaults;

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