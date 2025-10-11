// app.js - Aplicación principal
let chartInstances = {
    timeline: null,
    income: null,
    expense: null
};

let currentTimeframe = 'week'; // 'week' o 'month'

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
                            <img src="/static/logo_torotech1.webp" alt="Logo ToroTech" class="login-logo" onerror="this.style.display='none'">
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

    // Manejar el logo del login
    handleLoginLogo();
}




function showRegisterPage() {
    const content = document.getElementById('content');
    content.innerHTML = `
        <div class="row justify-content-center">
            <div class="col-md-6 col-lg-5">
                <div class="card shadow">
                    <div class="card-body p-4">
                        <div class="text-center mb-4">
                            <img src="/static/logo_torotech1.webp" alt="Logo ToroTech" class="login-logo" onerror="this.style.display='none'">
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

    // Manejar el logo del registro
    handleLoginLogo();
}

// Función para manejar logos en páginas de login/registro
function handleLoginLogo() {
    const loginLogos = document.querySelectorAll('.login-logo');
    loginLogos.forEach(logo => {
        logo.onerror = function() {
            console.log('❌ Logo no encontrado para login');
            this.style.display = 'none';
            // Mostrar ícono de respaldo
            const parent = this.parentElement;
            const backupIcon = document.createElement('i');
            backupIcon.className = 'fas fa-wallet fa-3x text-primary mb-3';
            parent.appendChild(backupIcon);
        };
        logo.onload = function() {
            console.log('✅ Logo de login cargado correctamente');
            this.style.display = 'block';
        };
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

            <!-- Resumen Financiero Mejorado - EN UNA SOLA FILA -->
            <div class="row mb-4" id="financial-summary">
                <!-- Se llenará dinámicamente -->
            </div>

            <!-- Botones principales EN UNA SOLA FILA -->
            <div class="row justify-content-center mb-4">
                <div class="col-md-12">
                    <div class="d-flex justify-content-center gap-3 flex-wrap">
                        <button class="btn btn-primary" onclick="showAddBudget()">
                            <i class="fas fa-plus-circle me-2"></i>Agregar Presupuesto
                        </button>
                        <button class="btn btn-info" onclick="showBudgetsPage()">
                            <i class="fas fa-chart-pie me-2"></i>Ver Mis Presupuestos
                        </button>
                        <button class="btn btn-success" onclick="showAddTransaction()">
                            <i class="fas fa-plus me-2"></i>Nueva Transacción
                        </button>
                    </div>
                </div>
            </div>

            <!-- Filtros Avanzados - MOVIDO ABAJO -->
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

            <!-- Gráfico de Evolución Temporal con Selector -->
            <div class="row mb-4">
                <div class="col-md-12">
                    <div class="card shadow">
                        <div class="card-body">
                            <div class="d-flex justify-content-between align-items-center mb-4">
                                <h2 class="card-title mb-0">
                                    Evolución de Ingresos y Gastos
                                </h2>
                                <div class="btn-group" role="group">
                                    <input type="radio" class="btn-check" name="timeframe" id="timeframe-week" value="week" ${currentTimeframe === 'week' ? 'checked' : ''}>
                                    <label class="btn btn-outline-primary" for="timeframe-week">
                                        <i class="fas fa-calendar-week me-1"></i>Semanal
                                    </label>
                                    <input type="radio" class="btn-check" name="timeframe" id="timeframe-month" value="month" ${currentTimeframe === 'month' ? 'checked' : ''}>
                                    <label class="btn btn-outline-primary" for="timeframe-month">
                                        <i class="fas fa-calendar-alt me-1"></i>Mensual
                                    </label>
                                </div>
                            </div>
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

        // Configurar selectores de timeframe
        document.getElementById('timeframe-week').addEventListener('change', function() {
            if (this.checked) {
                currentTimeframe = 'week';
                reloadDashboardWithTimeframe('week');
            }
        });
        document.getElementById('timeframe-month').addEventListener('change', function() {
            if (this.checked) {
                currentTimeframe = 'month';
                reloadDashboardWithTimeframe('month');
            }
        });
    }, 100);

    // Cargar datos del dashboard
    loadDashboardData(currentYear, currentMonth, currentTimeframe);
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

// FUNCIÓN MEJORADA: Cargar datos del dashboard con selector de vista temporal
async function loadDashboardData(year, month, timeframe = 'week') {
    showLoading(true);
    
    try {
        // Obtener datos de transacciones
        const dashboardData = await transactionManager.getDashboardData(month, year);
        
        // Debug de transacciones
        console.log('📊 Datos del dashboard recibidos:', dashboardData);
        debugTransactions(dashboardData.transactions);
        
        // Actualizar resumen financiero
        updateFinancialSummary(dashboardData.summary);
        
        // Actualizar lista de transacciones con botones de editar/eliminar
        updateTransactionsList(dashboardData.transactions);
        
        // Generar gráficos con el timeframe seleccionado
        generateCharts(dashboardData, timeframe);
        
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
    if (!financialSummary) return;

    const ahorroPotencial = summary.totalIncome * 0.2;
    const daysInMonth = new Date(summary.year, summary.month, 0).getDate();
    const currentDay = new Date().getDate();
    const daysPassed = Math.min(currentDay, daysInMonth);
    const gastoDiarioPromedio = daysPassed > 0 ? summary.totalExpense / daysPassed : 0;
    
    const summaryHTML = `
        <div class="col-md-3">
            <div class="card border-success h-100">
                <div class="card-body text-center p-2">
                    <i class="fas fa-arrow-down text-success fa-lg mb-2"></i>
                    <h6 class="card-title text-success mb-1">INGRESOS</h6>
                    <p class="card-text h5 text-success mb-1">$${summary.totalIncome.toFixed(2)}</p>
                    <small class="text-muted">Total del mes</small>
                </div>
            </div>
        </div>
        <div class="col-md-3">
            <div class="card border-danger h-100">
                <div class="card-body text-center p-2">
                    <i class="fas fa-arrow-up text-danger fa-lg mb-2"></i>
                    <h6 class="card-title text-danger mb-1">GASTOS</h6>
                    <p class="card-text h5 text-danger mb-1">$${summary.totalExpense.toFixed(2)}</p>
                    <small class="text-muted">Total del mes</small>
                </div>
            </div>
        </div>
        <div class="col-md-3">
            <div class="card ${summary.balance >= 0 ? 'border-primary' : 'border-warning'} h-100">
                <div class="card-body text-center p-2">
                    <i class="fas fa-balance-scale ${summary.balance >= 0 ? 'text-primary' : 'text-warning'} fa-lg mb-2"></i>
                    <h6 class="card-title ${summary.balance >= 0 ? 'text-primary' : 'text-warning'} mb-1">BALANCE</h6>
                    <p class="card-text h5 ${summary.balance >= 0 ? 'text-primary' : 'text-warning'} mb-1">$${summary.balance.toFixed(2)}</p>
                    <small class="text-muted">${summary.balance >= 0 ? '👍 Positivo' : '👎 Negativo'}</small>
                </div>
            </div>
        </div>
        <div class="col-md-3">
            <div class="card border-info h-100">
                <div class="card-body text-center p-2">
                    <i class="fas fa-fire text-info fa-lg mb-2"></i>
                    <h6 class="card-title text-info mb-1">GASTO DIARIO</h6>
                    <p class="card-text h5 text-info mb-1">$${gastoDiarioPromedio.toFixed(2)}</p>
                    <small class="text-muted">Día ${daysPassed}/${daysInMonth}</small>
                </div>
            </div>
        </div>
    `;
    
    financialSummary.innerHTML = summaryHTML;
}



function processTransactionDate(transaction) {
    
    if (transaction.date instanceof Date && !isNaN(transaction.date.getTime())) {
        return transaction.date;
    }
    
    // Si no, usar la función del TransactionManager
    if (typeof transactionManager !== 'undefined' && transactionManager.processTransactionDate) {
        return transactionManager.processTransactionDate(transaction);
    }
    
    
    console.warn('⚠️ Usando fecha actual como fallback');
    return new Date();
}



function updateTransactionsList(transactions) {
    const transactionsList = document.getElementById('transactions-list');
    if (!transactionsList) {
        console.error('❌ Elemento transactions-list no encontrado');
        return;
    }
    
    // DEBUG: Mostrar información de fechas
    console.log('🔍 Debug de fechas en transacciones recientes:');
    transactions.slice(0, 5).forEach((transaction, index) => {
        const processedDate = processTransactionDate(transaction);
        console.log(`Transacción ${index}:`, {
            id: transaction.id,
            fechaProcesada: processedDate,
            fechaFormateada: processedDate.toLocaleDateString('es-ES'),
            tipo: transaction.type,
            categoria: transaction.category
        });
    });
    
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
                        <th class="text-center">Acciones</th>
                    </tr>
                </thead>
                <tbody>
    `;
    
    transactions.slice(0, 10).forEach(transaction => {
        const date = processTransactionDate(transaction);
        const isIncome = transaction.type === 'income';
        const formattedDate = date.toLocaleDateString('es-ES');
        
        transactionsHTML += `
            <tr>
                <td>${formattedDate}</td>
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
                <td class="text-center">
                    <button class="btn btn-sm btn-outline-primary me-1" onclick="editTransaction('${transaction.id}')" title="Editar">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger" onclick="deleteTransaction('${transaction.id}')" title="Eliminar">
                        <i class="fas fa-trash"></i>
                    </button>
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




function generateCharts(dashboardData, timeframe = 'week', chartType = 'doughnut') {
    // Destruir gráficos existentes
    destroyCharts();
    
    // Gráfico de Evolución Temporal
    const timelineCtx = document.getElementById('timelineChart');
    if (timelineCtx) {
        let timelineData;
        
        if (timeframe === 'week') {
            timelineData = generateDailyData(dashboardData.transactions, dashboardData.summary.month, dashboardData.summary.year);
        } else {
            timelineData = generateWeeklyData(dashboardData.transactions, dashboardData.summary.month, dashboardData.summary.year);
        }
        
        chartInstances.timeline = new Chart(timelineCtx, {
            type: 'line',
            data: timelineData,
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
                    },
                    legend: {
                        display: true,
                        position: 'top'
                    }
                }
            }
        });
    }
    
    // Gráfico de Ingresos por categoría con selector de tipo
    const incomeCtx = document.getElementById('incomeChart');
    if (incomeCtx) {
        const incomeCategories = Object.keys(dashboardData.categories.income || {});
        const incomeAmounts = Object.values(dashboardData.categories.income || {});
        
        if (incomeCategories.length > 0) {
            // Crear contenedor para el selector de tipo de gráfica
            const incomeContainer = incomeCtx.closest('.card-body');
            addChartTypeSelector(incomeContainer, 'income', chartType);
            
            chartInstances.income = createCategoryChart(
                incomeCtx, 
                incomeCategories, 
                incomeAmounts, 
                'Ingresos', 
                chartType,
                ['#28a745', '#20c997', '#17a2b8', '#6f42c1', '#e83e8c', '#fd7e14', '#ffc107']
            );
        } else {
            incomeCtx.parentElement.innerHTML = `
                <div class="text-center py-4">
                    <i class="fas fa-chart-pie fa-3x text-muted mb-3"></i>
                    <p class="text-muted">No hay datos de ingresos</p>
                </div>
            `;
        }
    }
    
    // Gráfico de Gastos por categoría con selector de tipo
    const expenseCtx = document.getElementById('expenseChart');
    if (expenseCtx) {
        const expenseCategories = Object.keys(dashboardData.categories.expense || {});
        const expenseAmounts = Object.values(dashboardData.categories.expense || {});
        
        if (expenseCategories.length > 0) {
            // Crear contenedor para el selector de tipo de gráfica
            const expenseContainer = expenseCtx.closest('.card-body');
            addChartTypeSelector(expenseContainer, 'expense', chartType);
            
            chartInstances.expense = createCategoryChart(
                expenseCtx, 
                expenseCategories, 
                expenseAmounts, 
                'Gastos', 
                chartType,
                ['#dc3545', '#fd7e14', '#ffc107', '#6610f2', '#e83e8c', '#6f42c1', '#fd7e14']
            );
        } else {
            expenseCtx.parentElement.innerHTML = `
                <div class="text-center py-4">
                    <i class="fas fa-chart-pie fa-3x text-muted mb-3"></i>
                    <p class="text-muted">No hay datos de gastos</p>
                </div>
            `;
        }
    }
}

// NUEVA FUNCIÓN: Crear selector de tipo de gráfica
function addChartTypeSelector(container, chartId, currentType) {
    // Verificar si ya existe el selector
    let selectorContainer = container.querySelector('.chart-type-selector');
    
    if (!selectorContainer) {
        selectorContainer = document.createElement('div');
        selectorContainer.className = 'chart-type-selector text-center mb-3';
        
        const selectorHTML = `
            <div class="btn-group btn-group-sm" role="group">
                <input type="radio" class="btn-check" name="chart-type-${chartId}" id="doughnut-${chartId}" value="doughnut" ${currentType === 'doughnut' ? 'checked' : ''}>
                <label class="btn btn-outline-primary" for="doughnut-${chartId}" title="Gráfica de Pastel">
                    <i class="fas fa-chart-pie"></i>
                </label>
                
                <input type="radio" class="btn-check" name="chart-type-${chartId}" id="bar-${chartId}" value="bar" ${currentType === 'bar' ? 'checked' : ''}>
                <label class="btn btn-outline-primary" for="bar-${chartId}" title="Gráfica de Barras">
                    <i class="fas fa-chart-bar"></i>
                </label>
            </div>
        `;
        
        selectorContainer.innerHTML = selectorHTML;
        
        // Insertar después del título
        const title = container.querySelector('h2');
        title.parentNode.insertBefore(selectorContainer, title.nextSibling);
        
        // Agregar event listeners
        document.getElementById(`doughnut-${chartId}`).addEventListener('change', function() {
            if (this.checked) {
                reloadDashboardWithChartType('doughnut');
            }
        });
        
        document.getElementById(`bar-${chartId}`).addEventListener('change', function() {
            if (this.checked) {
                reloadDashboardWithChartType('bar');
            }
        });
    }
}

// NUEVA FUNCIÓN: Crear gráfica de categorías según el tipo
function createCategoryChart(ctx, categories, amounts, label, chartType, colors) {
    const isBarChart = chartType === 'bar';
    
    const data = {
        labels: categories,
        datasets: [{
            label: label,
            data: amounts,
            backgroundColor: colors,
            borderColor: isBarChart ? colors.map(color => color.replace('0.8', '1')) : '#fff',
            borderWidth: isBarChart ? 1 : 2
        }]
    };
    
    const options = {
        responsive: true,
        plugins: {
            legend: {
                position: isBarChart ? 'top' : 'bottom',
                labels: {
                    padding: 15,
                    usePointStyle: !isBarChart
                }
            },
            tooltip: {
                callbacks: {
                    label: function(context) {
                        const label = context.label || '';
                        const value = context.raw || 0;
                        const total = context.dataset.data.reduce((a, b) => a + b, 0);
                        const percentage = Math.round((value / total) * 100);
                        return `${label}: $${value.toFixed(2)} (${percentage}%)`;
                    }
                }
            }
        }
    };
    
    // Configuraciones específicas para gráficas de barras
    if (isBarChart) {
        options.scales = {
            y: {
                beginAtZero: true,
                ticks: {
                    callback: function(value) {
                        return '$' + value.toFixed(2);
                    }
                }
            }
        };
        options.plugins.legend.display = false;
    }
    
    return new Chart(ctx, {
        type: chartType,
        data: data,
        options: options
    });
}

// NUEVA FUNCIÓN: Recargar dashboard con tipo de gráfica seleccionado
function reloadDashboardWithChartType(chartType) {
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    
    loadDashboardData(currentYear, currentMonth, currentTimeframe, chartType);
}

// MODIFICA la función loadDashboardData para aceptar chartType
async function loadDashboardData(year, month, timeframe = 'week', chartType = 'doughnut') {
    showLoading(true);
    
    try {
        // Obtener datos de transacciones
        const dashboardData = await transactionManager.getDashboardData(month, year);
        
        // Actualizar resumen financiero
        updateFinancialSummary(dashboardData.summary);
        
        // Actualizar lista de transacciones con botones de editar/eliminar
        updateTransactionsList(dashboardData.transactions);
        
        // Generar gráficos con el timeframe y chartType seleccionados
        generateCharts(dashboardData, timeframe, chartType);
        
        // Cargar categorías en filtros
        loadCategoriesFilter(dashboardData.categories);
        
    } catch (error) {
        console.error('Error loading dashboard data:', error);
        showToast('Error al cargar el dashboard', 'danger');
    } finally {
        showLoading(false);
    }
}


let currentChartType = 'doughnut'; 

//  reloadDashboardWithChartType
function reloadDashboardWithChartType(chartType) {
    currentChartType = chartType;
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    
    loadDashboardData(currentYear, currentMonth, currentTimeframe, chartType);
}





// NUEVA FUNCIÓN: Generar datos diarios para vista semanal
function generateDailyData(transactions, month, year) {
    // Obtener el primer y último día del mes
    const firstDay = new Date(year, month - 1, 1);
    const lastDay = new Date(year, month, 0);
    
    // Crear array para todos los días del mes
    const daysInMonth = lastDay.getDate();
    const dailyIncome = new Array(daysInMonth).fill(0);
    const dailyExpense = new Array(daysInMonth).fill(0);
    
    // Procesar transacciones
    transactions.forEach(transaction => {
        const date = processTransactionDate(transaction);
        const day = date.getDate() - 1; // índice 0-based
        
        if (day >= 0 && day < daysInMonth) {
            if (transaction.type === 'income') {
                dailyIncome[day] += transaction.amount;
            } else {
                dailyExpense[day] += transaction.amount;
            }
        }
    });
    
    // Crear etiquetas para los días
    const dayLabels = Array.from({length: daysInMonth}, (_, i) => {
        const day = i + 1;
        return `${day}/${month}`;
    });
    
    return {
        labels: dayLabels,
        datasets: [
            {
                label: 'Ingresos Diarios',
                data: dailyIncome,
                borderColor: '#28a745',
                backgroundColor: 'rgba(40, 167, 69, 0.1)',
                tension: 0.4,
                fill: true
            },
            {
                label: 'Gastos Diarios',
                data: dailyExpense,
                borderColor: '#dc3545',
                backgroundColor: 'rgba(220, 53, 69, 0.1)',
                tension: 0.4,
                fill: true
            }
        ]
    };
}

// FUNCIÓN MEJORADA: Generar datos semanales para vista mensual
function generateWeeklyData(transactions, month, year) {
    const weeks = ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4', 'Sem 5'];
    const weeklyIncome = [0, 0, 0, 0, 0];
    const weeklyExpense = [0, 0, 0, 0, 0];
    
    transactions.forEach(transaction => {
        const date = processTransactionDate(transaction);
        const day = date.getDate();
        const week = Math.floor((day - 1) / 7);
        const weekIndex = Math.min(week, 4); // Asegurar que no exceda 4 (semana 5)
        
        if (transaction.type === 'income') {
            weeklyIncome[weekIndex] += transaction.amount;
        } else {
            weeklyExpense[weekIndex] += transaction.amount;
        }
    });
    
    // Filtrar semanas que tengan datos
    const hasData = weeklyIncome.some(income => income > 0) || weeklyExpense.some(expense => expense > 0);
    if (!hasData) {
        return {
            labels: ['Sin datos'],
            datasets: [
                {
                    label: 'Ingresos',
                    data: [0],
                    borderColor: '#28a745',
                    backgroundColor: 'rgba(40, 167, 69, 0.1)',
                    tension: 0.4
                },
                {
                    label: 'Gastos',
                    data: [0],
                    borderColor: '#dc3545',
                    backgroundColor: 'rgba(220, 53, 69, 0.1)',
                    tension: 0.4
                }
            ]
        };
    }
    
    return {
        labels: weeks,
        datasets: [
            {
                label: 'Ingresos Semanales',
                data: weeklyIncome,
                borderColor: '#28a745',
                backgroundColor: 'rgba(40, 167, 69, 0.1)',
                tension: 0.4,
                fill: true
            },
            {
                label: 'Gastos Semanales',
                data: weeklyExpense,
                borderColor: '#dc3545',
                backgroundColor: 'rgba(220, 53, 69, 0.1)',
                tension: 0.4,
                fill: true
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

// FUNCIÓN MEJORADA: Recargar dashboard con timeframe seleccionado
function reloadDashboardWithTimeframe(timeframe) {
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    
    loadDashboardData(currentYear, currentMonth, timeframe);
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

async function editTransaction(transactionId) {
    try {
        console.log('🔍 Editando transacción ID:', transactionId);
        
        // Obtener la transacción
        const transactions = await transactionManager.getTransactions({});
        const transaction = transactions.find(t => t.id === transactionId);
        
        if (!transaction) {
            console.error('❌ Transacción no encontrada');
            showToast('Transacción no encontrada', 'danger');
            return;
        }
        
        console.log('✅ Transacción encontrada:', transaction);
        console.log('📅 Fecha de la transacción:', transaction.date);
        console.log('📅 Tipo de fecha:', typeof transaction.date);
        
        // Mostrar formulario de edición
        showEditTransactionForm(transaction);
        
    } catch (error) {
        console.error('❌ Error al editar transacción:', error);
        showToast('Error al cargar la transacción', 'danger');
    }
}


async function deleteTransaction(transactionId) {
    if (confirm('¿Estás seguro de que quieres eliminar esta transacción?')) {
        try {
            await transactionManager.deleteTransaction(transactionId);
            showToast('Transacción eliminada correctamente', 'success');
            // Recargar el dashboard
            loadDashboard(auth.currentUser);
        } catch (error) {
            console.error('Error al eliminar transacción:', error);
            showToast('Error al eliminar la transacción', 'danger');
        }
    }
}


function showEditTransactionForm(transaction) {
    const content = document.getElementById('content');
    
    // CORRECCIÓN COMPLETA: Usar función utilitaria para fecha
    let formattedDate;
    try {
        const date = processTransactionDate(transaction);
        
        // Verificar si la fecha es válida
        if (date instanceof Date && !isNaN(date.getTime())) {
            formattedDate = adjustDateForInput(date);
        } else {
            // Si la fecha no es válida, usar la fecha actual
            console.warn('Fecha inválida, usando fecha actual');
            formattedDate = adjustDateForInput(new Date());
        }
    } catch (error) {
        console.error('Error procesando fecha:', error);
        // Usar fecha actual como fallback
        formattedDate = adjustDateForInput(new Date());
    }
    
    content.innerHTML = `
        <div class="row justify-content-center">
            <div class="col-md-8 col-lg-6">
                <div class="card shadow">
                    <div class="card-body">
                        <div class="d-flex justify-content-between align-items-center mb-4">
                            <h2 class="mb-0">
                                <i class="fas fa-edit text-primary me-2"></i>
                                Editar Transacción
                            </h2>
                            <button class="btn btn-secondary" onclick="loadDashboard(auth.currentUser)">
                                <i class="fas fa-arrow-left me-1"></i> Volver
                            </button>
                        </div>
                        
                        <form id="edit-transaction-form">
                            <div class="row">
                                <div class="col-md-6 mb-3">
                                    <label for="edit-transaction-type" class="form-label">Tipo</label>
                                    <select class="form-select" id="edit-transaction-type" required>
                                        <option value="income" ${transaction.type === 'income' ? 'selected' : ''}>Ingreso</option>
                                        <option value="expense" ${transaction.type === 'expense' ? 'selected' : ''}>Gasto</option>
                                    </select>
                                </div>
                                <div class="col-md-6 mb-3">
                                    <label for="edit-transaction-amount" class="form-label">Monto ($)</label>
                                    <input type="number" step="0.01" class="form-control" id="edit-transaction-amount" 
                                           value="${transaction.amount}" required>
                                </div>
                            </div>
                            <div class="mb-3">
                                <label for="edit-transaction-category" class="form-label">Categoría</label>
                                <input type="text" class="form-control" id="edit-transaction-category" 
                                       value="${transaction.category}" required>
                            </div>
                            <div class="mb-3">
                                <label for="edit-transaction-date" class="form-label">Fecha</label>
                                <input type="date" class="form-control" id="edit-transaction-date" 
                                       value="${formattedDate}" required>
                            </div>
                            <div class="mb-3">
                                <label for="edit-transaction-description" class="form-label">Descripción (Opcional)</label>
                                <textarea class="form-control" id="edit-transaction-description" rows="2">${transaction.description || ''}</textarea>
                            </div>
                            <div class="d-grid">
                                <button type="submit" class="btn btn-primary btn-lg">
                                    <i class="fas fa-save me-2"></i>Actualizar Transacción
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    `;

    document.getElementById('edit-transaction-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // CORRECCIÓN: Usar función utilitaria para procesar fecha
        const rawDate = document.getElementById('edit-transaction-date').value;
        const adjustedDate = adjustDateFromInput(rawDate);
        
        const transactionData = {
            type: document.getElementById('edit-transaction-type').value,
            amount: parseFloat(document.getElementById('edit-transaction-amount').value),
            category: document.getElementById('edit-transaction-category').value,
            date: adjustedDate.toISOString(), // Enviar como ISO string completo
            description: document.getElementById('edit-transaction-description').value
        };

        console.log('📅 Fecha enviada al backend:', {
            raw: rawDate,
            adjusted: adjustedDate,
            iso: adjustedDate.toISOString(),
            local: adjustedDate.toLocaleDateString('es-ES')
        });

        try {
            await transactionManager.updateTransaction(transaction.id, transactionData);
            showToast('Transacción actualizada correctamente', 'success');
            loadDashboard(auth.currentUser);
        } catch (error) {
            console.error('Error actualizando transacción:', error);
            showToast('Error al actualizar la transacción', 'danger');
        }
    });
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

    // CORRECCIÓN: Usar función utilitaria para fecha por defecto
    document.getElementById('transaction-date').value = adjustDateForInput(new Date());

    document.getElementById('add-transaction-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // CORRECCIÓN: Usar función utilitaria para procesar fecha
        const rawDate = document.getElementById('transaction-date').value;
        const adjustedDate = adjustDateFromInput(rawDate);
        
        const transactionData = {
            type: document.getElementById('transaction-type').value,
            amount: parseFloat(document.getElementById('transaction-amount').value),
            category: document.getElementById('transaction-category').value,
            date: adjustedDate.toISOString(), // Enviar como ISO string completo
            description: document.getElementById('transaction-description').value
        };

        console.log('📅 Fecha enviada al backend:', {
            raw: rawDate,
            adjusted: adjustedDate,
            iso: adjustedDate.toISOString(),
            local: adjustedDate.toLocaleDateString('es-ES')
        });

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



// FUNCIONES UTILITARIAS PARA MANEJO DE FECHAS
function adjustDateForInput(date) {
    if (!(date instanceof Date) || isNaN(date.getTime())) {
        date = new Date();
    }
    // Ajustar para input type="date" (convertir a fecha local sin zona horaria)
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function adjustDateFromInput(dateString) {
    // El input type="date" devuelve YYYY-MM-DD en zona horaria local
    // Crear fecha en hora local para evitar problemas de zona horaria
    const [year, month, day] = dateString.split('-');
    return new Date(year, month - 1, day, 12, 0, 0); // Usar mediodía para evitar problemas de zona horaria
}





// Funciones de navegación y páginas (se mantienen igual)
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
                            <th class="text-center">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
        `;
        
        transactions.forEach(transaction => {
            const date = processTransactionDate(transaction);
            const isIncome = transaction.type === 'income';
            const formattedDate = date.toLocaleDateString('es-ES');
            
            transactionsHTML += `
                <tr>
                    <td>${formattedDate}</td>
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
                    <td class="text-center">
                        <button class="btn btn-sm btn-outline-primary me-1" onclick="editTransaction('${transaction.id}')" title="Editar">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-danger" onclick="deleteTransaction('${transaction.id}')" title="Eliminar">
                            <i class="fas fa-trash"></i>
                        </button>
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

// Función para cargar lista de presupuestos - VERSIÓN ACTUALIZADA CON BOTONES
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
                            <th class="text-center">Acciones</th>
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
                    <td class="${budget.remaining >= 0 ? 'text-success' : 'text-danger'}">
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
                    <td class="text-center">
                        <button class="btn btn-sm btn-outline-primary me-1" onclick="editBudget('${budget.id}')" title="Editar">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-danger" onclick="deleteBudget('${budget.id}')" title="Eliminar">
                            <i class="fas fa-trash"></i>
                        </button>
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

// AGREGAR estas nuevas funciones al archivo app.js

// Función para editar presupuesto
async function editBudget(budgetId) {
    try {
        console.log('🔍 Editando presupuesto ID:', budgetId);
        
        // Obtener todos los presupuestos del usuario
        const allBudgets = await budgetManager.getAllUserBudgets();
        const budget = allBudgets.find(b => b.id === budgetId);
        
        if (!budget) {
            console.error('❌ Presupuesto no encontrado');
            showToast('Presupuesto no encontrado', 'danger');
            return;
        }
        
        console.log('✅ Presupuesto encontrado:', budget);
        showEditBudgetForm(budget);
        
    } catch (error) {
        console.error('❌ Error al editar presupuesto:', error);
        showToast('Error al cargar el presupuesto', 'danger');
    }
}

// Función para mostrar formulario de edición de presupuesto
function showEditBudgetForm(budget) {
    const content = document.getElementById('content');
    
    content.innerHTML = `
        <div class="row justify-content-center">
            <div class="col-md-8 col-lg-6">
                <div class="card shadow">
                    <div class="card-body">
                        <div class="d-flex justify-content-between align-items-center mb-4">
                            <h2 class="mb-0">
                                <i class="fas fa-edit text-primary me-2"></i>
                                Editar Presupuesto
                            </h2>
                            <button class="btn btn-secondary" onclick="showBudgetsPage()">
                                <i class="fas fa-arrow-left me-1"></i> Volver
                            </button>
                        </div>
                        
                        <form id="edit-budget-form">
                            <div class="mb-3">
                                <label for="edit-budget-category" class="form-label">Categoría</label>
                                <input type="text" class="form-control" id="edit-budget-category" 
                                       value="${budget.category}" required readonly>
                                <div class="form-text text-muted">
                                    <i class="fas fa-info-circle me-1"></i>
                                    La categoría no se puede modificar para mantener la integridad de los datos.
                                </div>
                            </div>
                            <div class="mb-3">
                                <label for="edit-budget-limit" class="form-label">Límite Mensual ($)</label>
                                <input type="number" step="0.01" class="form-control" id="edit-budget-limit" 
                                       value="${budget.limit}" required>
                            </div>
                            <div class="row">
                                <div class="col-md-6 mb-3">
                                    <label for="edit-budget-month" class="form-label">Mes</label>
                                    <select class="form-select" id="edit-budget-month" required>
                                        ${Array.from({length: 12}, (_, i) => `
                                            <option value="${i + 1}" ${i + 1 === budget.month ? 'selected' : ''}>
                                                ${getMonthName(i + 1)}
                                            </option>
                                        `).join('')}
                                    </select>
                                </div>
                                <div class="col-md-6 mb-3">
                                    <label for="edit-budget-year" class="form-label">Año</label>
                                    <input type="number" class="form-control" id="edit-budget-year" 
                                           value="${budget.year}" min="2020" max="2030" required>
                                </div>
                            </div>
                            
                            <!-- Información del presupuesto actual -->
                            <div class="alert alert-info">
                                <h6 class="alert-heading">
                                    <i class="fas fa-chart-bar me-2"></i>Resumen Actual
                                </h6>
                                <div class="row small">
                                    <div class="col-6">
                                        <strong>Límite actual:</strong><br>
                                        $${budget.limit.toFixed(2)}
                                    </div>
                                    <div class="col-6">
                                        <strong>Mes/Año:</strong><br>
                                        ${getMonthName(budget.month)} ${budget.year}
                                    </div>
                                </div>
                            </div>
                            
                            <div class="d-grid">
                                <button type="submit" class="btn btn-primary btn-lg">
                                    <i class="fas fa-save me-2"></i>Actualizar Presupuesto
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    `;

    document.getElementById('edit-budget-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const budgetData = {
            limit: parseFloat(document.getElementById('edit-budget-limit').value),
            month: parseInt(document.getElementById('edit-budget-month').value),
            year: parseInt(document.getElementById('edit-budget-year').value)
        };

        try {
            await budgetManager.updateBudget(budget.id, budgetData);
            showToast('Presupuesto actualizado correctamente', 'success');
            showBudgetsPage(); // Volver a la lista de presupuestos
        } catch (error) {
            console.error('Error actualizando presupuesto:', error);
            showToast('Error al actualizar el presupuesto', 'danger');
        }
    });
}

// Función para eliminar presupuesto
async function deleteBudget(budgetId) {
    if (!confirm('¿Estás seguro de que quieres eliminar este presupuesto?\n\nEsta acción no se puede deshacer.')) {
        return;
    }
    
    try {
        await budgetManager.deleteBudget(budgetId);
        showToast('Presupuesto eliminado correctamente', 'success');
        // Recargar la lista de presupuestos
        showBudgetsPage();
    } catch (error) {
        console.error('Error al eliminar presupuesto:', error);
        showToast('Error al eliminar el presupuesto', 'danger');
    }
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
        <div class="container mt-4">
            <!-- Nueva fila para el perfil y la rueda -->
            <div class="row">
                <!-- Columna del perfil -->
                <div class="col-md-4">
                    <div class="card shadow">
                        <div class="card-body text-center">
                            <div class="d-flex justify-content-between align-items-center mb-4">
                                <h2 class="mb-0">
                                    <i class="fas fa-user-circle text-primary me-2"></i>
                                    Mi Perfil
                                </h2>
                                <button class="btn btn-secondary" onclick="loadDashboard(auth.currentUser)">
                                    <i class="fas fa-arrow-left me-1"></i> Volver
                                </button>
                            </div>
                            
                            <i class="fas fa-user-circle fa-5x mb-3 text-primary"></i>
                            <h2>${user.displayName || user.email}</h2>
                            <p class="text-muted">
                                Miembro desde: ${new Date(user.metadata.creationTime).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
                            </p>
                            <hr>
                            
                            <!-- Información de la cuenta -->
                            <div class="mt-3">
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
                                </ul>
                            </div>
                            
                            <hr>
                            
                            <!-- Estadísticas -->
                            <div class="row text-center">
                                <div class="col-6">
                                    <h5>Total Ahorrado</h5>
                                    <p class="text-success h4">$<span id="totalSavings">0.00</span></p>
                                </div>
                                <div class="col-6">
                                    <h5>Transacciones</h5>
                                    <p class="text-primary h4"><span id="totalTransactions">0</span></p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Columna de la rueda de la vida -->
                <div class="col-md-8">
                    <div class="card shadow">
                        <div class="card-body">
                            <h3 class="card-title text-center mb-4">
                                <i class="fas fa-chart-pie text-primary me-2"></i>
                                Mi Rueda de la Vida
                            </h3>
                            
                            <div class="text-center mb-4">
                                <canvas id="lifeWheel" width="400" height="400"></canvas>
                            </div>
                            
                            <div class="mt-4">
                                <h4 class="text-center mb-4">Ajusta tus valores:</h4>
                                <div class="row" id="sliderContainer">
                                    <!-- Los sliders se generarán dinámicamente -->
                                </div>
                                
                                <!-- Botones de guardar/cargar -->
                                <div class="text-center mt-4">
                                    <button class="btn btn-primary me-2" onclick="saveWheelProgress()">
                                        <i class="fas fa-save me-1"></i> Guardar Progreso
                                    </button>
                                    <button class="btn btn-secondary" onclick="loadWheelProgress()">
                                        <i class="fas fa-undo me-1"></i> Cargar Último Guardado
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Inicializar la rueda de la vida
    initializeLifeWheel();
    
    // Cargar estadísticas del perfil
    loadProfileStats();
}

// Función para inicializar la rueda de la vida
function initializeLifeWheel() {
    const areas = [
        'Salud',
        'Hogar',
        'Familia',
        'Trabajo',
        'Amor',
        'Espiritualidad',
        'Desarrollo Personal',
        'Amigos',
        'Ocio'
    ];

    // Generar sliders
    const sliderContainer = document.getElementById('sliderContainer');
    sliderContainer.innerHTML = '';
    
    areas.forEach((area, index) => {
        const col = document.createElement('div');
        col.className = 'col-md-4 mb-3';
        col.innerHTML = `
            <label for="slider${index}" class="form-label slider-label">${area}</label>
            <input type="range" class="form-range" id="slider${index}" 
                   min="0" max="10" value="5" 
                   oninput="updateWheelChart(${index}, this.value)">
            <div class="value-display">
                <span id="value${index}">5</span>/10
            </div>
        `;
        sliderContainer.appendChild(col);
    });

    // Configurar el gráfico
    const ctx = document.getElementById('lifeWheel').getContext('2d');
    window.lifeWheelChart = new Chart(ctx, {
        type: 'radar',
        data: {
            labels: areas,
            datasets: [{
                label: 'Mi Rueda de la Vida',
                data: Array(areas.length).fill(5),
                backgroundColor: 'rgba(52, 152, 219, 0.2)',
                borderColor: 'rgba(52, 152, 219, 1)',
                borderWidth: 2,
                pointBackgroundColor: 'rgba(52, 152, 219, 1)',
                pointBorderColor: '#fff',
                pointHoverBackgroundColor: '#fff',
                pointHoverBorderColor: 'rgba(52, 152, 219, 1)'
            }]
        },
        options: {
            responsive: true,
            scales: {
                r: {
                    min: 0,
                    max: 10,
                    beginAtZero: true,
                    ticks: {
                        stepSize: 2,
                        font: {
                            size: 12
                        },
                        backdropColor: 'transparent'
                    },
                    pointLabels: {
                        font: {
                            size: 14,
                            weight: 'bold'
                        },
                        color: '#2c3e50'
                    },
                    angleLines: {
                        color: 'rgba(0, 0, 0, 0.1)'
                    },
                    grid: {
                        color: 'rgba(0, 0, 0, 0.1)'
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `${context.label}: ${context.raw}/10`;
                        }
                    }
                }
            },
            elements: {
                line: {
                    tension: 0.1
                }
            }
        }
    });

    // Cargar progreso automáticamente al iniciar
    loadWheelProgress();
}

// Función para actualizar el gráfico
function updateWheelChart(index, value) {
    document.getElementById(`value${index}`).textContent = value;
    window.lifeWheelChart.data.datasets[0].data[index] = parseInt(value);
    window.lifeWheelChart.update();
}

// Función para guardar progreso
function saveWheelProgress() {
    if (window.lifeWheelChart) {
        const values = window.lifeWheelChart.data.datasets[0].data;
        const user = auth.currentUser;
        if (user) {
            // Guardar en Firestore para el usuario actual
            localStorage.setItem(`wheelValues_${user.uid}`, JSON.stringify(values));
            showToast('Progreso guardado correctamente', 'success');
        }
    }
}

// Función para cargar progreso
function loadWheelProgress() {
    const user = auth.currentUser;
    if (user && window.lifeWheelChart) {
        const savedValues = localStorage.getItem(`wheelValues_${user.uid}`);
        if (savedValues) {
            const values = JSON.parse(savedValues);
            window.lifeWheelChart.data.datasets[0].data = values;
            
            // Actualizar los sliders
            values.forEach((value, index) => {
                const slider = document.getElementById(`slider${index}`);
                if (slider) {
                    slider.value = value;
                    document.getElementById(`value${index}`).textContent = value;
                }
            });
            
            window.lifeWheelChart.update();
            showToast('Progreso cargado correctamente', 'success');
        } else {
            showToast('No hay progreso guardado', 'info');
        }
    }
}

// Función para cargar estadísticas del perfil - ACTUALIZADA
async function loadProfileStats() {
    try {
        const user = auth.currentUser;
        if (!user) return;

        // Obtener todas las transacciones (no solo del mes actual)
        const transactions = await transactionManager.getTransactions({});
        
        // Obtener todos los presupuestos
        const allBudgets = await budgetManager.getAllUserBudgets();
        
        // Calcular total ahorrado (ingresos - gastos)
        const totalIncome = transactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + t.amount, 0);
            
        const totalExpense = transactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + t.amount, 0);
            
        const totalSavings = totalIncome - totalExpense;

        // Actualizar contadores
        const totalSavingsElement = document.getElementById('totalSavings');
        const totalTransactionsElement = document.getElementById('totalTransactions');
        
        if (totalSavingsElement) {
            totalSavingsElement.textContent = totalSavings.toFixed(2);
        }
        
        if (totalTransactionsElement) {
            totalTransactionsElement.textContent = transactions.length;
        }
        
    } catch (error) {
        console.error('Error loading profile stats:', error);
    }
}

// Agregar estilos CSS para la rueda de la vida
function addLifeWheelStyles() {
    if (!document.getElementById('lifeWheelStyles')) {
        const styles = document.createElement('style');
        styles.id = 'lifeWheelStyles';
        styles.textContent = `
            .slider-label {
                font-weight: 600;
                color: var(--dark-color);
                margin-bottom: 5px;
                font-size: 0.9rem;
            }
            
            .value-display {
                font-weight: bold;
                color: var(--primary-color);
                font-size: 0.9rem;
                text-align: center;
                margin-top: 5px;
            }
            
            .form-range {
                height: 8px;
            }
            
            .form-range::-webkit-slider-thumb {
                background: var(--primary-color);
                width: 20px;
                height: 20px;
            }
            
            .form-range::-moz-range-thumb {
                background: var(--primary-color);
                width: 20px;
                height: 20px;
                border: none;
            }
            
            #lifeWheel {
                max-width: 100%;
                height: auto;
            }
            
            @media (max-width: 768px) {
                #lifeWheel {
                    max-width: 300px;
                }
                
                .slider-container .col-md-4 {
                    margin-bottom: 15px;
                }
            }
        `;
        document.head.appendChild(styles);
    }
}

// Llamar a la función de estilos cuando se carga la aplicación
document.addEventListener('DOMContentLoaded', function() {
    addLifeWheelStyles();
});






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

// FUNCIONES DE AUTENTICACIÓN (PENDIENTES)
async function loginWithEmail(email, password) {
    showLoading(true);
    try {
        const userCredential = await auth.signInWithEmailAndPassword(email, password);
        console.log('✅ Usuario logueado:', userCredential.user.email);
        showToast('¡Bienvenido!', 'success');
    } catch (error) {
        console.error('❌ Error en login:', error);
        let errorMessage = 'Error al iniciar sesión';
        
        switch (error.code) {
            case 'auth/user-not-found':
                errorMessage = 'Usuario no encontrado';
                break;
            case 'auth/wrong-password':
                errorMessage = 'Contraseña incorrecta';
                break;
            case 'auth/invalid-email':
                errorMessage = 'Email inválido';
                break;
            default:
                errorMessage = error.message;
        }
        
        showToast(errorMessage, 'danger');
    } finally {
        showLoading(false);
    }
}

async function registerWithEmail(email, password, username) {
    showLoading(true);
    try {
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        const user = userCredential.user;
        
        // Actualizar perfil con el nombre de usuario
        await user.updateProfile({
            displayName: username
        });
        
        console.log('✅ Usuario registrado:', user.email);
        showToast('¡Cuenta creada exitosamente!', 'success');
        
        // El authStateChanged se encargará de redirigir al dashboard
    } catch (error) {
        console.error('❌ Error en registro:', error);
        let errorMessage = 'Error al crear la cuenta';
        
        switch (error.code) {
            case 'auth/email-already-in-use':
                errorMessage = 'El email ya está en uso';
                break;
            case 'auth/weak-password':
                errorMessage = 'La contraseña es muy débil';
                break;
            case 'auth/invalid-email':
                errorMessage = 'Email inválido';
                break;
            default:
                errorMessage = error.message;
        }
        
        showToast(errorMessage, 'danger');
    } finally {
        showLoading(false);
    }
}

async function loginWithGoogle() {
    showLoading(true);
    try {
        const provider = new firebase.auth.GoogleAuthProvider();
        provider.addScope('profile');
        provider.addScope('email');
        
        const result = await auth.signInWithPopup(provider);
        console.log('✅ Login con Google exitoso:', result.user.email);
        showToast('¡Bienvenido!', 'success');
    } catch (error) {
        console.error('❌ Error en login con Google:', error);
        showToast('Error al iniciar sesión con Google', 'danger');
    } finally {
        showLoading(false);
    }
}

async function logout() {
    try {
        await auth.signOut();
        console.log('✅ Usuario cerró sesión');
        showToast('Sesión cerrada', 'info');
    } catch (error) {
        console.error('❌ Error al cerrar sesión:', error);
        showToast('Error al cerrar sesión', 'danger');
    }
}