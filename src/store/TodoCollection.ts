import { FirestateCollection, FirestateDatabase } from "../Firestate";
import { TodoDocument } from "./TodoDocument";
import { orderBy, query } from "firebase/firestore";

export class TodoSchema {
  name = "";
  index = 0;
  done = false;
}

export default class TodoCollection extends FirestateCollection<TodoSchema, TodoDocument> {
  static documentClass = TodoDocument;
  static documentSchema = TodoSchema;
  static collectionName = "todos";
  public query = this.setQuery(orderBy("done", "asc"));

  setOrderByIndex = () => {
    this.setQuery(orderBy("index"));
  };

  setOrderByDone = () => {
    this.setQuery(orderBy("done", "asc"));
  };

  addNew = (name: string, index: number, done: boolean) => {
    this.add({ name, index, done });
  };

  remove = async (id: string) => {
    await this.get(id)?.delete();
  };

  getByIndex = (index: number) => {
    return this.docs.find((todo) => todo.data.index === index);
  };
}