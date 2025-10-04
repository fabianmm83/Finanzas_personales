// auth.js - Gestión de autenticación
function loginWithGoogle() {
    console.log("Iniciando login con Google...");
    
    const provider = new firebase.auth.GoogleAuthProvider();
    
    auth.signInWithPopup(provider)
        .then((result) => {
            console.log("Login exitoso:", result.user);
            showToast('¡Bienvenido!', 'success');
        })
        .catch((error) => {
            console.error("Error en login:", error);
            showToast('Error en el login: ' + error.message, 'danger');
        });
}

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