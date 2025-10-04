// public/firebase-config.js - Versión con autenticación
console.log("🔥 Cargando configuración de Firebase...");

const firebaseConfig = {
    apiKey: "AIzaSyBwitPnia6EEHpfWhQyZ2bXqDkLdamsC-4",
    authDomain: "finanzas-personales-torotech83.firebaseapp.com",
    projectId: "finanzas-personales-torotech83",
    storageBucket: "finanzas-personales-torotech83.appspot.com",
    messagingSenderId: "532180918419",
    appId: "1:532180918419:web:23a3441dc4175dd0bd6d66"
};

try {
    if (typeof firebase !== 'undefined') {
        if (!firebase.apps.length) {
            firebase.initializeApp(firebaseConfig);
            console.log("✅ Firebase inicializado correctamente");
        } else {
            firebase.app();
            console.log("ℹ️ Firebase ya estaba inicializado");
        }
        
        // Inicializar servicios
        window.auth = firebase.auth();
        window.db = firebase.firestore();
        
        console.log("✅ Servicios de Firebase inicializados");
        
        // Configurar persistencia de autenticación
        auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL)
            .then(() => {
                console.log("✅ Persistencia de auth configurada");
            })
            .catch((error) => {
                console.error("❌ Error configurando persistencia:", error);
            });
        
        window.dispatchEvent(new Event('firebaseReady'));
        
    } else {
        console.error("❌ Firebase no está disponible");
        throw new Error("Firebase SDK no cargado");
    }
} catch (error) {
    console.error("❌ Error inicializando Firebase:", error);
    window.dispatchEvent(new CustomEvent('firebaseError', { detail: error }));
}