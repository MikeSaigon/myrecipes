import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";

const firebaseConfig = {
  apiKey: "AIzaSyCCObH9haO398z9VNke9MZPgszEuIWUiVg",
  authDomain: "myrecipes-c398f.firebaseapp.com",
  projectId: "myrecipes-c398f",
  storageBucket: "myrecipes-c398f.firebasestorage.app",
  messagingSenderId: "258073201678",
  appId: "1:258073201678:web:282acc6740e0a701cb405f"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const storage = getStorage(app);
