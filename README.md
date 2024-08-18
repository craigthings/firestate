# ⚠ In Development ⚠

# Firestate

Firestate is a lightweight library that simplifies working with Firestore in TypeScript projects that use MobX for UI reactivity. It provides an easy to use API for managing your Firestore collections and documents while automatically keeping your UI up to date.

## Basic Usage

### 1. Set up Firebase

First, initialize your Firebase app and get the Firestore instance:

```ts
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  // Your Firebase configuration
};

initializeApp(firebaseConfig);
const db = getFirestore();
```

### 2. Define your data model

Create a schema and document class for your data:

```ts
import FirestateDocument from "./Firestate/FirestateDocument";

export class TodoSchema {
  name = "";
  index = 0;
  done = false;
}

export class TodoDocument extends FirestateDocument<TodoSchema> {
  static schema = TodoDefaults;
  public parent: Todos;
}
```

### 3. Create a collection class

Define a collection class for your documents:

```ts
import FirestateCollection from "./Firestate/FirestateCollection";
import { TodoDocument, TodoSchema } from "./Todo";

export class Todos extends FirestateCollection<TodoDefaults, TodoDocument> {
  static documentClass = TodoDocument;
  static collectionName = "todos";

  public query = this.createQuery((collectionRef) => {
    return query(collectionRef, orderBy("index"));
  });

  create = (name: string, index: number, done: boolean) => {
    this.add({ name, index, done });
  };

  remove = async (id: string) => {
    await this.get(id).delete();
  };

  getByIndex = (index: number) => {
    return this.docs.find((todo) => todo.data.index === index);
  };
}
```

### 4. Set up the root store

Create a root store that extends FirestateDatabase:

```ts
import FirestateDatabase from "./Firestate/FirestateDatabase";

class RootStore extends FirestateDatabase {
  todos: Todos;

  constructor(db: Firestore) {
    super(db);
    this.todos = new Todos(this);
  }

  async init() {
    await this.todos.subscribe();
  }
}

const rootStore = new RootStore(db);
rootStore.init();
```

### 5. Use the store in your application

Now you can use the store to interact with your Firestore data:

```ts
// Add a new todo
await rootStore.todos.add({ name: "Buy groceries", done: false });

// Get a todo by ID
const todo = rootStore.todos.get("someId");

// Update a todo
await todo.update({ done: true });

// Delete a todo
await todo.delete();

// Access the todos array
const allTodos = rootStore.todos.docs;
```

## API Documentation

### FirestateCollection

#### Properties
- `docs`: Array<FirestateDocument> - Array of document instances in the collection.
- `firestoreDocs`: Array<FirestateDocumentData[]> - Array of raw document data.
- `subscribed`: boolean - Indicates if the collection is currently subscribed to Firestore updates.

#### Methods
- `subscribe()`: Promise<DocumentType[]> - Subscribes to real-time updates from Firestore.
- `unsubscribe()`: void - Unsubscribes from Firestore updates.
- `add(data: Partial<T>)`: Promise<FirestateDocument<T>> - Adds a new document to the collection.
- `delete(id: string)`: Promise<void> - Deletes a document from the collection.
- `update(id: string, data: Partial<T>)`: Promise<void> - Updates a document in the collection.
- `get(id: string)`: FirestateDocument<T> | undefined - Retrieves a document by ID.
- `saveLocal()`: Promise<void> - Syncs local changes to Firestore.

### FirestateDocument

#### Properties
- `id`: string - The document's ID.
- `data`: T - The document's data.
- `synced`: boolean - Indicates if the document is synced with Firestore.

#### Methods
- `updateLocal(data: Partial<T>)`: void - Updates the document locally without syncing to Firestore.
- `saveLocal()`: Promise<void> - Saves local changes to Firestore.
- `discardLocal()`: void - Discards local changes and reverts to the last synced state.
- `update(data: Partial<T>)`: Promise<void> - Updates the document in Firestore.
- `delete()`: Promise<void> - Deletes the document from Firestore.

### FirestateDatabase

#### Properties
- `db`: Firestore - The Firestore database instance.

#### Methods
- `constructor(db: Firestore)`: Creates a new FirestateDatabase instance.

Note: The FirestateDatabase class is primarily used as a base class for your root store and doesn't have many public methods or properties of its own.
## Project Structure

This repository contains both the Firestate library and a demo application.

### Demo Application

The demo application is located in the demo folder. To run the demo:

1. Navigate to the demo folder:
   `
   cd demo
   `

2. Install dependencies:
   `
   npm install
   `

3. Start the development server:
   `
   npm start
   `

