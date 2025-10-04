// public/firebase-config.js - Firebase Configuration
console.log("🔥 Cargando configuración de Firebase...");

// Tu configuración de Firebase
const firebaseConfig = {
    apiKey: "AIzaSyBwitPnia6EEHpfWhQyZ2bXqDkLdamsC-4",
    authDomain: "finanzas-personales-torotech83.firebaseapp.com",
    projectId: "finanzas-personales-torotech83",
    storageBucket: "finanzas-personales-torotech83.appspot.com",
    messagingSenderId: "532180918419",
    appId: "1:532180918419:web:23a3441dc4175dd0bd6d66"
};

// Inicializar Firebase con manejo de errores
try {
    if (typeof firebase !== 'undefined') {
        if (!firebase.apps.length) {
            firebase.initializeApp(firebaseConfig);
            console.log("✅ Firebase inicializado correctamente");
        } else {
            firebase.app(); // Usar la instancia existente
            console.log("ℹ️ Firebase ya estaba inicializado");
        }
        
        // Inicializar servicios
        window.auth = firebase.auth();
        window.db = firebase.firestore();
        
        console.log("✅ Servicios de Firebase inicializados");
        
        // Disparar evento personalizado cuando Firebase esté listo
        window.dispatchEvent(new Event('firebaseReady'));
        
    } else {
        console.error("❌ Firebase no está disponible");
        throw new Error("Firebase SDK no cargado");
    }
} catch (error) {
    console.error("❌ Error inicializando Firebase:", error);
    window.dispatchEvent(new CustomEvent('firebaseError', { detail: error }));
}