import { FirestateDocument } from "../Firestate";
import type Todos from "./Todos";
import { type TodoSchema } from "./Todos";

export class TodoDocument extends FirestateDocument<TodoSchema, Todos> {

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