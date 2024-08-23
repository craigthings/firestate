# ⚠ In Development ⚠

# Firestate

Firestate is a lightweight library that simplifies working with Firestore in TypeScript projects that use MobX for UI reactivity. It provides an easy-to-use API for managing your Firestore collections and documents while automatically keeping your UI up to date.

## Basic Usage

### 1. Define a collection and schema

A `FirestateCollection` represents a collection of documents in Firestore. It provides methods for subscribing to real-time updates, adding, updating, and deleting documents, and setting queries.

```ts
// This schema is used as the default values and schema for the documents in the collection
export class TodoSchema { 
  name = "";
  index = 0;
  done = false;
}

export default class Todos extends FirestateCollection<TodoSchema, TodoDocument> {
  static documentClass = TodoDocument;
  static documentSchema = TodoSchema;
  static collectionName = "todos";

  setOrderByIndex = () => {
    this.setQuery(orderBy("index"));
  };

  addNew = (name: string, index: number, done: boolean) => {
    this.add({ name, index, done });
  };

  remove = async (id: string) => {
    await this.get(id)?.delete();
  };
}
```

### 1. Define a document class

`FirestateDocument` is a class that represents a document in Firestore and provides familiar methods for interacting with it a Firestore document. `FirestateCollection` will create instances of this class for each document in the collection.

```ts
import { FirestateDocument } from "../Firestate";

export class TodoDocument extends FirestateDocument<TodoSchema> {
  toggleDone = () => {
    this.update({ done: !this.data.done });
  };

  setName = (name: string) => {
    this.update({ name });
  };
}
```

### 3. Add your collection to your store

Setup firebase and add your `FirestateCollection` to your store.

```ts

const config = {
  // Your Firebase configuration
};

initializeApp(config);
let firestore = getFirestore();
let db = new FirestateDatabase(firestore);

class RootStore {
  todos = new Todos(db);

  init = async () => {
    await this.todos.subscribe(); // Loads and subscribes to the collection for real-time updates
    console.log("Todos loaded.");
  };
}

const store = new RootStore(db);
store.init();

export default store;
```

## API Documentation

### FirestateCollection

#### Properties
- `docs`: Array<FirestateDocument> - Array of Firestate Documents in the collection.
- `firestoreDocs`: Array<DocumentSchema> - Array of raw document data.
- `subscribed`: boolean - Indicates if the collection is currently subscribed to Firestore updates.

#### Methods
- `subscribe()`: Promise<FirestateDocument[]> - Subscribes to real-time updates from Firestore. Can be awaited to ensure the collection is fully loaded before continuing.
- `unsubscribe()`: void - Unsubscribes from Firestore updates.
- `add(data: Partial<DocumentSchema>)`: Promise<FirestateDocument> - Adds a new document to the collection.
- `delete(id: string)`: Promise<void> - Deletes a document from the collection.
- `update(id: string, data: Partial<DocumentSchema>)`: Promise<void> - Updates a document in the collection.
- `get(id: string)`: FirestateDocument | undefined - Retrieves a document by ID.
- `saveLocal()`: Promise<void> - Syncs local changes to Firestore.
- `setQuery(...queryConstraints: QueryConstraint[])`: Query - Sets a new query for the collection.

### FirestateDocument

#### Properties
- `id`: string - The document's ID.
- `data`: T - The document's data.
- `synced`: boolean - Indicates if the document is synced with Firestore.

#### Methods
- `updateLocal(data: Partial<DocumentSchema>)`: void - Updates the document locally without syncing to Firestore.
- `saveLocal()`: Promise<void> - Saves local changes to Firestore.
- `discardLocal()`: void - Discards local changes and reverts to the last synced state.
- `update(data: Partial<DocumentSchema>)`: Promise<void> - Updates the document in Firestore.
- `delete()`: Promise<void> - Deletes the document from Firestore.

### FirestateDatabase

#### Properties
- `db`: Firestore - The Firestore database instance.

#### Methods
- `constructor(db: Firestore)`: Creates a new FirestateDatabase instance.

Note: The FirestateDatabase class is primarily used as a base class for your root store and doesn't have many public methods or properties of its own.