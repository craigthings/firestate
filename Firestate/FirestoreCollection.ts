import FirestoreDocument from "./FirestoreDocument";
import FirestoreDatabase from "./FirestoreDatabase";
import {
  getFirestore,
  Firestore,
  CollectionReference
} from "firebase/firestore";
import {
  doc,
  getDoc,
  addDoc,
  deleteDoc,
  updateDoc,
  collection,
  onSnapshot,
  query,
  QuerySnapshot,
  DocumentData,
  orderBy
} from "firebase/firestore";
import { observable, IObservableArray, action, makeObservable } from "mobx";
import * as z from "zod";

export default class FirestoreCollection<T, K extends FirestoreDocument<T>> {
  protected parent:
    | FirestoreDocument<any>
    | FirestoreCollection<any, any>
    | FirestoreDatabase;
  protected schema: z.ZodType<T>;
  public db: Firestore;
  public path: string;
  public children: Array<K> = [];
  public docs: Array<T> = [];
  public subscribed: boolean = false;
  protected DocumentClass: {
    new (parent: FirestoreCollection<T, K>, id: string, data: T | null): K;
    create(parent: FirestoreCollection<T, K>, id: string, data: T | null): K;
    schema: z.ZodType<T>;
  };
  public get collectionRef() {
    return collection(this.db, this.path);
  }
  public query = (collectionRef: CollectionReference<DocumentData>) => {
    return query(collectionRef);
  };

  constructor(
    parent: FirestoreDocument<any> | FirestoreDatabase,
    path: string,
    DocumentClass: typeof FirestoreDocument<T>
  ) {
    this.parent = parent;
    this.path = `${parent.path}/${path}`;
    this.db = parent.db;
    this.DocumentClass = DocumentClass as any;
    this.schema = DocumentClass.schema;

    makeObservable(this, {
      docs: observable,
      children: observable,
      updateData: action,
      initializeData: action
    });
  }

  public subscribe = () => {
    return new Promise((resolve, reject) => {
      this.unsubscribe = onSnapshot(
        this.query(collection(this.db, this.path)),
        (snapshot: QuerySnapshot<DocumentData>) => {
          this.handleDataChanges(snapshot, resolve);
        }
      );
      this.subscribed = true;
    });
  };

  private handleDataChanges = (
    snapshot: QuerySnapshot<DocumentData>,
    resolve: (value: unknown) => void
  ) => {
    if (this.subscribed) {
      this.updateData(snapshot, resolve);
    } else {
      this.initializeData(snapshot, resolve);
    }
  };

  public updateData = (
    snapshot: QuerySnapshot<DocumentData>,
    resolve: (value: unknown) => void
  ) => {
    const data = snapshot.docs.map((doc) => {
      return { id: doc.id, ...doc.data() } as T;
    });
    this.docs = data;

    snapshot.docChanges().forEach((change) => {
      if (change.type === "added") {
        this.children.push(
          this.DocumentClass.create(this, change.doc.id, change.doc.data() as T)
        );
      }
      if (change.type === "modified") {
        this.children
          .find((child) => child.id === change.doc.id)
          ._updateData(change.doc.data() as T);
      }
      if (change.type === "removed") {
        this.children = this.children.filter((doc) => doc.id !== change.doc.id);
      }
    });
    resolve(this.children);
  };

  initializeData = (
    snapshot: QuerySnapshot<DocumentData>,
    resolve: (value: unknown) => void
  ) => {
    const data = snapshot.docs.map((doc) => {
      return { id: doc.id, ...doc.data() } as T;
    });
    this.docs = data;
    snapshot.docs.forEach((doc) => {
      this.children.push(
        this.DocumentClass.create(this, doc.id, doc.data() as T)
      );
    });
    resolve(this.children);
  };

  public async add(data: T) {
    try {
      this.schema.parse(data);
      const docRef = await addDoc(collection(this.db, this.path), data);
      return this.DocumentClass.create(this, docRef.id, data);
    } catch (error) {
      throw new Error(error);
    }
  }

  public async delete(id: string) {
    try {
      await deleteDoc(doc(this.db, this.path, id));
    } catch (error) {
      throw new Error(error);
    }
  }

  public async update(id: string, data: T) {
    try {
      this.schema.parse(data);
      await updateDoc<any>(doc(this.db, this.path, id), data);
    } catch (error) {
      throw new Error(error);
    }
  }

  public get(id: string) {
    // return await getDoc<any>(doc(this.db, this.path, id))
    return this.children.find((child) => child.id === id);
  }

  public unsubscribe() {
    if (this.unsubscribe) {
      this.unsubscribe();
    }
  }
}