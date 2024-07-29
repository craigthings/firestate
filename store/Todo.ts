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

  constructor(parent: Todos, id: string, schema: any, data: Todo) {
    super(parent, id, todoSchema, data);
  }

  toggleDone = () => {
    if (this.data.done) {
      this.update({ done: false });
    } else {
      this.update({ done: true });
    }
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
