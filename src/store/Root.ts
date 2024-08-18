import { initializeApp, FirebaseOptions } from "firebase/app";
import { getFirestore, Firestore } from "firebase/firestore";
import FirestateDatabase from "../Firestate/FirestateDatabase";
import Todos from "./Todos";

let config = {
  apiKey: "AIzaSyDTyUDdiOwOcfeoayvjGCaZc33mV6a5wt8",
  authDomain: "todo-test-74bd6.firebaseapp.com",
  projectId: "todo-test-74bd6",
  storageBucket: "todo-test-74bd6.appspot.com",
  messagingSenderId: "296379215949",
  appId: "1:296379215949:web:b1cbcfe7f28b74062bec04"
};

initializeApp(config);
let db = getFirestore();

class Root extends FirestateDatabase {
  todos = new Todos(this);

  init = async () => {
    let docs = await this.todos.subscribe();
    console.log("Loaded. Todos:");
    console.log(docs);
  };
}

const store = new Root(db);

store.init();

export default store;
