const firebaseConfig = {
  apiKey: "AIzaSyB9H2RRxs_7ERb2ZYztuCQu6zScMkOPW_Q",
  authDomain: "campusmate-4.firebaseapp.com",
  projectId: "campusmate-4",
  storageBucket: "campusmate-4.firebasestorage.app",
  messagingSenderId: "508067016216",
  appId: "1:508067016216:web:eec789f59fadd8a13d9d6d",
  measurementId: "G-LMQRW33ML0"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const provider = new firebase.auth.GoogleAuthProvider();
const db = firebase.firestore();



const ADMIN_UID = "puqNkSNmpUaqK5Sw1srPH5cd6Jp2";

