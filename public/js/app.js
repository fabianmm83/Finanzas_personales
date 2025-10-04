// app.js - VERSIÓN SIMPLIFICADA Y FUNCIONAL
document.addEventListener('DOMContentLoaded', function() {
    console.log("DOM cargado - Iniciando aplicación");
    initializeApp();
});

function initializeApp() {
    showLoading(true);
    
    // Verificar si Firebase está cargado
    if (typeof firebase === 'undefined' || !firebase.app) {
        console.error("Firebase no se cargó correctamente");
        showError("Error: Firebase no se pudo cargar. Verifica la conexión.");
        return;
    }
    
    console.log("Firebase detectado, verificando autenticación...");
    
    // Escuchar cambios de autenticación
    auth.onAuthStateChanged((user) => {
        console.log("Estado de autenticación:", user ? "Usuario logueado" : "No logueado");
        
        if (user) {
            loadDashboard(user);
        } else {
            loadLoginPage();
        }
        showLoading(false);
    }, (error) => {
        console.error("Error en autenticación:", error);
        showError("Error de autenticación: " + error.message);
        showLoading(false);
    });
}

function loadLoginPage() {
    const content = document.getElementById('content');
    content.innerHTML = `
        <div class="row justify-content-center">
            <div class="col-md-6 col-lg-4">
                <div class="card shadow">
                    <div class="card-body p-4">
                        <div class="text-center mb-4">
                            <i class="fas fa-wallet fa-3x text-primary mb-3"></i>
                            <h3 class="card-title">Finanzas Personales</h3>
                            <p class="text-muted">Controla tus gastos e ingresos</p>
                        </div>
                        
                        <div class="d-grid gap-2">
                            <button class="btn btn-primary btn-lg" onclick="loginWithGoogle()">
                                <i class="fab fa-google me-2"></i> Continuar con Google
                            </button>
                        </div>
                        
                        <div class="text-center mt-4">
                            <small class="text-muted">
                                <i class="fas fa-lock me-1"></i>
                                Tus datos están protegidos
                            </small>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function loadDashboard(user) {
    const content = document.getElementById('content');
    
    content.innerHTML = `
        <div class="row">
            <div class="col-12">
                <div class="d-flex justify-content-between align-items-center mb-4">
                    <div>
                        <h2 class="mb-1">Dashboard</h2>
                        <p class="text-muted mb-0">Bienvenido, ${user.email}</p>
                    </div>
                    <button class="btn btn-outline-danger" onclick="logout()">
                        <i class="fas fa-sign-out-alt me-1"></i> Cerrar Sesión
                    </button>
                </div>
                
                <div class="row">
                    <div class="col-md-4">
                        <div class="card bg-primary text-white">
                            <div class="card-body">
                                <div class="d-flex justify-content-between">
                                    <div>
                                        <h4 class="card-title">$0.00</h4>
                                        <p class="card-text">Balance Total</p>
                                    </div>
                                    <i class="fas fa-dollar-sign fa-2x"></i>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="col-md-4">
                        <div class="card bg-success text-white">
                            <div class="card-body">
                                <div class="d-flex justify-content-between">
                                    <div>
                                        <h4 class="card-title">$0.00</h4>
                                        <p class="card-text">Ingresos</p>
                                    </div>
                                    <i class="fas fa-arrow-down fa-2x"></i>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="col-md-4">
                        <div class="card bg-danger text-white">
                            <div class="card-body">
                                <div class="d-flex justify-content-between">
                                    <div>
                                        <h4 class="card-title">$0.00</h4>
                                        <p class="card-text">Gastos</p>
                                    </div>
                                    <i class="fas fa-arrow-up fa-2x"></i>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="row mt-4">
                    <div class="col-md-6">
                        <div class="card">
                            <div class="card-body">
                                <h5 class="card-title">
                                    <i class="fas fa-plus-circle me-2"></i>
                                    Acciones Rápidas
                                </h5>
                                <div class="d-grid gap-2">
                                    <button class="btn btn-outline-primary" onclick="showAddTransaction()">
                                        <i class="fas fa-plus me-2"></i>Agregar Transacción
                                    </button>
                                    <button class="btn btn-outline-success" onclick="showAddBudget()">
                                        <i class="fas fa-chart-pie me-2"></i>Crear Presupuesto
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="col-md-6">
                        <div class="card">
                            <div class="card-body">
                                <h5 class="card-title">
                                    <i class="fas fa-history me-2"></i>
                                    Últimas Transacciones
                                </h5>
                                <p class="text-muted text-center">No hay transacciones recientes</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function showAddTransaction() {
    const content = document.getElementById('content');
    content.innerHTML = `
        <div class="row justify-content-center">
            <div class="col-md-8 col-lg-6">
                <div class="card shadow">
                    <div class="card-body">
                        <h2 class="text-center mb-4">
                            <i class="fas fa-plus-circle text-primary me-2"></i>
                            Agregar Transacción
                        </h2>
                        <form id="add-transaction-form">
                            <div class="row">
                                <div class="col-md-6 mb-3">
                                    <label for="transaction-type" class="form-label">Tipo</label>
                                    <select class="form-select" id="transaction-type" required>
                                        <option value="income">Ingreso</option>
                                        <option value="expense">Gasto</option>
                                    </select>
                                </div>
                                <div class="col-md-6 mb-3">
                                    <label for="transaction-amount" class="form-label">Monto ($)</label>
                                    <input type="number" step="0.01" class="form-control" id="transaction-amount" required>
                                </div>
                            </div>
                            <div class="mb-3">
                                <label for="transaction-category" class="form-label">Categoría</label>
                                <input type="text" class="form-control" id="transaction-category" required>
                            </div>
                            <div class="mb-3">
                                <label for="transaction-date" class="form-label">Fecha</label>
                                <input type="date" class="form-control" id="transaction-date" required>
                            </div>
                            <div class="mb-3">
                                <label for="transaction-description" class="form-label">Descripción (Opcional)</label>
                                <textarea class="form-control" id="transaction-description" rows="2"></textarea>
                            </div>
                            <div class="d-grid gap-2">
                                <button type="submit" class="btn btn-primary btn-lg">
                                    <i class="fas fa-save me-2"></i>Guardar Transacción
                                </button>
                                <button type="button" class="btn btn-secondary" onclick="loadDashboard(auth.currentUser)">
                                    <i class="fas fa-arrow-left me-2"></i>Volver al Dashboard
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Set today's date as default
    document.getElementById('transaction-date').valueAsDate = new Date();

    document.getElementById('add-transaction-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const transactionData = {
            type: document.getElementById('transaction-type').value,
            amount: parseFloat(document.getElementById('transaction-amount').value),
            category: document.getElementById('transaction-category').value,
            date: document.getElementById('transaction-date').value,
            description: document.getElementById('transaction-description').value,
            createdAt: new Date()
        };

        try {
            // Guardar en Firestore
            await db.collection('transactions').add({
                ...transactionData,
                userId: auth.currentUser.uid
            });
            
            showToast('Transacción guardada correctamente', 'success');
            loadDashboard(auth.currentUser);
        } catch (error) {
            console.error('Error guardando transacción:', error);
            showToast('Error al guardar la transacción', 'danger');
        }
    });
}

function showAddBudget() {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    const content = document.getElementById('content');
    content.innerHTML = `
        <div class="row justify-content-center">
            <div class="col-md-8 col-lg-6">
                <div class="card shadow">
                    <div class="card-body">
                        <h2 class="text-center mb-4">
                            <i class="fas fa-chart-pie text-primary me-2"></i>
                            Crear Presupuesto
                        </h2>
                        <form id="add-budget-form">
                            <div class="mb-3">
                                <label for="budget-category" class="form-label">Categoría</label>
                                <input type="text" class="form-control" id="budget-category" required>
                            </div>
                            <div class="mb-3">
                                <label for="budget-limit" class="form-label">Límite ($)</label>
                                <input type="number" step="0.01" class="form-control" id="budget-limit" required>
                            </div>
                            <div class="row">
                                <div class="col-md-6 mb-3">
                                    <label for="budget-month" class="form-label">Mes</label>
                                    <select class="form-select" id="budget-month" required>
                                        ${Array.from({length: 12}, (_, i) => `
                                            <option value="${i + 1}" ${i + 1 === currentMonth ? 'selected' : ''}>
                                                ${new Date(2000, i).toLocaleDateString('es-ES', { month: 'long' })}
                                            </option>
                                        `).join('')}
                                    </select>
                                </div>
                                <div class="col-md-6 mb-3">
                                    <label for="budget-year" class="form-label">Año</label>
                                    <input type="number" class="form-control" id="budget-year" 
                                           value="${currentYear}" min="${currentYear}" max="${currentYear + 5}" required>
                                </div>
                            </div>
                            <div class="d-grid gap-2">
                                <button type="submit" class="btn btn-primary btn-lg">
                                    <i class="fas fa-save me-2"></i>Crear Presupuesto
                                </button>
                                <button type="button" class="btn btn-secondary" onclick="loadDashboard(auth.currentUser)">
                                    <i class="fas fa-arrow-left me-2"></i>Volver al Dashboard
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    `;

    document.getElementById('add-budget-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const budgetData = {
            category: document.getElementById('budget-category').value,
            limit: parseFloat(document.getElementById('budget-limit').value),
            month: parseInt(document.getElementById('budget-month').value),
            year: parseInt(document.getElementById('budget-year').value),
            createdAt: new Date()
        };

        try {
            // Guardar en Firestore
            await db.collection('budgets').add({
                ...budgetData,
                userId: auth.currentUser.uid
            });
            
            showToast('Presupuesto creado correctamente', 'success');
            loadDashboard(auth.currentUser);
        } catch (error) {
            console.error('Error creando presupuesto:', error);
            showToast('Error al crear el presupuesto', 'danger');
        }
    });
}

function showLoading(show) {
    const loadingSpinner = document.getElementById('loading-spinner');
    if (loadingSpinner) {
        loadingSpinner.style.display = show ? 'block' : 'none';
    }
}

function showError(message) {
    const content = document.getElementById('content');
    content.innerHTML = `
        <div class="row justify-content-center">
            <div class="col-md-6">
                <div class="alert alert-danger">
                    <h4><i class="fas fa-exclamation-triangle"></i> Error</h4>
                    <p>${message}</p>
                    <button class="btn btn-primary" onclick="location.reload()">
                        <i class="fas fa-redo"></i> Reintentar
                    </button>
                </div>
            </div>
        </div>
    `;
}