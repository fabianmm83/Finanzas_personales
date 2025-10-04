class FinanceApp {
    constructor() {
        this.currentView = null;
        this.init();
    }

    async init() {
        // Set up auth state listener
        authManager.onAuthStateChanged((user) => {
            this.renderNavbar(user);
            this.route();
        });

        // Set up routing
        this.setupRouter();
    }

    setupRouter() {
        window.addEventListener('hashchange', () => this.route());
        this.route();
    }

    route() {
        const hash = window.location.hash.substring(1) || 'dashboard';
        const publicRoutes = ['login', 'register'];
        
        const user = authManager.currentUser;
        
        if (!user && !publicRoutes.includes(hash)) {
            this.showView('login');
            return;
        }

        if (user && publicRoutes.includes(hash)) {
            this.showView('dashboard');
            return;
        }

        this.showView(hash);
    }

    async showView(viewName, params = {}) {
        this.currentView = viewName;
        
        showLoading(true);
        
        try {
            switch(viewName) {
                case 'login':
                    await this.renderLogin();
                    break;
                case 'register':
                    await this.renderRegister();
                    break;
                case 'dashboard':
                    await this.renderDashboard(params);
                    break;
                case 'add-transaction':
                    await this.renderAddTransaction();
                    break;
                case 'add-budget':
                    await this.renderAddBudget();
                    break;
                case 'budgets':
                    await this.renderBudgets(params);
                    break;
                case 'profile':
                    await this.renderProfile();
                    break;
                case 'reports':
                    await this.renderReports(params);
                    break;
                default:
                    await this.renderDashboard();
            }
        } catch (error) {
            console.error('Error rendering view:', error);
            showToast('Error al cargar la página', 'danger');
        } finally {
            showLoading(false);
        }
    }

    renderNavbar(user) {
        const navbar = document.getElementById('navbar');
        
        if (user) {
            navbar.innerHTML = `
                <nav class="navbar navbar-expand-lg navbar-dark sticky-top">
                    <div class="container">
                        <a class="navbar-brand" href="#dashboard">
                            <i class="fas fa-chart-line me-2"></i>Finanzas Pro
                        </a>
                        <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
                            <span class="navbar-toggler-icon"></span>
                        </button>
                        <div class="collapse navbar-collapse" id="navbarNav">
                            <ul class="navbar-nav ms-auto">
                                <li class="nav-item">
                                    <a class="nav-link" href="#dashboard">
                                        <i class="fas fa-home me-1"></i> Inicio
                                    </a>
                                </li>
                                <li class="nav-item">
                                    <a class="nav-link" href="#profile">
                                        <i class="fas fa-user-circle me-1"></i> Mi Perfil
                                    </a>
                                </li>
                                <li class="nav-item">
                                    <a class="nav-link" href="#add-transaction">
                                        <i class="fas fa-plus-circle me-1"></i> Nueva Transacción
                                    </a>
                                </li>
                                <li class="nav-item">
                                    <a class="nav-link" href="#add-budget">
                                        <i class="fas fa-chart-pie me-1"></i> Agregar Presupuesto
                                    </a>
                                </li>
                                <li class="nav-item">
                                    <a class="nav-link" href="#budgets">
                                        <i class="fas fa-list me-1"></i> Ver Presupuestos
                                    </a>
                                </li>
                                <li class="nav-item">
                                    <a class="nav-link" href="#reports">
                                        <i class="fas fa-chart-bar me-1"></i> Reportes
                                    </a>
                                </li>
                                <li class="nav-item">
                                    <a class="nav-link" href="#" onclick="authManager.logout()">
                                        <i class="fas fa-sign-out-alt me-1"></i> Cerrar Sesión
                                    </a>
                                </li>
                            </ul>
                        </div>
                    </div>
                </nav>
            `;
        } else {
            navbar.innerHTML = `
                <nav class="navbar navbar-expand-lg navbar-dark sticky-top">
                    <div class="container">
                        <a class="navbar-brand" href="#login">
                            <i class="fas fa-chart-line me-2"></i>Finanzas Pro
                        </a>
                        <ul class="navbar-nav ms-auto">
                            <li class="nav-item">
                                <a class="nav-link" href="#login">
                                    <i class="fas fa-sign-in-alt me-1"></i> Iniciar Sesión
                                </a>
                            </li>
                            <li class="nav-item">
                                <a class="nav-link" href="#register">
                                    <i class="fas fa-user-plus me-1"></i> Registrarse
                                </a>
                            </li>
                        </ul>
                    </div>
                </nav>
            `;
        }
    }

    async renderLogin() {
        const content = document.getElementById('content');
        content.innerHTML = `
            <div class="row justify-content-center">
                <div class="col-md-6 col-lg-4">
                    <div class="card shadow">
                        <div class="card-body p-4">
                            <h2 class="text-center mb-4">
                                <i class="fas fa-sign-in-alt text-primary me-2"></i>
                                Iniciar Sesión
                            </h2>
                            <form id="login-form">
                                <div class="mb-3">
                                    <label for="login-email" class="form-label">Email</label>
                                    <input type="email" class="form-control" id="login-email" required>
                                </div>
                                <div class="mb-3">
                                    <label for="login-password" class="form-label">Contraseña</label>
                                    <input type="password" class="form-control" id="login-password" required>
                                </div>
                                <button type="submit" class="btn btn-primary w-100 py-2">
                                    <i class="fas fa-sign-in-alt me-2"></i>Iniciar Sesión
                                </button>
                            </form>
                            <div class="text-center mt-3">
                                <a href="#register" class="text-decoration-none">¿No tienes cuenta? Regístrate</a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.getElementById('login-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;
            
            const result = await authManager.login(email, password);
            if (result.success) {
                window.location.hash = 'dashboard';
            }
        });
    }

    async renderRegister() {
        const content = document.getElementById('content');
        content.innerHTML = `
            <div class="row justify-content-center">
                <div class="col-md-6 col-lg-4">
                    <div class="card shadow">
                        <div class="card-body p-4">
                            <h2 class="text-center mb-4">
                                <i class="fas fa-user-plus text-primary me-2"></i>
                                Crear Cuenta
                            </h2>
                            <form id="register-form">
                                <div class="mb-3">
                                    <label for="register-username" class="form-label">Nombre de Usuario</label>
                                    <input type="text" class="form-control" id="register-username" required>
                                </div>
                                <div class="mb-3">
                                    <label for="register-email" class="form-label">Email</label>
                                    <input type="email" class="form-control" id="register-email" required>
                                </div>
                                <div class="mb-3">
                                    <label for="register-password" class="form-label">Contraseña</label>
                                    <input type="password" class="form-control" id="register-password" required>
                                </div>
                                <button type="submit" class="btn btn-primary w-100 py-2">
                                    <i class="fas fa-user-plus me-2"></i>Registrarse
                                </button>
                            </form>
                            <div class="text-center mt-3">
                                <a href="#login" class="text-decoration-none">¿Ya tienes cuenta? Inicia Sesión</a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.getElementById('register-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = document.getElementById('register-username').value;
            const email = document.getElementById('register-email').value;
            const password = document.getElementById('register-password').value;
            
            const result = await authManager.register(email, password, username);
            if (result.success) {
                window.location.hash = 'dashboard';
            }
        });
    }

    async renderDashboard(params = {}) {
        const month = params.month || new Date().getMonth() + 1;
        const year = params.year || new Date().getFullYear();
        
        const data = await transactionManager.getDashboardData(month, year);
        
        const content = document.getElementById('content');
        content.innerHTML = `
            <div class="dashboard-container">
                <h1 class="text-center mb-4">
                    <i class="fas fa-tachometer-alt me-2"></i>
                    Dashboard Financiero
                </h1>
                
                <!-- Resumen Rápido -->
                <div class="row mb-4">
                    <div class="col-md-3">
                        <div class="card bg-success text-white">
                            <div class="card-body text-center">
                                <h5 class="card-title">Total Ingresos</h5>
                                <p class="card-text h4">$${data.summary.totalIncome.toFixed(2)}</p>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="card bg-danger text-white">
                            <div class="card-body text-center">
                                <h5 class="card-title">Total Gastos</h5>
                                <p class="card-text h4">$${data.summary.totalExpense.toFixed(2)}</p>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="card ${data.summary.balance >= 0 ? 'bg-primary' : 'bg-warning'} text-white">
                            <div class="card-body text-center">
                                <h5 class="card-title">Balance</h5>
                                <p class="card-text h4">$${data.summary.balance.toFixed(2)}</p>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="card bg-info text-white">
                            <div class="card-body text-center">
                                <h5 class="card-title">Transacciones</h5>
                                <p class="card-text h4">${data.summary.transactionCount}</p>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Gráficos -->
                <div class="row">
                    <div class="col-md-6">
                        <div class="card">
                            <div class="card-body">
                                <h5 class="card-title">Distribución de Ingresos</h5>
                                <canvas id="incomeChart" height="250"></canvas>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="card">
                            <div class="card-body">
                                <h5 class="card-title">Distribución de Gastos</h5>
                                <canvas id="expenseChart" height="250"></canvas>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Últimas Transacciones -->
                <div class="row mt-4">
                    <div class="col-12">
                        <div class="card">
                            <div class="card-body">
                                <h5 class="card-title">Últimas Transacciones</h5>
                                <div id="recent-transactions">
                                    ${this.renderRecentTransactions(data.transactions.slice(0, 5))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Render charts
        this.renderCharts(data.categories);
    }

    renderRecentTransactions(transactions) {
        if (transactions.length === 0) {
            return '<p class="text-muted text-center">No hay transacciones recientes</p>';
        }

        return transactions.map(transaction => `
            <div class="d-flex justify-content-between align-items-center border-bottom py-2">
                <div>
                    <strong class="${transaction.type === 'i' ? 'text-success' : 'text-danger'}">
                        ${transaction.category}
                    </strong>
                    <br>
                    <small class="text-muted">${transaction.date.toDate().toLocaleDateString()}</small>
                </div>
                <div class="text-end">
                    <span class="${transaction.type === 'i' ? 'text-success' : 'text-danger'} fw-bold">
                        $${transaction.amount.toFixed(2)}
                    </span>
                    <br>
                    <small class="text-muted">${transaction.type === 'i' ? 'Ingreso' : 'Gasto'}</small>
                </div>
            </div>
        `).join('');
    }

    renderCharts(categories) {
        // Render income chart
        const incomeCtx = document.getElementById('incomeChart').getContext('2d');
        new Chart(incomeCtx, {
            type: 'doughnut',
            data: {
                labels: Object.keys(categories.income),
                datasets: [{
                    data: Object.values(categories.income),
                    backgroundColor: ['#28a745', '#20c997', '#17a2b8', '#6f42c1', '#e83e8c']
                }]
            }
        });

        // Render expense chart
        const expenseCtx = document.getElementById('expenseChart').getContext('2d');
        new Chart(expenseCtx, {
            type: 'doughnut',
            data: {
                labels: Object.keys(categories.expense),
                datasets: [{
                    data: Object.values(categories.expense),
                    backgroundColor: ['#dc3545', '#fd7e14', '#ffc107', '#6610f2', '#6f42c1']
                }]
            }
        });
    }

    async renderAddTransaction() {
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
                                            <option value="i">Ingreso</option>
                                            <option value="g">Gasto</option>
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
                amount: document.getElementById('transaction-amount').value,
                category: document.getElementById('transaction-category').value,
                date: document.getElementById('transaction-date').value,
                description: document.getElementById('transaction-description').value
            };

            const result = await transactionManager.addTransaction(transactionData);
            if (result.success) {
                window.location.hash = 'dashboard';
            }
        });
    }

    async renderAddBudget() {
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
                limit: document.getElementById('budget-limit').value,
                month: document.getElementById('budget-month').value,
                year: document.getElementById('budget-year').value
            };

            const result = await budgetManager.createBudget(budgetData);
            if (result.success) {
                window.location.hash = 'budgets';
            }
        });
    }

    async renderBudgets(params = {}) {
        const month = params.month || new Date().getMonth() + 1;
        const year = params.year || new Date().getFullYear();
        
        const budgets = await budgetManager.getBudgetStatus(month, year);
        
        const content = document.getElementById('content');
        content.innerHTML = `
            <div class="budgets-container">
                <h1 class="text-center mb-4">
                    <i class="fas fa-chart-pie me-2"></i>
                    Mis Presupuestos - ${new Date(year, month - 1).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
                </h1>
                
                ${budgets.length === 0 ? `
                    <div class="alert alert-info text-center">
                        <i class="fas fa-info-circle me-2"></i>
                        No hay presupuestos para este período.
                        <a href="#add-budget" class="alert-link">Crear primer presupuesto</a>
                    </div>
                ` : `
                    <div class="table-responsive">
                        <table class="table table-striped table-hover">
                            <thead class="table-dark">
                                <tr>
                                    <th>Categoría</th>
                                    <th>Límite</th>
                                    <th>Gastado</th>
                                    <th>Restante</th>
                                    <th>Progreso</th>
                                    <th>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${budgets.map(budget => `
                                    <tr>
                                        <td>${budget.category}</td>
                                        <td>$${budget.limit.toFixed(2)}</td>
                                        <td>$${budget.spent.toFixed(2)}</td>
                                        <td class="${budget.remaining < 0 ? 'text-danger' : 'text-success'}">
                                            $${budget.remaining.toFixed(2)}
                                        </td>
                                        <td>
                                            <div class="progress" style="height: 20px;">
                                                <div class="progress-bar ${budget.percentageUsed > 100 ? 'bg-danger' : 'bg-success'}" 
                                                     style="width: ${Math.min(budget.percentageUsed, 100)}%">
                                                    ${budget.percentageUsed.toFixed(1)}%
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <button class="btn btn-sm btn-outline-danger" onclick="app.deleteBudget('${budget.id}')">
                                                <i class="fas fa-trash"></i>
                                            </button>
                                        </td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                `}
                
                <div class="text-center mt-4">
                    <a href="#add-budget" class="btn btn-primary">
                        <i class="fas fa-plus me-2"></i>Agregar Presupuesto
                    </a>
                </div>
            </div>
        `;
    }

    async deleteBudget(budgetId) {
        if (confirm('¿Estás seguro de que quieres eliminar este presupuesto?')) {
            await budgetManager.deleteBudget(budgetId);
            this.renderBudgets();
        }
    }

    async renderProfile() {
        const user = authManager.currentUser;
        const transactions = await transactionManager.getTransactions();
        
        const totalSavings = transactions
            .filter(t => t.type === 'i')
            .reduce((sum, t) => sum + t.amount, 0);
            
        const totalTransactions = transactions.length;

        const content = document.getElementById('content');
        content.innerHTML = `
            <div class="container mt-4">
                <div class="row">
                    <!-- Columna del perfil -->
                    <div class="col-md-4">
                        <div class="card">
                            <div class="card-body text-center">
                                <i class="fas fa-user-circle fa-5x mb-3 text-primary"></i>
                                <h2>${user.username}</h2>
                                <p class="text-muted">${user.email}</p>
                                <hr>
                                <div class="row text-center">
                                    <div class="col-6">
                                        <h5>Total Ahorrado</h5>
                                        <p class="text-success">$${totalSavings.toFixed(2)}</p>
                                    </div>
                                    <div class="col-6">
                                        <h5>Transacciones</h5>
                                        <p class="text-primary">${totalTransactions}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Columna de la rueda de la vida -->
                    <div class="col-md-8">
                        <div class="card">
                            <div class="card-body">
                                <h3 class="card-title">Mi Rueda de la Vida</h3>
                                <canvas id="lifeWheel" width="400" height="400"></canvas>
                                
                                <div class="mt-4">
                                    <h4>Ajusta tus valores:</h4>
                                    <div class="row" id="sliderContainer">
                                        <!-- Los sliders se generarán dinámicamente -->
                                    </div>
                                    <div class="text-center mt-4">
                                        <button class="btn btn-primary me-2" onclick="saveProgress()">
                                            <i class="fas fa-save"></i> Guardar Progreso
                                        </button>
                                        <button class="btn btn-secondary" onclick="loadProgress()">
                                            <i class="fas fa-undo"></i> Cargar Último Guardado
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Initialize life wheel (same as your original code)
        this.initializeLifeWheel();
    }

    initializeLifeWheel() {
        // Tu código original de la rueda de la vida aquí
        const areas = [
            'Salud', 'Hogar', 'Familia', 'Trabajo', 'Amor', 
            'Espiritualidad', 'Desarrollo Personal', 'Amigos', 'Ocio'
        ];

        // Generar sliders
        const sliderContainer = document.getElementById('sliderContainer');
        areas.forEach((area, index) => {
            const col = document.createElement('div');
            col.className = 'col-md-4 mb-3';
            col.innerHTML = `
                <label for="slider${index}">${area}</label>
                <input type="range" class="form-range" id="slider${index}" 
                       min="0" max="10" value="5" 
                       oninput="updateChart(this.id, this.value)">
                <span id="value${index}">5</span>/10
            `;
            sliderContainer.appendChild(col);
        });

        // Configurar el gráfico (tu código original)
        const ctx = document.getElementById('lifeWheel').getContext('2d');
        const chart = new Chart(ctx, {
            type: 'radar',
            data: {
                labels: areas,
                datasets: [{
                    label: 'Mi Rueda de la Vida',
                    data: Array(areas.length).fill(5),
                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                    borderColor: 'rgba(75, 192, 192, 1)',
                    borderWidth: 2
                }]
            },
            options: {
                scales: {
                    r: {
                        min: 0,
                        max: 10,
                        beginAtZero: true,
                        ticks: { stepSize: 2 }
                    }
                },
                plugins: { legend: { display: false } }
            }
        });

        // Funciones globales para la rueda
        window.updateChart = function(sliderId, value) {
            const index = parseInt(sliderId.replace('slider', ''));
            document.getElementById(`value${index}`).textContent = value;
            chart.data.datasets[0].data[index] = parseInt(value);
            chart.update();
        };

        window.saveProgress = function() {
            const values = chart.data.datasets[0].data;
            localStorage.setItem('wheelValues', JSON.stringify(values));
            showToast('Progreso guardado correctamente', 'success');
        };

        window.loadProgress = function() {
            const savedValues = localStorage.getItem('wheelValues');
            if (savedValues) {
                const values = JSON.parse(savedValues);
                chart.data.datasets[0].data = values;
                values.forEach((value, index) => {
                    const slider = document.getElementById(`slider${index}`);
                    if (slider) {
                        slider.value = value;
                        document.getElementById(`value${index}`).textContent = value;
                    }
                });
                chart.update();
                showToast('Progreso cargado correctamente', 'success');
            }
        };

        // Cargar progreso automáticamente al iniciar
        window.loadProgress();
    }

    async renderReports(params = {}) {
        const content = document.getElementById('content');
        content.innerHTML = `
            <div class="reports-container">
                <h1 class="text-center mb-4">
                    <i class="fas fa-chart-bar me-2"></i>
                    Reportes Financieros
                </h1>
                
                <div class="row">
                    <div class="col-md-6">
                        <div class="card">
                            <div class="card-body text-center">
                                <h5 class="card-title">Reporte Semanal</h5>
                                <p class="card-text">Resumen de ingresos y gastos de los últimos 7 días</p>
                                <button class="btn btn-primary" onclick="app.generateWeeklyReport()">
                                    <i class="fas fa-download me-2"></i>Generar Reporte
                                </button>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="card">
                            <div class="card-body text-center">
                                <h5 class="card-title">Reporte Mensual</h5>
                                <p class="card-text">Análisis detallado del mes actual</p>
                                <button class="btn btn-primary" onclick="app.generateMonthlyReport()">
                                    <i class="fas fa-download me-2"></i>Generar Reporte
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div id="report-results" class="mt-4"></div>
            </div>
        `;
    }

    async generateWeeklyReport() {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(endDate.getDate() - 7);
        
        const transactions = await transactionManager.getTransactions({
            startDate: startDate.toISOString().split('T')[0],
            endDate: endDate.toISOString().split('T')[0]
        });
        
        const income = transactions.filter(t => t.type === 'i').reduce((sum, t) => sum + t.amount, 0);
        const expenses = transactions.filter(t => t.type === 'g').reduce((sum, t) => sum + t.amount, 0);
        
        const categories = {};
        transactions.filter(t => t.type === 'g').forEach(t => {
            categories[t.category] = (categories[t.category] || 0) + t.amount;
        });
        
        const results = document.getElementById('report-results');
        results.innerHTML = `
            <div class="card">
                <div class="card-body">
                    <h5 class="card-title">Reporte Semanal</h5>
                    <div class="row">
                        <div class="col-md-3">
                            <strong>Ingresos:</strong> $${income.toFixed(2)}
                        </div>
                        <div class="col-md-3">
                            <strong>Gastos:</strong> $${expenses.toFixed(2)}
                        </div>
                        <div class="col-md-3">
                            <strong>Balance:</strong> $${(income - expenses).toFixed(2)}
                        </div>
                        <div class="col-md-3">
                            <strong>Transacciones:</strong> ${transactions.length}
                        </div>
                    </div>
                    ${Object.keys(categories).length > 0 ? `
                        <h6 class="mt-3">Gastos por Categoría:</h6>
                        <ul>
                            ${Object.entries(categories).map(([category, amount]) => `
                                <li>${category}: $${amount.toFixed(2)}</li>
                            `).join('')}
                        </ul>
                    ` : ''}
                </div>
            </div>
        `;
    }

    async generateMonthlyReport() {
        const now = new Date();
        const month = now.getMonth() + 1;
        const year = now.getFullYear();
        
        const data = await transactionManager.getDashboardData(month, year);
        
        const results = document.getElementById('report-results');
        results.innerHTML = `
            <div class="card">
                <div class="card-body">
                    <h5 class="card-title">Reporte Mensual - ${new Date(year, month - 1).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}</h5>
                    <div class="row">
                        <div class="col-md-3">
                            <strong>Ingresos:</strong> $${data.summary.totalIncome.toFixed(2)}
                        </div>
                        <div class="col-md-3">
                            <strong>Gastos:</strong> $${data.summary.totalExpense.toFixed(2)}
                        </div>
                        <div class="col-md-3">
                            <strong>Balance:</strong> $${data.summary.balance.toFixed(2)}
                        </div>
                        <div class="col-md-3">
                            <strong>Transacciones:</strong> ${data.summary.transactionCount}
                        </div>
                    </div>
                    <div class="row mt-3">
                        <div class="col-md-6">
                            <h6>Ingresos por Categoría:</h6>
                            <ul>
                                ${Object.entries(data.categories.income).map(([category, amount]) => `
                                    <li>${category}: $${amount.toFixed(2)}</li>
                                `).join('')}
                            </ul>
                        </div>
                        <div class="col-md-6">
                            <h6>Gastos por Categoría:</h6>
                            <ul>
                                ${Object.entries(data.categories.expense).map(([category, amount]) => `
                                    <li>${category}: $${amount.toFixed(2)}</li>
                                `).join('')}
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new FinanceApp();
});