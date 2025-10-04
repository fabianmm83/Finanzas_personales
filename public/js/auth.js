class AuthManager {
    constructor() {
        this.currentUser = null;
        this.authStateListeners = [];
    }

    onAuthStateChanged(callback) {
        this.authStateListeners.push(callback);
        auth.onAuthStateChanged((user) => {
            this.currentUser = user;
            this.authStateListeners.forEach(cb => cb(user));
        });
    }

    async register(email, password, username) {
        try {
            this.showLoading(true);
            const userCredential = await auth.createUserWithEmailAndPassword(email, password);
            
            // Create user document in Firestore
            await db.collection('users').doc(userCredential.user.uid).set({
                username: username,
                email: email,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                lastLogin: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            this.showToast('¡Registro exitoso! Bienvenido/a', 'success');
            return { success: true };
            
        } catch (error) {
            this.showToast(this.getAuthErrorMessage(error), 'danger');
            return { success: false, error: error.message };
        } finally {
            this.showLoading(false);
        }
    }

    async login(email, password) {
        try {
            this.showLoading(true);
            const userCredential = await auth.signInWithEmailAndPassword(email, password);
            
            // Update last login
            await db.collection('users').doc(userCredential.user.uid).update({
                lastLogin: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            this.showToast('Inicio de sesión exitoso', 'success');
            return { success: true };
            
        } catch (error) {
            this.showToast(this.getAuthErrorMessage(error), 'danger');
            return { success: false, error: error.message };
        } finally {
            this.showLoading(false);
        }
    }

    async logout() {
        try {
            await auth.signOut();
            this.showToast('Sesión cerrada correctamente', 'info');
        } catch (error) {
            this.showToast('Error al cerrar sesión', 'danger');
        }
    }

    getAuthErrorMessage(error) {
        const messages = {
            'auth/email-already-in-use': 'Este email ya está registrado',
            'auth/invalid-email': 'Email inválido',
            'auth/weak-password': 'La contraseña es muy débil',
            'auth/user-not-found': 'Usuario no encontrado',
            'auth/wrong-password': 'Contraseña incorrecta'
        };
        return messages[error.code] || error.message;
    }

    showToast(message, type = 'info') {
        const toastContainer = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = `toast align-items-center text-bg-${type} border-0`;
        toast.innerHTML = `
            <div class="d-flex">
                <div class="toast-body">${message}</div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
            </div>
        `;
        toastContainer.appendChild(toast);
        const bsToast = new bootstrap.Toast(toast, { delay: 4000 });
        bsToast.show();
    }

    showLoading(show) {
        document.getElementById('loading-spinner').style.display = show ? 'block' : 'none';
    }
}

window.authManager = new AuthManager();