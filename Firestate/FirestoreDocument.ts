import {
  doc,
  getDoc,
  addDoc,
  deleteDoc,
  updateDoc,
  collection,
  onSnapshot
} from "firebase/firestore";
import { getFirestore, Firestore } from "firebase/firestore";
import FirestoreCollection from "./FirestoreCollection";
import { observable, action, makeObservable, runInAction } from "mobx";
import * as z from "zod";

export default class FirestoreDocument<T> {
  public parent: FirestoreCollection<any, any>;
  public db: Firestore;
  public id: string = "";
  public schema: z.ZodType<T>;
  public path: string = "";
  public data: T = {} as T;
  public originalData: T = {} as T;
  public synced: boolean = true;

  static schema: z.ZodType<any>;

  constructor(
    parent: FirestoreCollection<any, any>,
    id: string,
    data: T | null = null
  ) {
    makeObservable(this, {
      data: observable,
      originalData: observable,
      synced: observable,
      updateLocal: action,
      syncLocal: action,
      revertLocal: action,
      _updateData: action
    });

    this.parent = parent;
    this.db = parent.db;
    this.path = `${parent.path}/${id}`;
    this.id = id;
    this.schema = (this.constructor as typeof FirestoreDocument).schema;

    if (data) {
      this._updateData(data);
      this.originalData = { ...data };
    }
  }

  static create<T, K extends FirestoreDocument<T>>(
    this: new (...args: any[]) => K,
    parent: FirestoreCollection<any, any>,
    id: string,
    data: T | null = null
  ): K {
    return new this(parent, id, data);
  }

  protected subscribe() {
    this.unsubscribe = onSnapshot(doc(this.db, this.path), (snapshot) => {
      let data = snapshot.data() as T;
      this.schema.parse(data);
      runInAction(() => {
        this.data = data;
        this.originalData = { ...data };
        this.synced = true;
      });
    });
  }

  public _updateData = (data: T) => {
    this.schema.parse(data);
    runInAction(() => {
      this.data = data;
    });
  };

  public updateLocal = (data: Partial<T>) => {
    console.log("????");
    runInAction(() => {
      this.data = { ...this.data, ...data };
      this.synced = false;
    });
  };

  public async syncLocal() {
    try {
      this.schema.parse(this.data);
      await updateDoc<any>(doc(this.db, this.path), this.data);
      runInAction(() => {
        this.synced = true;
      });
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : String(error));
    }
  }

  public revertLocal() {
    runInAction(() => {
      this.data = { ...this.originalData };
      this.synced = true;
    });
  }

  public async update(data: Partial<T>) {
    let updatedData = { ...this.data, ...data };
    try {
      this.schema.parse(updatedData);
      await updateDoc<any>(doc(this.db, this.path), data);
      runInAction(() => {
        this._updateData(updatedData);
        this.synced = true;
      });
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : String(error));
    }
  }

  public async delete() {
    try {
      await deleteDoc(doc(this.db, this.path));
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : String(error));
    }
  }

  public unsubscribe() {
    if (this.unsubscribe) {
      this.unsubscribe();
    }
  }
}