import FirestoreDocument from "../Firestate/FirestoreDocument";
import * as z from "zod";
import Todos from "./Todos";

export let todoSchema = z.object({
  name: z.string(),
  index: z.number(),
  done: z.boolean(),
});

export type Todo = z.infer<typeof todoSchema>;

export default class TodoDocument extends FirestoreDocument<Todo> {
  static schema = todoSchema;
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
