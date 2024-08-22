import { FirestateDocument } from "../Firestate";
import TodosCollection from "./TodoCollection";
import { type TodoSchema } from "./TodoCollection";

export class TodoDocument extends FirestateDocument<TodoSchema, TodosCollection> {
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