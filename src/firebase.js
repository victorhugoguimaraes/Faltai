import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth"; 
import { getFirestore } from "firebase/firestore"; 
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyBf_RvKZOON3dOZoDwcokA8rjhgAx_10N0",
  authDomain: "faltai-55735.firebaseapp.com",
  projectId: "faltai-55735",
  storageBucket: "faltai-55735.firebasestorage.app",
  messagingSenderId: "453057367017",
  appId: "1:453057367017:web:ece2193649262f9d1fd978",
  measurementId: "G-SG5PVVBZM2"
};


const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app); 
const analytics = getAnalytics(app);

export { auth, db, analytics };
