# ⚠ In Development ⚠

# Firestate

Firestate is a lightweight library that simplifies working with Firestore in TypeScript projects. It provides a set of classes to manage Firestore collections and documents with type safety and MobX integration.

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
import FirestoreDocument from "./Firestate/FirestoreDocument";

export class TodoSchema {
  name = "";
  index = 0;
  done = false;
}

export class TodoDocument extends FirestoreDocument<TodoSchema> {
  static schema = TodoDefaults;
  public parent: Todos;
}
```

### 3. Create a collection class

Define a collection class for your documents:

```ts
import FirestoreCollection from "./Firestate/FirestoreCollection";
import { TodoDocument, TodoSchema } from "./Todo";

export class Todos extends FirestoreCollection<TodoDefaults, TodoDocument> {
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
    return this.children.find((todo) => todo.data.index === index);
  };
}
```

### 4. Set up the root store

Create a root store that extends FirestoreDatabase:

```ts
import FirestoreDatabase from "./Firestate/FirestoreDatabase";

class RootStore extends FirestoreDatabase {
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
const allTodos = rootStore.todos.children;
```

Firestate provides type-safe access to your Firestore data and integrates with MobX for reactive updates in your UI.