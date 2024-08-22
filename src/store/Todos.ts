import { FirestateCollection, FirestateDatabase } from "../Firestate";
import { TodoDocument, TodoDefaults } from "./Todo";
import { orderBy, query } from "firebase/firestore";

export default class Todos {

  constructor(
    public parent: FirestateDatabase,
    public collection = new FirestateCollection<TodoDefaults, TodoDocument>(
      parent,
      {
        documentClass: TodoDocument,
        collectionName: "todos",
        documentSchema: TodoDefaults,
        query: (collectionRef) => query(collectionRef, orderBy("index")),
      }
    )
  ) {}

  addNew = (name: string, index: number, done: boolean) => {
    this.collection.add({ name, index, done });
  };

  remove = async (id: string) => {
    await this.collection.get(id)?.delete();
  };

  getByIndex = (index: number) => {
    return this.collection.docs.find((todo) => todo.data.index === index);
  };
}