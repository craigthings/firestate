import { getFirestore, Firestore } from "firebase/firestore";

export default class FirestateDatabase {
  public db: Firestore;

  constructor(db: Firestore) {
    this.db = db;
  }

  public get path(): string {
    return "";
  }
}
