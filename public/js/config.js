// Firebase Configuration - ACTUALIZA ESTOS DATOS
const firebaseConfig = {
    apiKey: "AIzaSyCYQeEXAMPLEEXAMPLEEXAMPLE",
    authDomain: "finanzas-personales-torotech83.firebaseapp.com",
    projectId: "finanzas-personales-torotech83",
    storageBucket: "finanzas-personales-torotech83.appspot.com",
    messagingSenderId: "123456789",
    appId: "1:123456789:web:abc123def456"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize services
const auth = firebase.auth();
const db = firebase.firestore();

console.log("Firebase configurado correctamente");