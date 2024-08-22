import FirestateDocument from "./FirestateDocument";
import FirestateDatabase from "./FirestateDatabase";
import {
  getFirestore,
  Firestore,
  CollectionReference,
  DocumentSnapshot,
  WriteBatch,
  writeBatch,
  QueryConstraint,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  endBefore,
} from "firebase/firestore";
import {
  doc,
  getDoc,
  addDoc,
  deleteDoc,
  updateDoc,
  collection,
  onSnapshot,
  QuerySnapshot,
  DocumentData,
  WithFieldValue,
} from "firebase/firestore";
import { observable, IObservableArray, action, makeObservable, runInAction, transaction } from "mobx";
import { Query } from "firebase/firestore";

type DocumentConstructor<T, K extends FirestateDocument<T, any>> = {
  new (parent: any, id: string, data: T | null): K;
  create(parent: any, id: string, data: T | null): K;
  schema: new () => T;
};

interface FirestateCollectionOptions<T, K extends FirestateDocument<T, any>> {
  documentClass: DocumentConstructor<T, K>;
  collectionName: string;
  documentSchema: new () => T;
  queryConstraints?: QueryConstraint[];
}

export default class FirestateCollection<T, K extends FirestateDocument<T, any>> {
  protected parent: FirestateDocument<any> | FirestateDatabase;
  protected schema: new () => T;
  private firestoreUnsubscribe: (() => void) | undefined;
  public query: Query<any> | undefined;
  public db: Firestore;
  public path: string;
  public docs: Array<K> = [];
  public firestoreDocs: Array<T> = [];
  public subscribed: boolean = false;
  protected DocumentClass: DocumentConstructor<T, K>;
  public collectionName: string;
  public currentQueryConstraints: QueryConstraint[] = [];

  constructor(
    parent: FirestateDocument<any> | FirestateDatabase,
    options?: Partial<FirestateCollectionOptions<T, K>>
  ) {
    this.parent = parent;
    this.db = parent.db;

    // Use static properties if not provided in options
    this.DocumentClass = options?.documentClass || (this.constructor as any).documentClass;
    this.schema = (this.DocumentClass as any).schema || (this.constructor as any).schema;
    this.collectionName = options?.collectionName || (this.constructor as any).collectionName;

    if (!this.DocumentClass || !this.schema || !this.collectionName) {
      throw new Error('documentClass, schema, and collectionName must be provided either as static properties or in the options');
    }

    this.path = `${parent.path}/${this.collectionName}`;

    this.currentQueryConstraints = options?.queryConstraints || [];

    makeObservable(this, {
      firestoreDocs: observable,
      docs: observable,
      currentQueryConstraints: observable,
      updateData: action,
      setQuery: action
    });
  }

  public get collectionRef() {
    return collection(this.db, this.path);
  }

  public setQuery = (...queryConstraints: QueryConstraint[]) => {
    this.currentQueryConstraints = queryConstraints;
    let currentQuery = query(this.collectionRef, ...this.currentQueryConstraints);
    if (this.subscribed) {
      this.unsubscribe();
      this.clearCurrentDocs();
      this.subscribe();
    }
    return currentQuery;
  }

  private clearCurrentDocs = () => {
    this.docs = [];
    this.firestoreDocs = [];
  }

  private handleDataChanges = (
    snapshot: QuerySnapshot<DocumentData>,
    resolve: (value: K[]) => void
  ) => {
    transaction(() => {
      this.updateData(snapshot);
      resolve(this.docs);
    });
  };

  public updateData = (snapshot: QuerySnapshot<DocumentData>) => {
    const docChanges = snapshot.docChanges();
  
    docChanges.forEach((change) => {
      if (change.type === "added") {
        const newDoc = this.createDocument(change.doc.id, change.doc.data() as T);
        this.docs.push(newDoc);
      }
  
      if (change.type === "modified") {
        const index = this.docs.findIndex(doc => doc.id === change.doc.id);
        if (index !== -1) {
          this.updateDocumentIfNewer(this.docs[index], change.doc);
        }
      }
  
      if (change.type === "removed") {
        const index = this.docs.findIndex(doc => doc.id === change.doc.id);
        if (index !== -1) {
          this.docs.splice(index, 1);
        }
      }
    });
  
    // Update firestoreDocs to match the current state
    this.firestoreDocs = this.docs.map(doc => ({ ...doc.data, id: doc.id }));
  }

  public subscribe = (): Promise<K[]> => {
    if (this.subscribed) {
      console.warn(`FirestateCollection: Already subscribed to ${this.collectionName}`);
      return Promise.resolve(this.docs);
    }
    return new Promise((resolve, reject) => {
      const queryRef = query(this.collectionRef, ...this.currentQueryConstraints);
      this.firestoreUnsubscribe = onSnapshot(
        queryRef,
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

  private updateDocumentIfNewer = (child: K, doc: DocumentSnapshot<DocumentData>) => {
    if (!doc.metadata.hasPendingWrites) {
      child._updateData(doc.data() as T);
    }
  }

  private createDocument = (id: string, data: T | null): K => {
    return this.DocumentClass.create(this, id, data);
  }

  public add = async (data: Partial<T>): Promise<K> => {
    try {
      const schemaInstance = new this.schema();
      const validatedData = { ...schemaInstance, ...data };
      const docRef = await addDoc(collection(this.db, this.path), validatedData as WithFieldValue<DocumentData>);
      return this.createDocument(docRef.id, validatedData);
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : String(error));
    }
  }

  public delete = async (id: string) => {
    try {
      await deleteDoc(doc(this.db, this.path, id));
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : String(error));
    }
  }

  public update = async (id: string, data: Partial<T>) => {
    try {
      const validatedData = { ...new this.schema(), ...data };
      await updateDoc<any>(doc(this.db, this.path, id), validatedData);
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : String(error));
    }
  }

  public get = (id: string) => {
    // return await getDoc<any>(doc(this.db, this.path, id))
    return this.docs.find((child) => child.id === id);
  }

  public unsubscribe = () => {
    if (this.firestoreUnsubscribe) {
      this.firestoreUnsubscribe();
      this.firestoreUnsubscribe = undefined;
      this.subscribed = false;
    }
  }

  public saveLocal = async () => {
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