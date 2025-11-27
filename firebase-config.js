import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";

const firebaseConfig = {
  apiKey: "AIzaSyAKhWMcAGum0RR2DLvG_2K18LxquqnItNo",
  authDomain: "recipesfree-96b06.firebaseapp.com",
  projectId: "recipesfree-96b06",
  storageBucket: "recipesfree-96b06.firebasestorage.app",
  messagingSenderId: "726326313880",
  appId: "1:726326313880:web:96fe17e3a4808e57ffe1ed"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const storage = getStorage(app);
