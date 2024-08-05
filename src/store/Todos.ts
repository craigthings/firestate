import FirestoreCollection from "../Firestate/FirestoreCollection";
import { TodoDocument, TodoDefaults } from "./Todo";
import { orderBy, query } from "firebase/firestore";

export default class Todos extends FirestoreCollection<TodoDefaults, TodoDocument> {
  static documentClass = TodoDocument;
  static collectionName = "todos";

  public query = this.createQuery((collectionRef) => {
    return query(collectionRef, orderBy("index"));
  });

  create = (name: string, index: number, done: boolean) => {
    this.add({ name, index, done });
  };

  remove = async (id: string) => {
    await this.get(id).delete();
  };

  getByIndex = (index: number) => {
    return this.children.find((todo) => todo.data.index === index);
  };
}