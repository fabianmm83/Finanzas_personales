// auth.js - Gestión de autenticación con Email y Google

// Función para login con Google
function loginWithGoogle() {
    console.log("Iniciando login con Google...");
    
    const provider = new firebase.auth.GoogleAuthProvider();
    
    auth.signInWithPopup(provider)
        .then((result) => {
            console.log("Login exitoso:", result.user);
            showToast('¡Bienvenido!', 'success');
        })
        .catch((error) => {
            console.error("Error en login con Google:", error);
            showToast('Error: Autenticación con Google no disponible', 'danger');
        });
}

// Función para registro con email y contraseña
function registerWithEmail(email, password, username) {
    showLoading(true);
    
    auth.createUserWithEmailAndPassword(email, password)
        .then((result) => {
            // Guardar información adicional del usuario en Firestore
            return db.collection('users').doc(result.user.uid).set({
                username: username,
                email: email,
                createdAt: new Date()
            });
        })
        .then(() => {
            showToast('¡Cuenta creada exitosamente!', 'success');
            showLoading(false);
        })
        .catch((error) => {
            console.error("Error en registro:", error);
            showToast('Error al crear cuenta: ' + error.message, 'danger');
            showLoading(false);
        });
}

// Función para login con email y contraseña
function loginWithEmail(email, password) {
    showLoading(true);
    
    auth.signInWithEmailAndPassword(email, password)
        .then((result) => {
            console.log("Login exitoso:", result.user);
            showToast('¡Bienvenido!', 'success');
            showLoading(false);
        })
        .catch((error) => {
            console.error("Error en login:", error);
            showToast('Error: ' + error.message, 'danger');
            showLoading(false);
        });
}

// Función para logout
function logout() {
    console.log("Cerrando sesión...");
    
    // LIMPIAR NOTIFICACIONES AL CERRAR SESIÓN - NUEVO
    if (typeof notificationManager !== 'undefined' && notificationManager && typeof notificationManager.cleanup === 'function') {
        console.log("Limpiando notificaciones programadas...");
        notificationManager.cleanup();
    } else {
        console.log("NotificationManager no disponible para limpiar");
    }
    
    auth.signOut()
        .then(() => {
            console.log("Logout exitoso");
            showToast('Sesión cerrada', 'info');
            
            // También limpiar notificaciones del navegador
            if ('Notification' in window && Notification.permission === 'granted') {
                navigator.serviceWorker.getRegistrations().then(function(registrations) {
                    registrations.forEach(function(registration) {
                        registration.unregister();
                    });
                });
            }
        })
        .catch((error) => {
            console.error("Error en logout:", error);
            showToast('Error al cerrar sesión: ' + error.message, 'danger');
        }); 
}

// Función para actualizar la barra de navegación con el estado de notificaciones
function updateNavbar(user) {
    const navLogin = document.getElementById('nav-login');
    const navLogout = document.getElementById('nav-logout');
    const navProfile = document.getElementById('nav-profile');
    const navAddTransaction = document.getElementById('nav-add-transaction');
    
    if (user) {
        // Usuario logueado
        if (navLogin) navLogin.style.display = 'none';
        if (navLogout) navLogout.style.display = 'block';
        if (navProfile) navProfile.style.display = 'block';
        if (navAddTransaction) navAddTransaction.style.display = 'block';
        
        // Reiniciar notificaciones si el manager existe
        if (typeof notificationManager !== 'undefined' && notificationManager && typeof notificationManager.restart === 'function') {
            setTimeout(() => {
                notificationManager.restart();
            }, 1000);
        }
    } else {
        // Usuario no logueado
        if (navLogin) navLogin.style.display = 'block';
        if (navLogout) navLogout.style.display = 'none';
        if (navProfile) navProfile.style.display = 'none';
        if (navAddTransaction) navAddTransaction.style.display = 'none';
        
        // Limpiar notificaciones
        if (typeof notificationManager !== 'undefined' && notificationManager && typeof notificationManager.cleanup === 'function') {
            notificationManager.cleanup();
        }
    }
}