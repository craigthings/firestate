# ⚠ In Development ⚠

# Firestate

Firestate is a lightweight library that simplifies working with Firestore in TypeScript projects that use MobX for UI reactivity. It provides an easy-to-use API for managing your Firestore collections and documents while automatically keeping your UI up to date.

## Basic Usage

### 1. Define your data model

Create a document class for your data and add any methods you need to interact with it:

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

### 2. Create a collection class

Configure a collection class for your documents:

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

### 3. Set up a root store

Setup firebase and create a root store that uses FirestateDatabase:

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
    await this.todos.subscribe();
  };
}

const store = new RootStore(db);
store.init();

export default store;
```

## API Documentation

### FirestateCollection

#### Properties
- `docs`: Array<FirestateDocument> - Array of document instances in the collection.
- `firestoreDocs`: Array<DocumentSchema> - Array of raw document data.
- `subscribed`: boolean - Indicates if the collection is currently subscribed to Firestore updates.

#### Methods
- `subscribe()`: Promise<FirestateDocument[]> - Subscribes to real-time updates from Firestore.
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