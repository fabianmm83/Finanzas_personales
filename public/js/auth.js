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
    auth.signOut()
        .then(() => {
            console.log("Logout exitoso");
            showToast('Sesión cerrada', 'info');
        })
        .catch((error) => {
            console.error("Error en logout:", error);
        });
}