// app.js - Aplicación principal
let chartInstances = {
    timeline: null,
    income: null,
    expense: null
};

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
    
    // Inicializar managers si no existen
    if (typeof transactionManager === 'undefined') {
        console.log("Inicializando TransactionManager...");
        window.transactionManager = new TransactionManager();
    }
    
    if (typeof budgetManager === 'undefined') {
        console.log("Inicializando BudgetManager...");
        window.budgetManager = new BudgetManager();
    }
    
    // Configurar navegación
    setupNavigation();
    
    // Escuchar cambios de autenticación
    auth.onAuthStateChanged((user) => {
        console.log("Estado de autenticación:", user ? "Usuario logueado" : "No logueado");
        
        // Actualizar barra de navegación
        updateNavbar(user);
        
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

// Configurar navegación
function setupNavigation() {
    console.log('🔧 Configurando navegación...');
    
    // Manejadores de los botones de navegación
    const navHome = document.getElementById('nav-home');
    const navProfile = document.getElementById('nav-profile');
    const navAddTransaction = document.getElementById('nav-add-transaction');
    const navLogout = document.getElementById('nav-logout');
    const navLogin = document.getElementById('nav-login');

    if (navHome) {
        navHome.addEventListener('click', (e) => {
            e.preventDefault();
            if (auth.currentUser) {
                loadDashboard(auth.currentUser);
            }
        });
    }

    if (navProfile) {
        navProfile.addEventListener('click', (e) => {
            e.preventDefault();
            if (auth.currentUser) {
                showProfile();
            }
        });
    }

    if (navAddTransaction) {
        navAddTransaction.addEventListener('click', (e) => {
            e.preventDefault();
            if (auth.currentUser) {
                showAddTransaction();
            }
        });
    }

    if (navLogout) {
        navLogout.addEventListener('click', (e) => {
            e.preventDefault();
            logout();
        });
    }

    if (navLogin) {
        navLogin.addEventListener('click', (e) => {
            e.preventDefault();
            loadLoginPage();
        });
    }
}

// Función para actualizar la barra de navegación CORREGIDA
function updateNavbar(user) {
    console.log('🔄 Actualizando navbar...');
    
    const navLogout = document.getElementById('nav-logout');
    const navLogin = document.getElementById('nav-login');
    const navItems = document.querySelectorAll('.nav-item:not(:first-child)');

    if (user) {
        // Usuario logueado - mostrar botones de usuario
        if (navLogout) navLogout.style.display = 'block';
        if (navLogin) navLogin.style.display = 'none';
        
        // Mostrar todos los items de navegación
        navItems.forEach(item => {
            item.style.display = 'block';
        });
        
        console.log('✅ Navbar actualizada para usuario logueado');
    } else {
        // Usuario no logueado - mostrar solo login
        if (navLogout) navLogout.style.display = 'none';
        if (navLogin) navLogin.style.display = 'block';
        
        // Ocultar items de navegación excepto login
        navItems.forEach(item => {
            if (!item.querySelector('#nav-login')) {
                item.style.display = 'none';
            }
        });
        
        console.log('✅ Navbar actualizada para usuario no logueado');
    }
}

function loadLoginPage() {
    const content = document.getElementById('content');
    content.innerHTML = `
        <div class="row justify-content-center">
            <div class="col-md-6 col-lg-5">
                <div class="card shadow">
                    <div class="card-body p-4">
                        <div class="text-center mb-4">
                            <i class="fas fa-wallet fa-3x text-primary mb-3"></i>
                            <h3 class="card-title">Finanzas Personales</h3>
                            <p class="text-muted">Controla tus gastos e ingresos</p>
                        </div>
                        
                        <!-- Formulario de Login con Email -->
                        <div class="mb-4">
                            <h5 class="text-center mb-3">Iniciar Sesión con Email</h5>
                            <form id="email-login-form">
                                <div class="mb-3">
                                    <label for="login-email" class="form-label">Email</label>
                                    <input type="email" class="form-control" id="login-email" placeholder="tu@email.com" required>
                                </div>
                                <div class="mb-3">
                                    <label for="login-password" class="form-label">Contraseña</label>
                                    <input type="password" class="form-control" id="login-password" placeholder="Tu contraseña" required>
                                </div>
                                <button type="submit" class="btn btn-primary w-100 mb-3">
                                    <i class="fas fa-sign-in-alt me-2"></i>Iniciar Sesión
                                </button>
                            </form>
                        </div>
                        
                        <div class="text-center mb-3">
                            <span class="text-muted">O</span>
                        </div>
                        
                        <!-- Botón de Google -->
                        <div class="d-grid gap-2 mb-4">
                            <button class="btn btn-outline-primary" onclick="loginWithGoogle()">
                                <i class="fab fa-google me-2"></i> Continuar con Google
                            </button>
                        </div>
                        
                        <!-- Enlace a Registro -->
                        <div class="text-center">
                            <p class="mb-0">
                                ¿No tienes cuenta? 
                                <a href="#" onclick="showRegisterPage()" class="text-decoration-none">Regístrate aquí</a>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Event listener para el formulario de login con email
    document.getElementById('email-login-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        loginWithEmail(email, password);
    });
}

function showRegisterPage() {
    const content = document.getElementById('content');
    content.innerHTML = `
        <div class="row justify-content-center">
            <div class="col-md-6 col-lg-5">
                <div class="card shadow">
                    <div class="card-body p-4">
                        <div class="text-center mb-4">
                            <i class="fas fa-user-plus fa-3x text-primary mb-3"></i>
                            <h3 class="card-title">Crear Cuenta</h3>
                            <p class="text-muted">Regístrate para comenzar</p>
                        </div>
                        
                        <form id="register-form">
                            <div class="mb-3">
                                <label for="register-username" class="form-label">Nombre de Usuario</label>
                                <input type="text" class="form-control" id="register-username" placeholder="Tu nombre de usuario" required>
                            </div>
                            <div class="mb-3">
                                <label for="register-email" class="form-label">Email</label>
                                <input type="email" class="form-control" id="register-email" placeholder="tu@email.com" required>
                            </div>
                            <div class="mb-3">
                                <label for="register-password" class="form-label">Contraseña</label>
                                <input type="password" class="form-control" id="register-password" placeholder="Mínimo 6 caracteres" minlength="6" required>
                            </div>
                            <button type="submit" class="btn btn-primary w-100 mb-3">
                                <i class="fas fa-user-plus me-2"></i>Crear Cuenta
                            </button>
                        </form>
                        
                        <div class="text-center">
                            <p class="mb-0">
                                ¿Ya tienes cuenta? 
                                <a href="#" onclick="loadLoginPage()" class="text-decoration-none">Inicia Sesión</a>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Event listener para el formulario de registro
    document.getElementById('register-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const username = document.getElementById('register-username').value;
        const email = document.getElementById('register-email').value;
        const password = document.getElementById('register-password').value;
        registerWithEmail(email, password, username);
    });
}

function loadDashboard(user) {
    const content = document.getElementById('content');
    
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    
    content.innerHTML = `
        <div class="container mt-4">
            <!-- Título y fecha -->
            <div class="text-center mb-4">
                <h1 class="text-primary">
                    Movimientos de ${getMonthName(currentMonth)} ${currentYear}
                </h1>
                <p class="text-muted">
                    <i class="far fa-calendar-alt me-1"></i>
                    Del ${getFirstDayOfMonth(currentYear, currentMonth)} al ${getLastDayOfMonth(currentYear, currentMonth)}
                </p>
            </div>

            <!-- Botones principales -->
            <div class="text-center mb-4">
                <button class="btn btn-primary me-2" onclick="showAddBudget()">
                    <i class="fas fa-plus-circle"></i> Agregar Presupuesto
                </button>
                <button class="btn btn-info me-2" onclick="showBudgetsPage()">
                    <i class="fas fa-chart-pie"></i> Ver Mis Presupuestos
                </button>
                <button class="btn btn-success" onclick="showAddTransaction()">
                    <i class="fas fa-plus"></i> Nueva Transacción
                </button>
            </div>

            <!-- Filtros Avanzados -->
            <div class="row justify-content-center mb-4">
                <div class="col-md-12">
                    <div class="card shadow-sm">
                        <div class="card-body">
                            <h5 class="card-title"><i class="fas fa-filter me-2"></i>Filtros Avanzados</h5>
                            <form id="filters-form" class="row g-3">
                                <div class="col-md-4">
                                    <label for="category" class="form-label">Categoría</label>
                                    <select class="form-select" id="category" name="category">
                                        <option value="">Todas las categorías</option>
                                        <!-- Se llenará dinámicamente -->
                                    </select>
                                </div>
                                
                                <div class="col-md-3">
                                    <label for="amount_min" class="form-label">Mínimo ($)</label>
                                    <input type="number" class="form-control" id="amount_min" name="amount_min" 
                                           step="0.01" min="0" placeholder="Mínimo">
                                </div>
                                
                                <div class="col-md-3">
                                    <label for="amount_max" class="form-label">Máximo ($)</label>
                                    <input type="number" class="form-control" id="amount_max" name="amount_max" 
                                           step="0.01" min="0" placeholder="Máximo">
                                </div>
                                
                                <div class="col-md-2 d-flex align-items-end">
                                    <button type="submit" class="btn btn-primary me-2 w-100">
                                        <i class="fas fa-search"></i> Filtrar
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Resumen Financiero Mejorado -->
            <div class="row mb-4" id="financial-summary">
                <!-- Se llenará dinámicamente -->
            </div>

            <!-- Gráfico de Evolución Temporal -->
            <div class="row mb-4">
                <div class="col-md-12">
                    <div class="card shadow">
                        <div class="card-body">
                            <h2 class="text-center card-title mb-4">
                                Evolución de Ingresos y Gastos
                                <small class="text-muted d-block" id="timeline-date-range"></small>
                            </h2>
                            <canvas id="timelineChart" height="120"></canvas>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Sección de transacciones -->
            <div id="transactions-section">
                <div class="card shadow">
                    <div class="card-body">
                        <h5 class="card-title">
                            <i class="fas fa-list me-2"></i>Transacciones Recientes
                        </h5>
                        <div id="transactions-list">
                            <!-- Se llenará dinámicamente -->
                        </div>
                    </div>
                </div>
            </div>

            <!-- Gráficos de Categorías -->
            <div class="row mt-4">
                <div class="col-md-6">
                    <div class="card shadow">
                        <div class="card-body">
                            <h2 class="text-center card-title">
                                Distribución de Ingresos
                            </h2>
                            <canvas id="incomeChart" height="250"></canvas>
                        </div>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="card shadow">
                        <div class="card-body">
                            <h2 class="text-center card-title">
                                Distribución de Gastos
                            </h2>
                            <canvas id="expenseChart" height="250"></canvas>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Configurar event listeners después de renderizar
    setTimeout(() => {
        const filtersForm = document.getElementById('filters-form');
        if (filtersForm) {
            filtersForm.addEventListener('submit', function(e) {
                e.preventDefault();
                applyFilters();
            });
        }
    }, 100);

    // Cargar datos del dashboard
    loadDashboardData(currentYear, currentMonth);
}

// Función para debug de transacciones
function debugTransactions(transactions) {
    console.log('🔍 Debug de transacciones:');
    transactions.forEach((transaction, index) => {
        console.log(`Transacción ${index}:`, {
            type: transaction.type,
            amount: transaction.amount,
            category: transaction.category,
            date: transaction.date,
            dateType: typeof transaction.date,
            hasToDate: transaction.date && typeof transaction.date.toDate === 'function',
            hasSeconds: transaction.date && transaction.date.seconds
        });
    });
}

// Nueva función para cargar datos del dashboard
async function loadDashboardData(year, month) {
    showLoading(true);
    
    try {
        // Obtener datos de transacciones
        const dashboardData = await transactionManager.getDashboardData(month, year);
        
        // Debug de transacciones
        console.log('📊 Datos del dashboard recibidos:', dashboardData);
        debugTransactions(dashboardData.transactions);
        
        // Actualizar resumen financiero
        updateFinancialSummary(dashboardData.summary);
        
        // Actualizar lista de transacciones
        updateTransactionsList(dashboardData.transactions);
        
        // Generar gráficos
        generateCharts(dashboardData);
        
        // Cargar categorías en filtros
        loadCategoriesFilter(dashboardData.categories);
        
    } catch (error) {
        console.error('Error loading dashboard data:', error);
        showToast('Error al cargar el dashboard', 'danger');
    } finally {
        showLoading(false);
    }
}

// Función para actualizar el resumen financiero
function updateFinancialSummary(summary) {
    const financialSummary = document.getElementById('financial-summary');
    if (!financialSummary) {
        console.error('❌ Elemento financial-summary no encontrado');
        return;
    }

    const ahorroPotencial = summary.totalIncome * 0.2;
    const daysInMonth = new Date(summary.year, summary.month, 0).getDate();
    const currentDay = new Date().getDate();
    const daysPassed = Math.min(currentDay, daysInMonth);
    const gastoDiarioPromedio = daysPassed > 0 ? summary.totalExpense / daysPassed : 0;
    
    const summaryHTML = `
        <div class="col-md-3">
            <div class="card bg-success text-white h-100">
                <div class="card-body text-center">
                    <h5 class="card-title">Total Ingresos</h5>
                    <p class="card-text h4">$${summary.totalIncome.toFixed(2)}</p>
                </div>
            </div>
        </div>
        <div class="col-md-3">
            <div class="card bg-danger text-white h-100">
                <div class="card-body text-center">
                    <h5 class="card-title">Total Gastos</h5>
                    <p class="card-text h4">$${summary.totalExpense.toFixed(2)}</p>
                </div>
            </div>
        </div>
        <div class="col-md-2">
            <div class="card ${summary.balance >= 0 ? 'bg-primary' : 'bg-warning'} text-white h-100">
                <div class="card-body text-center">
                    <h5 class="card-title">Balance</h5>
                    <p class="card-text h4">$${summary.balance.toFixed(2)}</p>
                </div>
            </div>
        </div>
        <div class="col-md-2">
            <div class="card bg-info text-white h-100">
                <div class="card-body text-center">
                    <h5 class="card-title">Ahorro Ideal</h5>
                    <p class="card-text h4">$${ahorroPotencial.toFixed(2)}</p>
                    <small class="text-white-50">(20% de ingresos)</small>
                </div>
            </div>
        </div>
        <div class="col-md-2">
            <div class="card bg-secondary text-white h-100">
                <div class="card-body text-center">
                    <h5 class="card-title">Gasto Diario</h5>
                    <p class="card-text h4">$${gastoDiarioPromedio.toFixed(2)}</p>
                </div>
            </div>
        </div>
    `;
    
    financialSummary.innerHTML = summaryHTML;
}

// Función para procesar fecha de transacción
function processTransactionDate(transaction) {
    try {
        if (transaction.date && typeof transaction.date.toDate === 'function') {
            // Si es un Timestamp de Firebase
            return transaction.date.toDate();
        } else if (transaction.date && transaction.date.seconds) {
            // Si es un objeto Timestamp serializado
            return new Date(transaction.date.seconds * 1000);
        } else if (transaction.date) {
            // Si es un string de fecha
            return new Date(transaction.date);
        } else {
            // Fecha por defecto
            return new Date();
        }
    } catch (error) {
        console.error('Error procesando fecha:', error, transaction);
        return new Date();
    }
}

// Función para actualizar lista de transacciones CORREGIDA
function updateTransactionsList(transactions) {
    const transactionsList = document.getElementById('transactions-list');
    if (!transactionsList) {
        console.error('❌ Elemento transactions-list no encontrado');
        return;
    }
    
    if (transactions.length === 0) {
        transactionsList.innerHTML = `
            <div class="text-center py-4">
                <i class="fas fa-receipt fa-3x text-muted mb-3"></i>
                <p class="text-muted">No hay transacciones para mostrar</p>
                <button class="btn btn-primary" onclick="showAddTransaction()">
                    <i class="fas fa-plus me-2"></i>Agregar primera transacción
                </button>
            </div>
        `;
        return;
    }
    
    let transactionsHTML = `
        <div class="table-responsive">
            <table class="table table-hover">
                <thead>
                    <tr>
                        <th>Fecha</th>
                        <th>Categoría</th>
                        <th>Descripción</th>
                        <th>Tipo</th>
                        <th class="text-end">Monto</th>
                    </tr>
                </thead>
                <tbody>
    `;
    
    transactions.slice(0, 10).forEach(transaction => {
        // CORRECCIÓN: Usar la función de procesamiento de fecha
        const date = processTransactionDate(transaction);
        const isIncome = transaction.type === 'income';
        
        transactionsHTML += `
            <tr>
                <td>${date.toLocaleDateString('es-ES')}</td>
                <td>
                    <span class="badge bg-light text-dark">${transaction.category}</span>
                </td>
                <td>${transaction.description || '-'}</td>
                <td>
                    <span class="badge ${isIncome ? 'bg-success' : 'bg-danger'}">
                        ${isIncome ? 'Ingreso' : 'Gasto'}
                    </span>
                </td>
                <td class="text-end ${isIncome ? 'text-success' : 'text-danger'}">
                    <strong>${isIncome ? '+' : '-'}$${transaction.amount.toFixed(2)}</strong>
                </td>
            </tr>
        `;
    });
    
    transactionsHTML += `
                </tbody>
            </table>
        </div>
        ${transactions.length > 10 ? `
            <div class="text-center mt-3">
                <button class="btn btn-outline-primary" onclick="showAllTransactions()">
                    Ver todas las transacciones (${transactions.length})
                </button>
            </div>
        ` : ''}
    `;
    
    transactionsList.innerHTML = transactionsHTML;
}

// Función para generar gráficos
function generateCharts(dashboardData) {
    // Destruir gráficos existentes
    destroyCharts();
    
    // Gráfico de Evolución Temporal
    const timelineCtx = document.getElementById('timelineChart');
    if (timelineCtx) {
        const weeklyData = generateWeeklyData(dashboardData.transactions, dashboardData.summary.month, dashboardData.summary.year);
        
        chartInstances.timeline = new Chart(timelineCtx, {
            type: 'line',
            data: weeklyData,
            options: {
                responsive: true,
                interaction: {
                    mode: 'index',
                    intersect: false
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return '$' + value.toFixed(2);
                            }
                        }
                    }
                },
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return context.dataset.label + ': $' + context.raw.toFixed(2);
                            }
                        }
                    }
                }
            }
        });
    }
    
    // Gráfico de Ingresos por categoría
    const incomeCtx = document.getElementById('incomeChart');
    if (incomeCtx) {
        const incomeCategories = Object.keys(dashboardData.categories.income || {});
        const incomeAmounts = Object.values(dashboardData.categories.income || {});
        
        if (incomeCategories.length > 0) {
            chartInstances.income = new Chart(incomeCtx, {
                type: 'bar',
                data: {
                    labels: incomeCategories,
                    datasets: [{
                        label: 'Ingresos',
                        data: incomeAmounts,
                        backgroundColor: '#28a745',
                        borderColor: '#218838',
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: {
                                callback: function(value) {
                                    return '$' + value.toFixed(2);
                                }
                            }
                        }
                    },
                    plugins: {
                        legend: {
                            display: false
                        }
                    }
                }
            });
        }
    }
    
    // Gráfico de Gastos por categoría
    const expenseCtx = document.getElementById('expenseChart');
    if (expenseCtx) {
        const expenseCategories = Object.keys(dashboardData.categories.expense || {});
        const expenseAmounts = Object.values(dashboardData.categories.expense || {});
        
        if (expenseCategories.length > 0) {
            chartInstances.expense = new Chart(expenseCtx, {
                type: 'bar',
                data: {
                    labels: expenseCategories,
                    datasets: [{
                        label: 'Gastos',
                        data: expenseAmounts,
                        backgroundColor: '#dc3545',
                        borderColor: '#c82333',
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: {
                                callback: function(value) {
                                    return '$' + value.toFixed(2);
                                }
                            }
                        }
                    },
                    plugins: {
                        legend: {
                            display: false
                        }
                    }
                }
            });
        }
    }
}

// Función para generar datos semanales CORREGIDA
function generateWeeklyData(transactions, month, year) {
    const weeks = ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4'];
    const weeklyIncome = [0, 0, 0, 0];
    const weeklyExpense = [0, 0, 0, 0];
    
    transactions.forEach(transaction => {
        // CORRECCIÓN: Usar la función de procesamiento de fecha
        const date = processTransactionDate(transaction);
        const week = Math.floor((date.getDate() - 1) / 7);
        const weekIndex = Math.min(week, 3); // Asegurar que no exceda 3
        
        if (transaction.type === 'income') {
            weeklyIncome[weekIndex] += transaction.amount;
        } else {
            weeklyExpense[weekIndex] += transaction.amount;
        }
    });
    
    return {
        labels: weeks,
        datasets: [
            {
                label: 'Ingresos',
                data: weeklyIncome,
                borderColor: '#28a745',
                backgroundColor: 'rgba(40, 167, 69, 0.1)',
                tension: 0.4
            },
            {
                label: 'Gastos',
                data: weeklyExpense,
                borderColor: '#dc3545',
                backgroundColor: 'rgba(220, 53, 69, 0.1)',
                tension: 0.4
            }
        ]
    };
}

// Función para destruir gráficos existentes
function destroyCharts() {
    Object.values(chartInstances).forEach(chart => {
        if (chart) {
            chart.destroy();
        }
    });
}

// Funciones utilitarias
function getMonthName(month) {
    const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
                   'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    return months[month - 1];
}

function getFirstDayOfMonth(year, month) {
    return new Date(year, month - 1, 1).toLocaleDateString('es-ES');
}

function getLastDayOfMonth(year, month) {
    return new Date(year, month, 0).toLocaleDateString('es-ES');
}

function loadCategoriesFilter(categories) {
    const categoryFilter = document.getElementById('category');
    
    // Verificar que el elemento existe antes de manipularlo
    if (!categoryFilter) {
        console.error('❌ Elemento categoryFilter no encontrado en el DOM');
        return;
    }
    
    try {
        // Limpiar opciones existentes
        categoryFilter.innerHTML = '<option value="">Todas las categorías</option>';
        
        // Obtener categorías únicas de income y expense
        const allCategories = [
            ...Object.keys(categories.income || {}),
            ...Object.keys(categories.expense || {})
        ];
        
        const uniqueCategories = [...new Set(allCategories)].filter(Boolean);
        
        uniqueCategories.forEach(category => {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = category;
            categoryFilter.appendChild(option);
        });
        
        console.log('✅ Filtro de categorías cargado:', uniqueCategories.length, 'categorías');
    } catch (error) {
        console.error('❌ Error cargando filtro de categorías:', error);
    }
}

// Función para aplicar filtros
function applyFilters() {
    const category = document.getElementById('category').value;
    const amountMin = document.getElementById('amount_min').value;
    const amountMax = document.getElementById('amount_max').value;
    
    // Aquí puedes implementar la lógica de filtrado
    showToast('Filtros aplicados: ' + (category || 'Todas categorías'), 'success');
}

// Funciones de navegación y páginas
function showAllTransactions() {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    
    const content = document.getElementById('content');
    content.innerHTML = `
        <div class="container mt-4">
            <div class="d-flex justify-content-between align-items-center mb-4">
                <h2 class="mb-0">
                    <i class="fas fa-list text-primary me-2"></i>
                    Todas las Transacciones
                </h2>
                <div>
                    <button class="btn btn-secondary me-2" onclick="loadDashboard(auth.currentUser)">
                        <i class="fas fa-arrow-left me-1"></i> Volver al Dashboard
                    </button>
                    <button class="btn btn-primary" onclick="showAddTransaction()">
                        <i class="fas fa-plus me-1"></i> Nueva Transacción
                    </button>
                </div>
            </div>

            <div class="row">
                <div class="col-md-12">
                    <div class="card shadow">
                        <div class="card-body">
                            <h5 class="card-title mb-4">
                                <i class="fas fa-receipt me-2"></i>Historial de Transacciones
                            </h5>
                            <div id="all-transactions-list">
                                <div class="text-center py-5">
                                    <i class="fas fa-spinner fa-spin fa-3x text-primary mb-3"></i>
                                    <p class="text-muted">Cargando transacciones...</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    loadAllTransactions(currentYear, currentMonth);
}

// Función para cargar todas las transacciones CORREGIDA
async function loadAllTransactions(year, month) {
    try {
        const transactions = await transactionManager.getTransactions({ month, year });
        const transactionsList = document.getElementById('all-transactions-list');
        
        if (!transactionsList) {
            console.error('❌ Elemento all-transactions-list no encontrado');
            return;
        }

        if (transactions.length === 0) {
            transactionsList.innerHTML = `
                <div class="text-center py-5">
                    <i class="fas fa-receipt fa-3x text-muted mb-3"></i>
                    <p class="text-muted">No hay transacciones para mostrar</p>
                    <button class="btn btn-primary" onclick="showAddTransaction()">
                        <i class="fas fa-plus me-2"></i>Agregar primera transacción
                    </button>
                </div>
            `;
            return;
        }

        let transactionsHTML = `
            <div class="table-responsive">
                <table class="table table-hover">
                    <thead>
                        <tr>
                            <th>Fecha</th>
                            <th>Categoría</th>
                            <th>Descripción</th>
                            <th>Tipo</th>
                            <th class="text-end">Monto</th>
                        </tr>
                    </thead>
                    <tbody>
        `;
        
        transactions.forEach(transaction => {
            // CORRECCIÓN: Usar la función de procesamiento de fecha
            const date = processTransactionDate(transaction);
            const isIncome = transaction.type === 'income';
            
            transactionsHTML += `
                <tr>
                    <td>${date.toLocaleDateString('es-ES')}</td>
                    <td>
                        <span class="badge bg-light text-dark">${transaction.category}</span>
                    </td>
                    <td>${transaction.description || '-'}</td>
                    <td>
                        <span class="badge ${isIncome ? 'bg-success' : 'bg-danger'}">
                            ${isIncome ? 'Ingreso' : 'Gasto'}
                        </span>
                    </td>
                    <td class="text-end ${isIncome ? 'text-success' : 'text-danger'}">
                        <strong>${isIncome ? '+' : '-'}$${transaction.amount.toFixed(2)}</strong>
                    </td>
                </tr>
            `;
        });
        
        transactionsHTML += `
                    </tbody>
                </table>
            </div>
            <div class="mt-3 text-center">
                <p class="text-muted">Mostrando ${transactions.length} transacciones</p>
            </div>
        `;
        
        transactionsList.innerHTML = transactionsHTML;
        
    } catch (error) {
        console.error('Error loading all transactions:', error);
        showToast('Error al cargar las transacciones', 'danger');
    }
}

function showBudgetsPage() {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    
    const content = document.getElementById('content');
    content.innerHTML = `
        <div class="container mt-4">
            <div class="d-flex justify-content-between align-items-center mb-4">
                <h2 class="mb-0">
                    <i class="fas fa-chart-pie text-primary me-2"></i>
                    Mis Presupuestos
                </h2>
                <div>
                    <button class="btn btn-secondary me-2" onclick="loadDashboard(auth.currentUser)">
                        <i class="fas fa-arrow-left me-1"></i> Volver al Dashboard
                    </button>
                    <button class="btn btn-primary" onclick="showAddBudget()">
                        <i class="fas fa-plus me-1"></i> Nuevo Presupuesto
                    </button>
                </div>
            </div>

            <div class="row">
                <div class="col-md-12">
                    <div class="card shadow">
                        <div class="card-body">
                            <h5 class="card-title mb-4">
                                <i class="fas fa-list me-2"></i>Presupuestos Activos
                            </h5>
                            <div id="budgets-list">
                                <div class="text-center py-5">
                                    <i class="fas fa-spinner fa-spin fa-3x text-primary mb-3"></i>
                                    <p class="text-muted">Cargando presupuestos...</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    loadBudgetsList(currentYear, currentMonth);
}

// Función para cargar lista de presupuestos
async function loadBudgetsList(year, month) {
    try {
        const budgetStatus = await budgetManager.getBudgetStatus(parseInt(month), parseInt(year));
        const budgetsList = document.getElementById('budgets-list');
        
        if (!budgetsList) {
            console.error('❌ Elemento budgets-list no encontrado');
            return;
        }

        if (budgetStatus.length === 0) {
            budgetsList.innerHTML = `
                <div class="text-center py-5">
                    <i class="fas fa-chart-pie fa-3x text-muted mb-3"></i>
                    <p class="text-muted">No hay presupuestos para ${getMonthName(month)} ${year}</p>
                    <button class="btn btn-primary" onclick="showAddBudget()">
                        <i class="fas fa-plus me-2"></i>Crear presupuesto
                    </button>
                </div>
            `;
            return;
        }

        let budgetsHTML = `
            <div class="table-responsive">
                <table class="table table-hover">
                    <thead>
                        <tr>
                            <th>Categoría</th>
                            <th>Límite Mensual</th>
                            <th>Gastado</th>
                            <th>Restante</th>
                            <th>Progreso</th>
                        </tr>
                    </thead>
                    <tbody>
        `;
        
        budgetStatus.forEach(budget => {
            const progressClass = budget.percentageUsed < 80 ? 'bg-success' : 
                                budget.percentageUsed < 100 ? 'bg-warning' : 'bg-danger';
            
            budgetsHTML += `
                <tr>
                    <td>
                        <strong>${budget.category}</strong>
                    </td>
                    <td>
                        <strong>$${budget.limit.toFixed(2)}</strong>
                    </td>
                    <td class="text-danger">
                        $${budget.spent.toFixed(2)}
                    </td>
                    <td class="text-success">
                        $${budget.remaining.toFixed(2)}
                    </td>
                    <td>
                        <div class="d-flex align-items-center">
                            <div class="progress flex-grow-1 me-2" style="height: 8px;">
                                <div class="progress-bar ${progressClass}" 
                                     role="progressbar" 
                                     style="width: ${Math.min(budget.percentageUsed, 100)}%"
                                     aria-valuenow="${budget.percentageUsed}" 
                                     aria-valuemin="0" 
                                     aria-valuemax="100">
                                </div>
                            </div>
                            <small class="text-muted">${budget.percentageUsed.toFixed(1)}%</small>
                        </div>
                    </td>
                </tr>
            `;
        });
        
        budgetsHTML += `
                    </tbody>
                </table>
            </div>
        `;
        
        budgetsList.innerHTML = budgetsHTML;
        
    } catch (error) {
        console.error('Error loading budgets list:', error);
        showToast('Error al cargar los presupuestos', 'danger');
    }
}

function showAddTransaction() {
    const content = document.getElementById('content');
    content.innerHTML = `
        <div class="row justify-content-center">
            <div class="col-md-8 col-lg-6">
                <div class="card shadow">
                    <div class="card-body">
                        <div class="d-flex justify-content-between align-items-center mb-4">
                            <h2 class="mb-0">
                                <i class="fas fa-plus-circle text-primary me-2"></i>
                                Agregar Transacción
                            </h2>
                            <button class="btn btn-secondary" onclick="loadDashboard(auth.currentUser)">
                                <i class="fas fa-arrow-left me-1"></i> Volver
                            </button>
                        </div>
                        
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
                                <input type="text" class="form-control" id="transaction-category" placeholder="Ej: Salario, Comida, Transporte..." required>
                            </div>
                            <div class="mb-3">
                                <label for="transaction-date" class="form-label">Fecha</label>
                                <input type="date" class="form-control" id="transaction-date" required>
                            </div>
                            <div class="mb-3">
                                <label for="transaction-description" class="form-label">Descripción (Opcional)</label>
                                <textarea class="form-control" id="transaction-description" rows="2" placeholder="Descripción adicional..."></textarea>
                            </div>
                            <div class="d-grid">
                                <button type="submit" class="btn btn-primary btn-lg">
                                    <i class="fas fa-save me-2"></i>Guardar Transacción
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
            description: document.getElementById('transaction-description').value
        };

        try {
            await transactionManager.addTransaction(transactionData);
            showToast('Transacción agregada correctamente', 'success');
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
                        <div class="d-flex justify-content-between align-items-center mb-4">
                            <h2 class="mb-0">
                                <i class="fas fa-chart-pie text-primary me-2"></i>
                                Crear Presupuesto
                            </h2>
                            <button class="btn btn-secondary" onclick="loadDashboard(auth.currentUser)">
                                <i class="fas fa-arrow-left me-1"></i> Volver
                            </button>
                        </div>
                        
                        <form id="add-budget-form">
                            <div class="mb-3">
                                <label for="budget-category" class="form-label">Categoría</label>
                                <input type="text" class="form-control" id="budget-category" placeholder="Ej: Comida, Transporte, Entretenimiento..." required>
                            </div>
                            <div class="mb-3">
                                <label for="budget-limit" class="form-label">Límite Mensual ($)</label>
                                <input type="number" step="0.01" class="form-control" id="budget-limit" required>
                            </div>
                            <div class="row">
                                <div class="col-md-6 mb-3">
                                    <label for="budget-month" class="form-label">Mes</label>
                                    <select class="form-select" id="budget-month" required>
                                        ${Array.from({length: 12}, (_, i) => `
                                            <option value="${i + 1}" ${i + 1 === currentMonth ? 'selected' : ''}>
                                                ${getMonthName(i + 1)}
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
                            <div class="d-grid">
                                <button type="submit" class="btn btn-primary btn-lg">
                                    <i class="fas fa-save me-2"></i>Crear Presupuesto
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
            year: parseInt(document.getElementById('budget-year').value)
        };

        try {
            await budgetManager.createBudget(budgetData);
            showToast('Presupuesto creado correctamente', 'success');
            loadDashboard(auth.currentUser);
        } catch (error) {
            console.error('Error creando presupuesto:', error);
            showToast('Error al crear el presupuesto', 'danger');
        }
    });
}

function showProfile() {
    const user = auth.currentUser;
    const content = document.getElementById('content');
    
    content.innerHTML = `
        <div class="row justify-content-center">
            <div class="col-md-8">
                <div class="card shadow">
                    <div class="card-body">
                        <div class="d-flex justify-content-between align-items-center mb-4">
                            <h2 class="mb-0">
                                <i class="fas fa-user-circle text-primary me-2"></i>
                                Mi Perfil
                            </h2>
                            <button class="btn btn-secondary" onclick="loadDashboard(auth.currentUser)">
                                <i class="fas fa-arrow-left me-1"></i> Volver
                            </button>
                        </div>
                        
                        <div class="row">
                            <div class="col-md-4 text-center">
                                <i class="fas fa-user-circle fa-5x text-primary mb-3"></i>
                                <h4>${user.email}</h4>
                                <p class="text-muted">Usuario</p>
                            </div>
                            <div class="col-md-8">
                                <div class="row">
                                    <div class="col-6">
                                        <div class="card bg-light">
                                            <div class="card-body text-center">
                                                <h5>Transacciones</h5>
                                                <p class="h3 text-primary" id="profile-transactions-count">0</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="col-6">
                                        <div class="card bg-light">
                                            <div class="card-body text-center">
                                                <h5>Presupuestos</h5>
                                                <p class="h3 text-success" id="profile-budgets-count">0</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                
                                <div class="mt-4">
                                    <h5>Información de la cuenta</h5>
                                    <ul class="list-group">
                                        <li class="list-group-item d-flex justify-content-between align-items-center">
                                            Email verificado
                                            <span class="badge ${user.emailVerified ? 'bg-success' : 'bg-warning'}">
                                                ${user.emailVerified ? 'Sí' : 'No'}
                                            </span>
                                        </li>
                                        <li class="list-group-item d-flex justify-content-between align-items-center">
                                            Proveedor
                                            <span class="badge bg-info">${user.providerData[0]?.providerId || 'Email'}</span>
                                        </li>
                                        <li class="list-group-item d-flex justify-content-between align-items-center">
                                            Fecha de creación
                                            <small class="text-muted">${new Date(user.metadata.creationTime).toLocaleDateString('es-ES')}</small>
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Cargar estadísticas del perfil
    loadProfileStats();
}

// Función para cargar estadísticas del perfil
async function loadProfileStats() {
    try {
        // Obtener transacciones del mes actual
        const now = new Date();
        const transactions = await transactionManager.getTransactions({ 
            month: now.getMonth() + 1, 
            year: now.getFullYear() 
        });
        
        // Obtener presupuestos del mes actual
        const budgets = await budgetManager.getBudgetStatus(now.getMonth() + 1, now.getFullYear());
        
        // Actualizar contadores
        const transactionsCount = document.getElementById('profile-transactions-count');
        const budgetsCount = document.getElementById('profile-budgets-count');
        
        if (transactionsCount) {
            transactionsCount.textContent = transactions.length;
        }
        
        if (budgetsCount) {
            budgetsCount.textContent = budgets.length;
        }
        
    } catch (error) {
        console.error('Error loading profile stats:', error);
    }
}

// FUNCIONES UTILITARIAS
function showLoading(show) {
    const loadingSpinner = document.getElementById('loading-spinner');
    if (loadingSpinner) {
        loadingSpinner.style.display = show ? 'block' : 'none';
    }
}

function showToast(message, type = 'info') {
    const toastContainer = document.getElementById('toast-container');
    const toastId = 'toast-' + Date.now();
    
    const toastHTML = `
        <div id="${toastId}" class="toast align-items-center text-bg-${type} border-0" role="alert">
            <div class="d-flex">
                <div class="toast-body">
                    ${message}
                </div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
            </div>
        </div>
    `;
    
    toastContainer.innerHTML += toastHTML;
    
    const toastElement = document.getElementById(toastId);
    const toast = new bootstrap.Toast(toastElement);
    toast.show();
    
    // Remover el toast del DOM después de que se oculte
    toastElement.addEventListener('hidden.bs.toast', () => {
        toastElement.remove();
    });
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