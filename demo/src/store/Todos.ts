import FirestateCollection from "firestate/FirestateCollection";
import { TodoDocument, TodoDefaults } from "./Todo";
import { orderBy, query } from "firebase/firestore";

export default class Todos extends FirestateCollection<TodoDefaults, TodoDocument> {
  static documentClass = TodoDocument;
  static collectionName = "todos";

  public query = this.createQuery((collectionRef) => {
    let q = query(collectionRef, orderBy("index"));
    console.log('q',q);
    return q;
  });

  addNew = (name: string, index: number, done: boolean) => {
    this.add({ name, index, done });
  };

  remove = async (id: string) => {
    await this.get(id).delete();
  };

  getByIndex = (index: number) => {
    return this.docs.find((todo) => todo.data.index === index);
  };
}