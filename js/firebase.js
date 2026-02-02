const firebaseConfig = {
    apiKey: "AIzaSyB23oLjZORs-stYVs-mecqJO5IVyLsTKi4",
    authDomain: "huaug-4b543.firebaseapp.com",
    projectId: "huaug-4b543",
    storageBucket: "huaug-4b543.firebasestorage.app",
    messagingSenderId: "109106734584",
    appId: "1:109106734584:web:8fc2e296fc5e22a345a20d",
    measurementId: "G-LMQ8WDEMGG"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const provider = new firebase.auth.GoogleAuthProvider();
const db = firebase.firestore();


const ADMIN_UID = "KEshDpx03GQvMNCoHDncJY7SzCF3";