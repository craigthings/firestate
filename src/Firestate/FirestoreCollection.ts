import FirestoreDocument from "./FirestoreDocument";
import FirestoreDatabase from "./FirestoreDatabase";
import {
  getFirestore,
  Firestore,
  CollectionReference,
  DocumentSnapshot,
  WriteBatch,
  writeBatch,
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
  WithFieldValue,
  orderBy
} from "firebase/firestore";
import { observable, IObservableArray, action, makeObservable, runInAction } from "mobx";
import { Query } from "firebase/firestore";

export default class FirestoreCollection<T, K extends FirestoreDocument<T>> {
  protected parent:
    | FirestoreDocument<any>
    | FirestoreCollection<any, any>
    | FirestoreDatabase;
  protected schema: new () => T;
  private firestoreUnsubscribe: (() => void) | undefined;
  public db: Firestore;
  public path: string;
  public docs: Array<K> = [];
  public firestoreDocs: Array<T> = [];
  public subscribed: boolean = false;
  protected DocumentClass: {
    new (parent: FirestoreCollection<any, any>, id: string, data: T | null): K;
    create(parent: FirestoreCollection<any, any>, id: string, data: T | null): K;
    schema: new () => T;
  };
  public get collectionRef() {
    return collection(this.db, this.path);
  }
  protected createQuery<TQuery extends DocumentData = DocumentData>(
    queryFn: (collectionRef: CollectionReference<TQuery>) => Query<TQuery>
  ) {
    return queryFn;
  }

  public query = this.createQuery((collectionRef) => query(collectionRef));

  static documentClass: new (parent: FirestoreCollection<any, any>, id: string, data: any) => FirestoreDocument<any>;
  static collectionName: string;

  constructor(
    parent: FirestoreDocument<any> | FirestoreDatabase,
    path?: string
  ) {
    this.parent = parent;
    this.path = `${parent.path}/${path || (this.constructor as typeof FirestoreCollection).collectionName}`;
    this.db = parent.db;
    this.DocumentClass = (this.constructor as typeof FirestoreCollection).documentClass as any;
    this.schema = this.DocumentClass.schema;

    makeObservable(this, {
      firestoreDocs: observable,
      docs: observable,
      updateData: action,
      initializeData: action
    });
  }

  public subscribe = () => {
    return new Promise((resolve, reject) => {
      this.firestoreUnsubscribe = onSnapshot(
        this.query(collection(this.db, this.path)),
        (snapshot: QuerySnapshot<DocumentData>) => {
          this.handleDataChanges(snapshot, resolve);
        },
        (error) => {
          reject(error);
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
    this.firestoreDocs = data;

    snapshot.docChanges().forEach((change) => {
      if (change.type === "added") {
        this.docs.push(
          this.DocumentClass.create(this, change.doc.id, change.doc.data() as T)
        );
      }
      if (change.type === "modified") {
        const child = this.docs.find((child) => child.id === change.doc.id);
        if (child) {
          this.updateDocumentIfNewer(child, change.doc);
        }
      }
      if (change.type === "removed") {
        this.docs = this.docs.filter((doc) => doc.id !== change.doc.id);
      }
    });
    resolve(this.docs);
  };

  private updateDocumentIfNewer(child: K, doc: DocumentSnapshot<DocumentData>) {
    if (!doc.metadata.hasPendingWrites) {
      child._updateData(doc.data() as T);
    }
  }

  initializeData = (
    snapshot: QuerySnapshot<DocumentData>,
    resolve: (value: unknown) => void
  ) => {
    const data = snapshot.docs.map((doc) => {
      return { id: doc.id, ...doc.data() } as T;
    });
    this.firestoreDocs = data;
    snapshot.docs.forEach((doc) => {
      this.docs.push(
        this.DocumentClass.create(this, doc.id, doc.data() as T)
      );
    });
    resolve(this.docs);
  };

  public async add(data: Partial<T>) {
    try {
      const validatedData = { ...new this.schema(), ...data };
      const docRef = await addDoc(collection(this.db, this.path), validatedData as WithFieldValue<DocumentData>);
      return this.DocumentClass.create(this, docRef.id, validatedData);
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : String(error));
    }
  }

  public async delete(id: string) {
    try {
      await deleteDoc(doc(this.db, this.path, id));
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : String(error));
    }
  }

  public async update(id: string, data: Partial<T>) {
    try {
      const validatedData = { ...new this.schema(), ...data };
      await updateDoc<any>(doc(this.db, this.path, id), validatedData);
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : String(error));
    }
  }

  public get(id: string) {
    // return await getDoc<any>(doc(this.db, this.path, id))
    return this.docs.find((child) => child.id === id);
  }

  public unsubscribe() {
    if (this.firestoreUnsubscribe) {
      this.firestoreUnsubscribe();
      this.firestoreUnsubscribe = undefined;
      this.subscribed = false;
    }
  }

  public async saveLocal() {
    const MAX_BATCH_SIZE = 500; // Firestore's limit for write operations in a single batch
    const unsyncedDocs = this.docs.filter(doc => !doc.synced);
    const batches: WriteBatch[] = [];

    for (let i = 0; i < unsyncedDocs.length; i += MAX_BATCH_SIZE) {
      const batch = writeBatch(this.db);
      batches.push(batch);

      const batchDocs = unsyncedDocs.slice(i, i + MAX_BATCH_SIZE);
      for (const document of batchDocs) {
        const validatedData = document.validateData(document.data);
        batch.update(doc(this.db, document.path), validatedData as WithFieldValue<DocumentData>);
      }
    }

    try {
      await Promise.all(batches.map(batch => batch.commit()));
      runInAction(() => {
        unsyncedDocs.forEach(document => {
          document.synced = true;
          document.originalData = { ...document.data };
        });
      });
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : String(error));
    }
  }
}