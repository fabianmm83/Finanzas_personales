// Firebase Configuration - CONFIGURACIÓN ACTUALIZADA
const firebaseConfig = {
    apiKey: "AIzaSyBwitPnia6EEHpfWhQyZ2bXqDkLdamsC-4",
    authDomain: "finanzas-personales-torotech83.firebaseapp.com",
    projectId: "finanzas-personales-torotech83",
    storageBucket: "finanzas-personales-torotech83.appspot.com",
    messagingSenderId: "532180918419",
    appId: "1:532180918419:web:tu-app-id-aqui" // Esta no aparece en la imagen
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize services
const auth = firebase.auth();
const db = firebase.firestore();

console.log("Firebase configurado correctamente");

// Agregar functions a la configuración
const functions = firebase.functions();

// Para desarrollo local (opcional)
if (window.location.hostname === "localhost") {
    functions.useEmulator("localhost", 5001);
}