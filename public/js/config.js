// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyBwitPnia6EEHpfWhQyZ2bXqDkLdamsC-4",
    authDomain: "finanzas-personales-torotech83.firebaseapp.com",
    projectId: "finanzas-personales-torotech83",
    storageBucket: "finanzas-personales-torotech83.appspot.com",
    messagingSenderId: "532180918419",
    appId: "1:532180918419:web:23a3441dc4175dd0bd6d66"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize services
const auth = firebase.auth();
const db = firebase.firestore();

console.log("Firebase configurado correctamente");