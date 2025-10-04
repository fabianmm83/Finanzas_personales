// config.js - Firebase Configuration
// Verificar si Firebase ya está inicializado
if (!firebase.apps.length) {
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
    console.log("Firebase configurado correctamente");
} else {
    console.log("Firebase ya estaba configurado");
}

// Initialize services (siempre disponibles después de la inicialización)
const auth = firebase.auth();
const db = firebase.firestore();