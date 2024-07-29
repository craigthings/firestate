# firestate

# todo
- [ ] Refactor FirestoreDocument to use create method, instead of requiring subclasses to use a complex constructor. example:

```ts
export default class FirestoreDocument<T> {
  public parent: FirestoreCollection<any, any>;
  public db: Firestore;
  public id: string = "";
  public schema: z.ZodType<T>;
  public path: string = "";
  public data: T = {} as T;
  public originalData: T = {} as T;
  public synced: boolean = true;

  protected constructor(
    parent: FirestoreCollection<any, any>,
    id: string,
    schema: z.ZodType<T>,
    data: T | null = null
  ) {
    // ... existing constructor logic ...
  }

  static create<T, K extends FirestoreDocument<T>>(
    this: new (...args: any[]) => K,
    parent: FirestoreCollection<any, any>,
    id: string,
    data: T | null = null
  ): K {
    const schema = (this as any).schema;
    if (!schema) {
      throw new Error("Static schema property must be defined on the subclass");
    }
    return new this(parent, id, schema, data);
  }

  // ... rest of the class implementation ...
}

export default class TodoDocument extends FirestoreDocument<Todo> {
  static schema = todoSchema;
  public parent: Todos;

  toggleDone = () => {
    this.update({ done: !this.data.done });
  };

  setName = (name: string) => {
    this.update({ name });
  };

  setIndex = (index: number) => {
    this.update({ index });
  };

  remove = () => {
    this.delete();
  };
}

const todoDoc = TodoDocument.create(parentTodos, "someId", someData);

```

