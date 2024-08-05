import FirestoreDocument from "../Firestate/FirestoreDocument";
import * as z from "zod";
import Todos from "./Todos";

let schema = z.object({
  name: z.string(),
  index: z.number(),
  done: z.boolean(),
});

export type TodoSchema = z.infer<typeof schema>;

export default class TodoDocument extends FirestoreDocument<TodoSchema> {
  static schema = schema;
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
