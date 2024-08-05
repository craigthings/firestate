import FirestoreDatabase from "../Firestate/FirestoreDatabase";
import FirestoreCollection from "../Firestate/FirestoreCollection";
import FirestoreDocument from "../Firestate/FirestoreDocument";
import { todoSchema, Todo } from "./Todo";
import TodoDocument from "./Todo";
import {
  CollectionReference,
  DocumentData,
  orderBy,
  query
} from "firebase/firestore";

export default class Todos extends FirestoreCollection<Todo, TodoDocument> {
  public query = (collectionRef: CollectionReference<DocumentData>) => {
    return query(collectionRef, orderBy("index"));
  };

  constructor(parent: FirestoreDatabase | FirestoreDocument<any>) {
    super(parent, "todos", TodoDocument);
  }

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
