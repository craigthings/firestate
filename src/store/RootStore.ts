import { initializeApp, FirebaseOptions } from "firebase/app";
import { getFirestore, Firestore } from "firebase/firestore";
import { FirestateDatabase } from "../Firestate";
import TodoCollection from "./TodoCollection";

let config = {
  apiKey: "AIzaSyDTyUDdiOwOcfeoayvjGCaZc33mV6a5wt8",
  authDomain: "todo-test-74bd6.firebaseapp.com",
  projectId: "todo-test-74bd6",
  storageBucket: "todo-test-74bd6.appspot.com",
  messagingSenderId: "296379215949",
  appId: "1:296379215949:web:b1cbcfe7f28b74062bec04"
};

initializeApp(config);
let firestore = getFirestore();
let db = new FirestateDatabase(firestore);

class RootStore {
  todos = new TodoCollection(db);

  init = async () => {
    await this.todos.subscribe();
    console.log('Todos Loaded');;
  };
}

const store = new RootStore();

store.init();

export default store;
