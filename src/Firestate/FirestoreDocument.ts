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

export default class FirestoreDocument<T> {
  public parent: FirestoreCollection<any, any>;
  public db: Firestore;
  public id: string = "";
  public schema: new () => any;
  public path: string = "";
  public data: T = {} as T;
  public originalData: T = {} as T;
  public synced: boolean = true;
  public latestRemoteData: T | null = null;
  private firestoreUnsubscribe: (() => void) | undefined;

  static schema: new () => any;

  constructor(
    parent: FirestoreCollection<any, any>,
    id: string,
    data: T | null = null
  ) {
    makeObservable(this, {
      data: observable,
      originalData: observable,
      synced: observable,
      latestRemoteData: observable,
      updateLocal: action,
      saveLocal: action,
      discardLocal: action,
      _updateData: action,
    });

    this.parent = parent;
    this.db = parent.db;
    this.path = `${parent.path}/${id}`;
    this.id = id;
    this.schema = new ((this.constructor as typeof FirestoreDocument).schema)();

    if (data) {
      this._updateData(data);
      this.originalData = { ...data };
    } else {
      const schemaInstance = new this.schema();
      this._updateData(schemaInstance);
      this.originalData = { ...schemaInstance };
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

  private subscribe() {
    this.firestoreUnsubscribe = onSnapshot(doc(this.db, this.path), (snapshot) => {
      let data = snapshot.data() as T;
      this._updateData(data);
    });
  }

  public validateData(data: Partial<T>): T {
    return { ...this.schema, ...data } as T;
  }

  public _updateData = (data: Partial<T>) => {
    const validatedData = this.validateData(data);
    runInAction(() => {
      if (this.synced) {
        this.data = validatedData;
        this.originalData = { ...validatedData };
      }
      this.latestRemoteData = validatedData;
    });
  };

  public updateLocal = (data: Partial<T>) => {
    runInAction(() => {
      this.data = { ...this.data, ...data };
      this.synced = false;
    });
  };

  public async saveLocal() {
    try {
      const validatedData = this.validateData(this.data);
      await updateDoc<any>(doc(this.db, this.path), validatedData);
      runInAction(() => {
        this.synced = true;
      });
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : String(error));
    }
  }

  public discardLocal() {
    runInAction(() => {
      if (this.latestRemoteData && this.synced === false) {
        this.data = this.latestRemoteData;
        this.originalData = this.latestRemoteData;
        this.synced = true;
      }
    });
  }

  public async update(data: Partial<T>) {
    let updatedData = this.validateData({ ...this.data, ...data });
    try {
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
    if (this.firestoreUnsubscribe) {
      this.firestoreUnsubscribe();
      this.firestoreUnsubscribe = undefined;
    }
  }
}