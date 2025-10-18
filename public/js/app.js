// app.js - Aplicación principal
let chartInstances = {
    timeline: null,
    income: null,
    expense: null
};

let currentTimeframe = 'week'; // 'week' o 'month'
let currentChartType = 'doughnut';

// ==================== NOTIFICATION MANAGER - VERSIÓN DEFINITIVA ====================
class NotificationManager {
    constructor() {
        this.notificationPermission = null;
        this.dailyReminderTimeout = null;
        this.upcomingTransactionsCheck = null;
        this.isInitialized = false;
        this.init();
    }

    async init() {
        if (this.isInitialized) return;
        
        try {
            await this.requestPermission();
            this.scheduleDailyReminder();
            this.scheduleUpcomingTransactionsCheck();
            this.isInitialized = true;
            console.log("✅ NotificationManager inicializado correctamente");
        } catch (error) {
            console.error("❌ Error inicializando NotificationManager:", error);
        }
    }

    // Solicitar permiso para notificaciones
    async requestPermission() {
        if (!('Notification' in window)) {
            console.log('Este navegador no soporta notificaciones');
            return false;
        }

        try {
            this.notificationPermission = await Notification.requestPermission();
            console.log('Estado de permisos de notificación:', this.notificationPermission);
            return this.notificationPermission === 'granted';
        } catch (error) {
            console.error('Error solicitando permisos:', error);
            return false;
        }
    }

    // CORREGIDO: Mostrar notificación - versión definitiva
    showNotification(title, options = {}) {
        if (this.notificationPermission !== 'granted') {
            console.log('Permisos de notificación no concedidos');
            return;
        }

        const defaultOptions = {
            icon: '/static/logo_pwa.png',
            badge: '/static/logo_pwa.png',
            tag: 'finances-reminder',
            requireInteraction: false,
            silent: false
        };

        const notificationOptions = { ...defaultOptions, ...options };

        // DETECCIÓN INTELIGENTE: ¿Podemos usar Service Worker con acciones?
        const canUseServiceWorker = (
            'serviceWorker' in navigator && 
            navigator.serviceWorker.controller
        );
        
        console.log('🔍 Estado Service Worker:', {
            disponible: 'serviceWorker' in navigator,
            controller: !!navigator.serviceWorker?.controller,
            puedeUsarAcciones: canUseServiceWorker
        });

        // Si podemos usar Service Worker, usarlo (permite acciones)
        if (canUseServiceWorker) {
            console.log('✅ Usando Service Worker para notificación con acciones');
            navigator.serviceWorker.ready.then(registration => {
                registration.showNotification(title, notificationOptions);
            });
        } else {
            // Si NO podemos usar Service Worker, usar Notification API básica
            console.log('ℹ️ Usando Notification API básica (sin acciones)');
            
            // Crear copia de opciones sin acciones
            const basicOptions = { ...notificationOptions };
            delete basicOptions.actions; // Remover acciones que no son compatibles
            
            new Notification(title, basicOptions);
        }
    }

    // Notificación diaria "No olvides agregar tus finanzas"
    scheduleDailyReminder() {
        // Limpiar timeout anterior si existe
        if (this.dailyReminderTimeout) {
            clearTimeout(this.dailyReminderTimeout);
        }

        // CONFIGURACIÓN MEJORADA - Modo prueba/producción
        const isTestMode = window.location.hostname === 'localhost' || 
                          window.location.hostname === '127.0.0.1' ||
                          window.location.search.includes('test=true');
        
        if (isTestMode) {
            console.log("🧪 MODO PRUEBA: Recordatorio en 2 minutos");
            this.dailyReminderTimeout = setTimeout(() => {
                this.showDailyReminder();
                // Programar siguiente para 5 minutos después (para pruebas continuas)
                setTimeout(() => this.scheduleDailyReminder(), 300000); // 5 minutos
            }, 120000); // 2 minutos para pruebas
            
        } else {
            // CÓDIGO PRODUCCIÓN
            // Programar para mañana a las 18:00 (6 PM)
            const now = new Date();
            const targetTime = new Date();
            targetTime.setHours(18, 0, 0, 0); // 6 PM

            // Si ya pasó las 6 PM hoy, programar para mañana
            if (now > targetTime) {
                targetTime.setDate(targetTime.getDate() + 1);
            }

            const timeUntilReminder = targetTime.getTime() - now.getTime();

            this.dailyReminderTimeout = setTimeout(() => {
                this.showDailyReminder();
                // Programar la próxima para mañana
                this.scheduleDailyReminder();
            }, timeUntilReminder);

            console.log(`Recordatorio diario programado para: ${targetTime}`);
        }
    }

    // CORREGIDO: Notificación diaria
    showDailyReminder() {
        const canUseActions = 'serviceWorker' in navigator && navigator.serviceWorker.controller;
        
        const reminderOptions = {
            body: 'No olvides registrar tus transacciones del día',
            icon: '/static/logo_pwa.png',
            badge: '/static/logo_pwa.png'
        };
        
        // Solo agregar acciones si están disponibles
        if (canUseActions) {
            reminderOptions.actions = [
                {
                    action: 'add-transaction',
                    title: 'Agregar Transacción'
                },
                {
                    action: 'view-dashboard',
                    title: 'Ver Dashboard'
                }
            ];
            console.log('✅ Recordatorio con acciones');
        } else {
            console.log('ℹ️ Recordatorio sin acciones');
        }
        
        this.showNotification('💡 Recordatorio de Finanzas', reminderOptions);

        // También mostrar toast en la app
        if (typeof showToast === 'function') {
            showToast('💡 No olvides registrar tus transacciones del día', 'info');
        }
    }

    // Verificar transacciones próximas a vencer - VERSIÓN MEJORADA
    async scheduleUpcomingTransactionsCheck() {
        // CONFIGURACIÓN MEJORADA - Modo prueba/producción
        const isTestMode = window.location.hostname === 'localhost' || 
                          window.location.hostname === '127.0.0.1' ||
                          window.location.search.includes('test=true');
        
        // LIMPIAR INTERVALO ANTERIOR SI EXISTE
        if (this.upcomingTransactionsCheck) {
            clearInterval(this.upcomingTransactionsCheck);
        }
        
        if (isTestMode) {
            console.log("🧪 MODO PRUEBA: Verificación cada 2 minutos");
            this.upcomingTransactionsCheck = setInterval(async () => {
                // VERIFICAR SI HAY USUARIO ANTES DE EJECUTAR
                if (window.auth && window.auth.currentUser) {
                    await this.checkUpcomingTransactions();
                }
            }, 120000); // 2 minutos para pruebas
        } else {
            // CÓDIGO PRODUCCIÓN
            console.log("🚀 MODO PRODUCCIÓN: Verificación cada hora");
            this.upcomingTransactionsCheck = setInterval(async () => {
                // VERIFICAR SI HAY USUARIO ANTES DE EJECUTAR
                if (window.auth && window.auth.currentUser) {
                    await this.checkUpcomingTransactions();
                }
            }, 60 * 60 * 1000); // Cada hora
        }

        // Verificar inmediatamente al cargar SOLO SI hay usuario
        if (window.auth && window.auth.currentUser) {
            setTimeout(() => this.checkUpcomingTransactions(), 5000);
        }
    }
    
    // CORREGIDO: Verificación segura de Firebase con reintentos inteligentes
    async checkUpcomingTransactions() {
        // VERIFICACIÓN MÁS ROBUSTA DE DEPENDENCIAS
        if (typeof firebase === 'undefined' || !firebase.app) {
            console.log('⏳ Firebase no está inicializado, esperando...');
            setTimeout(() => this.checkUpcomingTransactions(), 5000);
            return;
        }

        if (!window.auth || !window.auth.currentUser) {
            console.log('⏳ Usuario no autenticado, no se pueden verificar transacciones');
            return; // No reintentar si no hay usuario
        }

        try {
            const today = new Date();
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);

            // VERIFICACIÓN SEGURA DE FIRESTORE
            if (!firebase.firestore) {
                console.error('❌ Firestore no disponible');
                return;
            }

            const db = firebase.firestore();
            const transactionsRef = db.collection('users').doc(window.auth.currentUser.uid).collection('transactions');
            
            const todayStr = today.toISOString().split('T')[0];
            const tomorrowStr = tomorrow.toISOString().split('T')[0];
            
            console.log('🔍 Buscando transacciones entre:', todayStr, 'y', tomorrowStr);

            const snapshot = await transactionsRef
                .where('date', '>=', todayStr)
                .where('date', '<=', tomorrowStr)
                .get();

            const upcomingTransactions = [];
            snapshot.forEach(doc => {
                const transaction = doc.data();
                transaction.id = doc.id;
                if (this.isTransactionUpcoming(transaction)) {
                    upcomingTransactions.push(transaction);
                }
            });

            console.log('📅 Transacciones próximas encontradas:', upcomingTransactions.length);

            if (upcomingTransactions.length > 0) {
                this.showUpcomingTransactionsAlert(upcomingTransactions);
            }

        } catch (error) {
            console.error('Error verificando transacciones próximas:', error);
            // No reintentar en caso de error para evitar loops infinitos
        }
    }

    isTransactionUpcoming(transaction) {
        const transactionDate = new Date(transaction.date);
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        // Verificar si la transacción es para mañana
        const isTomorrow = transactionDate.toDateString() === tomorrow.toDateString();
        
        // Para pruebas, también considerar transacciones de hoy
        const isToday = transactionDate.toDateString() === today.toDateString();
        
        // En modo prueba, mostrar también transacciones de hoy
        const isTestMode = window.location.hostname === 'localhost' || 
                          window.location.hostname === '127.0.0.1' ||
                          window.location.search.includes('test=true');
        if (isTestMode) {
            return isTomorrow || isToday;
        }
        
        return isTomorrow;
    }

    showUpcomingTransactionsAlert(transactions) {
        const count = transactions.length;
        const transactionTypes = transactions.reduce((acc, transaction) => {
            acc[transaction.type] = (acc[transaction.type] || 0) + 1;
            return acc;
        }, {});

        let body = `Tienes ${count} transacción(es) próximas:`;
        
        if (transactionTypes.income) {
            body += ` ${transactionTypes.income} ingreso(s)`;
        }
        if (transactionTypes.expense) {
            body += ` ${transactionTypes.expense} gasto(s)`;
        }

        this.showNotification('📅 Transacciones Próximas', {
            body: body,
            icon: '/static/logo_pwa.png',
            badge: '/static/logo_pwa.png',
            tag: 'upcoming-transactions',
            requireInteraction: true
        });

        // Toast en la app
        if (typeof showToast === 'function') {
            showToast(`📅 Tienes ${count} transacción(es) próximas`, 'warning');
        }
    }

    // Método para reiniciar notificaciones - VERSIÓN MEJORADA
    restart() {
        console.log("🔄 Reiniciando NotificationManager...");
        this.cleanup();
        
        // Pequeño delay para asegurar que auth esté listo
        setTimeout(() => {
            this.init();
        }, 1000);
    }

    // Limpiar todos los timeouts e intervals
    cleanup() {
        if (this.dailyReminderTimeout) {
            clearTimeout(this.dailyReminderTimeout);
            this.dailyReminderTimeout = null;
        }
        if (this.upcomingTransactionsCheck) {
            clearInterval(this.upcomingTransactionsCheck);
            this.upcomingTransactionsCheck = null;
        }
        console.log('🧹 Notificaciones limpiadas');
    }

    // CORREGIDO: MÉTODO DE PRUEBA - Versión inteligente
    testNotification() {
        console.log("🔔 Probando notificación...");
        
        const canUseActions = 'serviceWorker' in navigator && navigator.serviceWorker.controller;
        
        const testOptions = {
            body: '¡Las notificaciones están funcionando correctamente!',
            icon: '/static/logo_pwa.png',
            badge: '/static/logo_pwa.png',
            tag: 'test-notification',
            requireInteraction: true
        };
        
        // Solo agregar acciones si están disponibles
        if (canUseActions) {
            testOptions.actions = [
                {
                    action: 'add-transaction',
                    title: 'Agregar Transacción'
                },
                {
                    action: 'view-dashboard',
                    title: 'Ver Dashboard'
                }
            ];
            console.log("✅ Probando con acciones (Service Worker disponible)");
        } else {
            console.log("ℹ️ Probando sin acciones (Service Worker no disponible)");
        }
        
        this.showNotification('🧪 Prueba de Notificación', testOptions);
        
        if (typeof showToast === 'function') {
            showToast('🔔 Notificación de prueba enviada', 'success');
        }
    }

    // Probar notificación de transacciones próximas
    testUpcomingTransactions() {
        console.log("🔔 Probando notificación de transacciones...");
        
        const testTransactions = [
            { 
                id: 'test-1', 
                type: 'expense', 
                amount: 150, 
                category: 'Comida', 
                description: 'Almuerzo de prueba',
                date: new Date().toISOString()
            },
            { 
                id: 'test-2', 
                type: 'income', 
                amount: 500, 
                category: 'Salario', 
                description: 'Pago mensual de prueba',
                date: new Date().toISOString()
            }
        ];
        
        this.showUpcomingTransactionsAlert(testTransactions);
    }

    // CORREGIDO: Verificar estado actual de notificaciones de forma segura
    getStatus() {
        const status = {
            permission: this.notificationPermission,
            dailyReminder: {
                scheduled: !!this.dailyReminderTimeout,
                nextTime: this.getNextReminderTime()
            },
            transactionCheck: {
                active: !!this.upcomingTransactionsCheck,
                interval: 'Cada hora'
            },
            browserSupport: 'Notification' in window,
            serviceWorker: 'serviceWorker' in navigator,
            serviceWorkerController: !!(navigator.serviceWorker && navigator.serviceWorker.controller),
            firestore: !!(typeof firebase !== 'undefined' && firebase.firestore),
            auth: !!(window.auth && window.auth.currentUser),
            initialized: this.isInitialized
        };
        
        console.log('📊 Estado de Notificaciones:', status);
        return status;
    }

    // Obtener hora del próximo recordatorio
    getNextReminderTime() {
        if (!this.dailyReminderTimeout) return 'No programado';
        
        // Para modo prueba
        const isTestMode = window.location.hostname === 'localhost' || 
                          window.location.hostname === '127.0.0.1' ||
                          window.location.search.includes('test=true');
        if (isTestMode) {
            const now = new Date();
            const nextTime = new Date(now.getTime() + 120000); // 2 minutos
            return `Prueba: ${nextTime.toLocaleTimeString()}`;
        }
        
        const now = new Date();
        const targetTime = new Date();
        targetTime.setHours(18, 0, 0, 0);
        
        if (now > targetTime) {
            targetTime.setDate(targetTime.getDate() + 1);
        }
        
        return targetTime.toLocaleString();
    }
}

// Variable global para el manager de notificaciones
let notificationManager = null;

// FUNCIONES AUXILIARES GLOBALES PARA EL PANEL DE NOTIFICACIONES
window.handleTestNotification = function() {
    try {
        if (window.notificationManager && typeof window.notificationManager.testNotification === 'function') {
            window.notificationManager.testNotification();
        } else {
            showToast('Función de prueba no disponible', 'warning');
            console.error('testNotification no disponible');
        }
    } catch (error) {
        console.error('Error en testNotification:', error);
        showToast('Error al probar notificación: ' + error.message, 'danger');
    }
};

window.handleTestUpcomingTransactions = function() {
    try {
        if (window.notificationManager && typeof window.notificationManager.testUpcomingTransactions === 'function') {
            window.notificationManager.testUpcomingTransactions();
        } else {
            showToast('Función de prueba no disponible', 'warning');
            console.error('testUpcomingTransactions no disponible');
        }
    } catch (error) {
        console.error('Error en testUpcomingTransactions:', error);
        showToast('Error al probar transacciones: ' + error.message, 'danger');
    }
};

window.handleRequestPermission = function() {
    try {
        if (window.notificationManager && typeof window.notificationManager.requestPermission === 'function') {
            window.notificationManager.requestPermission();
        } else {
            showToast('Función de permisos no disponible', 'warning');
            console.error('requestPermission no disponible');
        }
    } catch (error) {
        console.error('Error en requestPermission:', error);
        showToast('Error al solicitar permisos: ' + error.message, 'danger');
    }
};

window.handleRestartNotifications = function() {
    try {
        if (window.notificationManager && typeof window.notificationManager.restart === 'function') {
            window.notificationManager.restart();
            showToast('Sistema de notificaciones reiniciado', 'success');
        } else {
            showToast('Función de reinicio no disponible', 'warning');
            console.error('restart no disponible');
        }
    } catch (error) {
        console.error('Error en restart:', error);
        showToast('Error al reiniciar notificaciones: ' + error.message, 'danger');
    }
};

window.showDebugInfo = function() {
    const debugInfo = {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        language: navigator.language,
        cookieEnabled: navigator.cookieEnabled,
        javaEnabled: navigator.javaEnabled ? navigator.javaEnabled() : false,
        screen: {
            width: screen.width,
            height: screen.height
        },
        window: {
            width: window.innerWidth,
            height: window.innerHeight
        },
        url: window.location.href,
        timestamp: new Date().toISOString()
    };
    
    console.log('🐛 Información de Depuración:', debugInfo);
    showToast('Información de depuración enviada a la consola', 'info');
};

document.addEventListener('DOMContentLoaded', function() {
    console.log("DOM cargado - Iniciando aplicación");
    initializeApp();
});

// FUNCIÓN PARA ESPERAR FIREBASE
function waitForFirebase() {
    return new Promise((resolve, reject) => {
        let attempts = 0;
        const maxAttempts = 20;
        const checkInterval = 500;
        
        const checkFirebase = () => {
            attempts++;
            
            // VERIFICACIÓN MÁS COMPLETA
            if (typeof firebase !== 'undefined' && 
                firebase.app && 
                typeof firebase.auth === 'function' &&
                typeof firebase.firestore === 'function') {
                console.log("✅ Firebase completamente cargado");
                resolve();
                return;
            }
            
            if (attempts >= maxAttempts) {
                const error = new Error("Firebase no se cargó después de " + maxAttempts + " intentos");
                console.error("❌", error.message);
                reject(error);
                return;
            }
            
            console.log("⏳ Esperando Firebase... intento " + attempts);
            setTimeout(checkFirebase, checkInterval);
        };
        
        checkFirebase();
    });
}

// AGREGAR AL INICIO DE app.js - DESPUÉS DE LAS VARIABLES GLOBALES
function initializeTransactionManager() {
    return new Promise((resolve, reject) => {
        let attempts = 0;
        const maxAttempts = 10;
        
        const checkTransactionManager = () => {
            attempts++;
            
            // Verificar si TransactionManager está disponible
            if (typeof TransactionManager !== 'undefined') {
                console.log("✅ TransactionManager disponible, instanciando...");
                
                // Instanciar TransactionManager
                if (typeof transactionManager === 'undefined') {
                    window.transactionManager = new TransactionManager();
                    console.log("✅ TransactionManager instanciado correctamente");
                }
                
                resolve();
                return;
            }
            
            if (attempts >= maxAttempts) {
                const error = new Error("TransactionManager no disponible después de " + maxAttempts + " intentos");
                console.error("❌", error.message);
                reject(error);
                return;
            }
            
            console.log("⏳ Esperando TransactionManager... intento " + attempts);
            setTimeout(checkTransactionManager, 1000);
        };
        
        checkTransactionManager();
    });
}

// MODIFICAR initializeManagers() para ser más simple
async function initializeManagers() {
    try {
        console.log("🔄 Inicializando managers...");
        
        // 1. Inicializar TransactionManager primero
        await initializeTransactionManager();
        
        // 2. Luego BudgetManager si existe
        if (typeof BudgetManager !== 'undefined' && typeof budgetManager === 'undefined') {
            console.log("Inicializando BudgetManager...");
            window.budgetManager = new BudgetManager();
        }
        
        // 3. Finalmente NotificationManager
        if (!notificationManager && typeof NotificationManager !== 'undefined') {
            console.log("Inicializando NotificationManager...");
            window.notificationManager = new NotificationManager();
        }
        
        console.log("✅ Todos los managers inicializados correctamente");
        
    } catch (error) {
        console.error("❌ Error inicializando managers:", error);
        // Usar fallbacks
        window.transactionManager = createFallbackTransactionManager();
        if (typeof budgetManager === 'undefined') {
            window.budgetManager = createFallbackBudgetManager();
        }
    }
}








// MODIFICAR initializeApp() para usar la nueva función
async function initializeApp() {
    showLoading(true);
    
    try {
        // VERIFICACIÓN MÁS ROBUSTA DE FIREBASE
        if (typeof firebase === 'undefined') {
            console.error('❌ Firebase no está cargado');
            showError('Error: Firebase no se cargó correctamente. Recarga la página.');
            return;
        }
        
        await waitForFirebase();
        
        // VERIFICAR SI FIREBASE SE INICIALIZÓ CORRECTAMENTE
        if (!firebase.apps.length) {
            console.error('❌ Firebase no se inicializó');
            showError('Error de configuración de Firebase');
            return;
        }
        
        console.log("✅ Firebase inicializado correctamente");
        
        // INICIALIZAR MANAGERS
        await initializeManagers();
        
        // CONFIGURAR AUTH LISTENER
        setupAuthListener();
        
        // CONFIGURAR NAVEGACIÓN
        setupNavigation();
        
        console.log("✅ Aplicación inicializada correctamente");
        
    } catch (error) {
        console.error("Error crítico en inicialización:", error);
        showError("Error al inicializar la aplicación: " + error.message);
    } finally {
        showLoading(false);
    }
}


// AGREGAR FUNCIÓN DE FALLBACK MEJORADA
function createFallbackTransactionManager() {
    console.warn('⚠️ Usando TransactionManager de fallback');
    return {
        getDashboardData: async function(month, year) {
            console.log('📊 Usando fallback getDashboardData');
            try {
                // Intentar obtener datos reales si es posible
                if (window.auth && window.auth.currentUser) {
                    const db = firebase.firestore();
                    const transactionsRef = db.collection('users').doc(window.auth.currentUser.uid).collection('transactions');
                    
                    const startDate = new Date(year, month - 1, 1);
                    const endDate = new Date(year, month, 0);
                    
                    const snapshot = await transactionsRef
                        .where('date', '>=', startDate.toISOString().split('T')[0])
                        .where('date', '<=', endDate.toISOString().split('T')[0])
                        .get();
                    
                    const transactions = [];
                    let totalIncome = 0;
                    let totalExpense = 0;
                    const categories = { income: {}, expense: {} };
                    
                    snapshot.forEach(doc => {
                        const transaction = doc.data();
                        transaction.id = doc.id;
                        transactions.push(transaction);
                        
                        if (transaction.type === 'income') {
                            totalIncome += transaction.amount;
                            categories.income[transaction.category] = (categories.income[transaction.category] || 0) + transaction.amount;
                        } else {
                            totalExpense += transaction.amount;
                            categories.expense[transaction.category] = (categories.expense[transaction.category] || 0) + transaction.amount;
                        }
                    });
                    
                    return {
                        summary: {
                            totalIncome,
                            totalExpense,
                            balance: totalIncome - totalExpense,
                            month,
                            year
                        },
                        transactions,
                        categories
                    };
                }
            } catch (error) {
                console.error('Error en fallback getDashboardData:', error);
            }
            
            // Fallback básico
            return {
                summary: {
                    totalIncome: 0,
                    totalExpense: 0,
                    balance: 0,
                    month: month,
                    year: year
                },
                transactions: [],
                categories: {
                    income: {},
                    expense: {}
                }
            };
        },
        
        getTransactions: async function(options = {}) {
            console.log('📋 Usando fallback getTransactions');
            try {
                if (window.auth && window.auth.currentUser) {
                    const db = firebase.firestore();
                    const transactionsRef = db.collection('users').doc(window.auth.currentUser.uid).collection('transactions');
                    
                    let query = transactionsRef;
                    
                    if (options.month && options.year) {
                        const startDate = new Date(options.year, options.month - 1, 1);
                        const endDate = new Date(options.year, options.month, 0);
                        query = query.where('date', '>=', startDate.toISOString().split('T')[0])
                                    .where('date', '<=', endDate.toISOString().split('T')[0]);
                    }
                    
                    const snapshot = await query.orderBy('date', 'desc').get();
                    const transactions = [];
                    
                    snapshot.forEach(doc => {
                        const transaction = doc.data();
                        transaction.id = doc.id;
                        transactions.push(transaction);
                    });
                    
                    return transactions;
                }
            } catch (error) {
                console.error('Error en fallback getTransactions:', error);
            }
            
            return [];
        },
        
        addTransaction: async function(transaction) {
            console.log('➕ Usando fallback addTransaction');
            try {
                if (window.auth && window.auth.currentUser) {
                    const db = firebase.firestore();
                    const transactionsRef = db.collection('users').doc(window.auth.currentUser.uid).collection('transactions');
                    
                    await transactionsRef.add(transaction);
                    showToast('Transacción agregada correctamente', 'success');
                    return;
                }
            } catch (error) {
                console.error('Error en fallback addTransaction:', error);
                showToast('Error al agregar transacción: ' + error.message, 'danger');
                throw error;
            }
            
            showToast('TransactionManager no disponible', 'warning');
            throw new Error('TransactionManager no disponible');
        },
        
        updateTransaction: async function(id, transaction) {
            console.log('✏️ Usando fallback updateTransaction');
            try {
                if (window.auth && window.auth.currentUser) {
                    const db = firebase.firestore();
                    const transactionRef = db.collection('users').doc(window.auth.currentUser.uid).collection('transactions').doc(id);
                    
                    await transactionRef.update(transaction);
                    showToast('Transacción actualizada correctamente', 'success');
                    return;
                }
            } catch (error) {
                console.error('Error en fallback updateTransaction:', error);
                showToast('Error al actualizar transacción: ' + error.message, 'danger');
                throw error;
            }
            
            showToast('TransactionManager no disponible', 'warning');
            throw new Error('TransactionManager no disponible');
        },
        
        deleteTransaction: async function(id) {
            console.log('🗑️ Usando fallback deleteTransaction');
            try {
                if (window.auth && window.auth.currentUser) {
                    const db = firebase.firestore();
                    const transactionRef = db.collection('users').doc(window.auth.currentUser.uid).collection('transactions').doc(id);
                    
                    await transactionRef.delete();
                    showToast('Transacción eliminada correctamente', 'success');
                    return;
                }
            } catch (error) {
                console.error('Error en fallback deleteTransaction:', error);
                showToast('Error al eliminar transacción: ' + error.message, 'danger');
                throw error;
            }
            
            showToast('TransactionManager no disponible', 'warning');
            throw new Error('TransactionManager no disponible');
        },
        
        processTransactionDate: function(transaction) {
            // Función básica de procesamiento de fecha
            if (transaction.date && typeof transaction.date === 'string') {
                return new Date(transaction.date);
            }
            if (transaction.date && typeof transaction.date.toDate === 'function') {
                return transaction.date.toDate();
            }
            return new Date();
        }
    };
}

function createFallbackBudgetManager() {
    console.warn('⚠️ Usando BudgetManager de fallback');
    return {
        createBudget: async function(budgetData) {
            showToast('BudgetManager no disponible', 'warning');
            throw new Error('BudgetManager no disponible');
        },
        getBudgetStatus: async function(month, year) {
            return [];
        },
        getAllUserBudgets: async function() {
            return [];
        },
        updateBudget: async function(id, budgetData) {
            showToast('BudgetManager no disponible', 'warning');
            throw new Error('BudgetManager no disponible');
        },
        deleteBudget: async function(id) {
            showToast('BudgetManager no disponible', 'warning');
            throw new Error('BudgetManager no disponible');
        }
    };
}


// En setupAuthListener() - VERSIÓN CORREGIDA
function setupAuthListener() {
    console.log('🔐 Configurando listener de autenticación...');
    
    // USAR SIEMPRE firebase.auth() directamente
    firebase.auth().onAuthStateChanged((user) => {
        console.log("Estado de autenticación:", user ? "Usuario logueado" : "No logueado");
        
        updateNavbar(user);
        
        if (user) {
            console.log("👤 Usuario autenticado:", user.email);
            loadDashboard(user);
            
            // Reiniciar notificaciones
            if (window.notificationManager && typeof window.notificationManager.restart === 'function') {
                setTimeout(() => {
                    try {
                        console.log("🔄 Reiniciando notificaciones para usuario:", user.email);
                        window.notificationManager.restart();
                    } catch (error) {
                        console.error("Error reiniciando notificaciones:", error);
                    }
                }, 3000);
            }
        } else {
            loadLoginPage();
            
            // Limpiar notificaciones
            if (window.notificationManager && typeof window.notificationManager.cleanup === 'function') {
                try {
                    console.log("🧹 Limpiando notificaciones por cierre de sesión...");
                    window.notificationManager.cleanup();
                } catch (error) {
                    console.error("Error limpiando notificaciones:", error);
                }
            }
        }
        showLoading(false);
    }, (error) => {
        console.error("Error en autenticación:", error);
        showError("Error de autenticación: " + error.message);
        showLoading(false);
    });
}



function setupNavigation() {
    console.log('🔧 Configurando navegación MEJORADA...');
    
    // Manejadores de los botones de navegación
    const navHome = document.getElementById('nav-home');
    const navProfile = document.getElementById('nav-profile');
    const navAddTransaction = document.getElementById('nav-add-transaction');
    const navLogout = document.getElementById('nav-logout');
    const navLogin = document.getElementById('nav-login');

    // Función común para manejar navegación
    function handleNavigation(callback) {
        return (e) => {
            e.preventDefault();
            // Cerrar menú en móviles
            closeNavbar();
            // Ejecutar la acción
            callback();
        };
    }

    if (navHome) {
        navHome.addEventListener('click', handleNavigation(() => {
            console.log('🏠 Navegando a Home - CLICK CONFIRMADO');
            const currentUser = firebase.auth().currentUser;
            if (currentUser) {
                console.log('✅ Usuario autenticado, cargando dashboard...');
                loadDashboard(currentUser);
            } else {
                console.log('⚠️ Usuario no autenticado, cargando login...');
                loadLoginPage();
            }
        }));
    }

    if (navProfile) {
        navProfile.addEventListener('click', handleNavigation(() => {
            console.log('👤 Navegando a Perfil - CLICK CONFIRMADO');
            const currentUser = firebase.auth().currentUser;
            if (currentUser) {
                console.log('✅ Usuario autenticado, cargando perfil...');
                showProfile();
            } else {
                console.log('⚠️ Usuario no autenticado, cargando login...');
                loadLoginPage();
            }
        }));
    }

    if (navAddTransaction) {
        navAddTransaction.addEventListener('click', handleNavigation(() => {
            console.log('➕ Navegando a Agregar Transacción - CLICK CONFIRMADO');
            const currentUser = firebase.auth().currentUser;
            if (currentUser) {
                console.log('✅ Usuario autenticado, cargando formulario...');
                showAddTransaction();
            } else {
                console.log('⚠️ Usuario no autenticado, cargando login...');
                loadLoginPage();
            }
        }));
    }

    if (navLogout) {
        navLogout.addEventListener('click', handleNavigation(() => {
            console.log('🚪 Cerrando sesión - CLICK CONFIRMADO');
            logout();
        }));
    }

    if (navLogin) {
        navLogin.addEventListener('click', handleNavigation(() => {
            console.log('🔑 Navegando a Login - CLICK CONFIRMADO');
            loadLoginPage();
        }));
    }

    console.log('✅ Navegación configurada correctamente');
}

function updateNavbar(user) {
    console.log('🔄 Actualizando navbar...', { 
        user: user ? user.email : 'null'
    });
    
    const navHome = document.getElementById('nav-home');
    const navProfile = document.getElementById('nav-profile');
    const navAddTransaction = document.getElementById('nav-add-transaction');
    const navLogout = document.getElementById('nav-logout');
    const navLogin = document.getElementById('nav-login');

    if (user) {
        // Usuario logueado - MOSTRAR elementos de usuario
        console.log('✅ Mostrando navbar para usuario logueado');
        
        if (navHome) {
            navHome.parentElement.style.display = 'block';
            navHome.style.display = 'block';
        }
        if (navProfile) {
            navProfile.parentElement.style.display = 'block';
            navProfile.style.display = 'block';
        }
        if (navAddTransaction) {
            navAddTransaction.parentElement.style.display = 'block';
            navAddTransaction.style.display = 'block';
        }
        if (navLogout) {
            navLogout.parentElement.style.display = 'block';
            navLogout.style.display = 'block'; // ✅ ESTA ES LA LÍNEA CLAVE
            navLogout.innerHTML = '<i class="fas fa-sign-out-alt"></i> <span>Cerrar Sesión</span>';
        }
        if (navLogin) {
            navLogin.parentElement.style.display = 'none';
            navLogin.style.display = 'none';
        }
        
    } else {
        // Usuario no logueado - MOSTRAR solo login
        console.log('✅ Mostrando navbar para usuario no logueado');
        
        if (navHome) {
            navHome.parentElement.style.display = 'none';
            navHome.style.display = 'none';
        }
        if (navProfile) {
            navProfile.parentElement.style.display = 'none';
            navProfile.style.display = 'none';
        }
        if (navAddTransaction) {
            navAddTransaction.parentElement.style.display = 'none';
            navAddTransaction.style.display = 'none';
        }
        if (navLogout) {
            navLogout.parentElement.style.display = 'none';
            navLogout.style.display = 'none';
        }
        if (navLogin) {
            navLogin.parentElement.style.display = 'block';
            navLogin.style.display = 'block';
        }
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
    console.log('🚀 INICIANDO loadDashboard CORREGIDA...', { 
        user: user ? user.email : 'null',
        authUser: window.auth?.currentUser?.email,
        firebaseUser: firebase.auth().currentUser?.email
    });
    
    // CORRECCIÓN: Usar siempre firebase.auth() directamente para evitar conflictos
    const currentUser = user || firebase.auth().currentUser;
    
    if (!currentUser) {
        console.error('❌ No hay usuario para cargar dashboard');
        loadLoginPage();
        return;
    }

    const content = document.getElementById('content');
    if (!content) {
        console.error('❌ Elemento content no encontrado');
        return;
    }

    console.log('✅ Cargando dashboard para:', currentUser.email);
    
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    
    // HTML COMPLETO del dashboard - ASEGURAR que todos los elementos existan
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

            <!-- Resumen Financiero -->
            <div class="row mb-4" id="financial-summary">
                <div class="col-12 text-center">
                    <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">Cargando resumen...</span>
                    </div>
                    <p>Cargando resumen financiero...</p>
                </div>
            </div>

            <!-- Botones principales con nuevo estilo -->
            <div class="row justify-content-center mb-4">
                <div class="col-md-12">
                    <div class="d-flex justify-content-center gap-3 flex-wrap">
                        <button class="btn-custom btn-primary-custom" onclick="showAddBudget()">
                            <span>
                                <i class="fas fa-plus-circle me-2"></i>Agregar Presupuesto
                            </span>
                        </button>
                        <button class="btn-custom btn-info-custom" onclick="showBudgetsPage()">
                            <span>
                                <i class="fas fa-chart-pie me-2"></i>Ver Mis Presupuestos
                            </span>
                        </button>
                        <button class="btn-custom btn-success-custom" onclick="showAddTransaction()">
                            <span>
                                <i class="fas fa-plus me-2"></i>Nueva Transacción
                            </span>
                        </button>
                    </div>
                </div>
            </div>

            <!-- Gráfico de Evolución Temporal -->
            <div class="row mb-4">
                <div class="col-md-12">
                    <div class="card shadow">
                        <div class="card-body">
                            <h2 class="card-title mb-4">Evolución de Ingresos y Gastos</h2>
                            <div class="chart-container">
                                <canvas id="timelineChart" height="120"></canvas>
                            </div>
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
                            <div class="text-center py-4">
                                <div class="spinner-border text-primary" role="status">
                                    <span class="visually-hidden">Cargando transacciones...</span>
                                </div>
                                <p class="mt-2">Cargando transacciones...</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Gráficos de Categorías -->
            <div class="row mt-4">
                <div class="col-md-6">
                    <div class="card shadow">
                        <div class="card-body">
                            <h2 class="text-center card-title">Distribución de Ingresos</h2>
                            <div class="chart-container">
                                <canvas id="incomeChart" height="250"></canvas>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="card shadow">
                        <div class="card-body">
                            <h2 class="text-center card-title">Distribución de Gastos</h2>
                            <div class="chart-container">
                                <canvas id="expenseChart" height="250"></canvas>
                            </div>
                        </div>
                    </div>
                </div>
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
                                    <button type="submit" class="btn-custom btn-primary-custom w-100">
                                        <span>
                                            <i class="fas fa-search me-2"></i>Filtrar
                                        </span>
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Agregar estilos CSS para los botones personalizados
    const buttonStyles = `
    <style>
        .btn-custom {
            position: relative;
            display: flex;
            justify-content: center;
            align-items: center;
            border-radius: 8px;
            font-family: "Montserrat", sans-serif;
            box-shadow: 0px 6px 24px 0px rgba(0, 0, 0, 0.2);
            overflow: hidden;
            cursor: pointer;
            border: none;
            transition: all 0.3s ease;
            min-width: 200px;
        }

        .btn-primary-custom {
            background: #183153;
        }

        .btn-info-custom {
            background: #0e7490;
        }

        .btn-success-custom {
            background: #15803d;
        }

        .btn-custom:after {
            content: " ";
            width: 0%;
            height: 100%;
            background: #ffd401;
            position: absolute;
            transition: all 0.4s ease-in-out;
            right: 0;
        }

        .btn-primary-custom:after {
            background: #60a5fa;
        }

        .btn-info-custom:after {
            background: #22d3ee;
        }

        .btn-success-custom:after {
            background: #4ade80;
        }

        .btn-custom:hover::after {
            right: auto;
            left: 0;
            width: 100%;
        }

        .btn-custom span {
            text-align: center;
            text-decoration: none;
            width: 100%;
            padding: 12px 20px;
            color: #fff;
            font-size: 0.9em;
            font-weight: 600;
            letter-spacing: 0.1em;
            z-index: 20;
            transition: all 0.3s ease-in-out;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .btn-custom:hover span {
            color: #183153;
            animation: scaleUp 0.3s ease-in-out;
        }

        .btn-primary-custom:hover span {
            color: #183153;
        }

        .btn-info-custom:hover span {
            color: #0e7490;
        }

        .btn-success-custom:hover span {
            color: #15803d;
        }

        @keyframes scaleUp {
            0% {
                transform: scale(1);
            }
            50% {
                transform: scale(0.95);
            }
            100% {
                transform: scale(1);
            }
        }

        /* Efectos adicionales para mejor UX */
        .btn-custom:active {
            transform: translateY(2px);
            box-shadow: 0px 4px 16px 0px rgba(0, 0, 0, 0.2);
        }

        /* Responsive */
        @media (max-width: 768px) {
            .btn-custom {
                min-width: 160px;
                margin-bottom: 10px;
            }
            
            .btn-custom span {
                padding: 10px 16px;
                font-size: 0.85em;
            }
        }

        @media (max-width: 576px) {
            .btn-custom {
                min-width: 140px;
            }
            
            .btn-custom span {
                padding: 8px 12px;
                font-size: 0.8em;
            }
            
            .btn-custom span i {
                margin-right: 4px !important;
            }
        }

        /* Modo oscuro */
        @media (prefers-color-scheme: dark) {
            .btn-custom {
                box-shadow: 0px 6px 24px 0px rgba(0, 0, 0, 0.4);
            }
            
            .btn-custom:active {
                box-shadow: 0px 4px 16px 0px rgba(0, 0, 0, 0.4);
            }
        }
    </style>
    `;

    // Agregar los estilos al head si no existen
    if (!document.getElementById('custom-buttons-styles')) {
        const styleElement = document.createElement('style');
        styleElement.id = 'custom-buttons-styles';
        styleElement.textContent = buttonStyles;
        document.head.appendChild(styleElement);
    }

    // Configurar event listeners después de renderizar
    setTimeout(() => {
        const filtersForm = document.getElementById('filters-form');
        if (filtersForm) {
            filtersForm.addEventListener('submit', function(e) {
                e.preventDefault();
                applyFilters();
            });
        }

        console.log('✅ Dashboard HTML renderizado, cargando datos...');
    }, 100);

    // Cargar datos del dashboard
    loadDashboardData(currentYear, currentMonth, currentTimeframe);
}

// FUNCIÓN MEJORADA: Cargar datos del dashboard con selector de vista temporal
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

// Función para actualizar el resumen financiero con nuevo estilo
function updateFinancialSummary(summary) {
    const financialSummary = document.getElementById('financial-summary');
    if (!financialSummary) return;

    const ahorroPotencial = summary.totalIncome * 0.2;
    const daysInMonth = new Date(summary.year, summary.month, 0).getDate();
    const currentDay = new Date().getDate();
    const daysPassed = Math.min(currentDay, daysInMonth);
    const gastoDiarioPromedio = daysPassed > 0 ? summary.totalExpense / daysPassed : 0;
    
    // Calcular porcentajes para las barras de progreso
    const ingresoPorcentaje = Math.min((summary.totalIncome / (summary.totalIncome + 10000)) * 100, 100);
    const gastoPorcentaje = Math.min((summary.totalExpense / (summary.totalIncome || 1)) * 100, 100);
    const balancePorcentaje = summary.totalIncome > 0 ? Math.min((Math.abs(summary.balance) / summary.totalIncome) * 100, 100) : 0;
    const gastoDiarioPorcentaje = Math.min((gastoDiarioPromedio / 500) * 100, 100); // Asumiendo $500 como máximo diario
    
    const summaryHTML = `
        <div class="col-md-3 mb-4">
            <div class="card-finance income-card">
                <div class="title">
                    <span class="icon-income">
                        <svg width="20" fill="currentColor" height="20" viewBox="0 0 1792 1792" xmlns="http://www.w3.org/2000/svg">
                            <path d="M1344 960v-128q0-26-19-45t-45-19h-128v-128q0-26-19-45t-45-19h-256q-26 0-45 19t-19 45v128h-128q-26 0-45 19t-19 45v128q0 26 19 45t45 19h128v128q0 26 19 45t45 19h256q26 0 45-19t19-45v-128h128q26 0 45-19t19-45zm320-64q0 209-103 385.5t-279.5 279.5-385.5 103-385.5-103-279.5-279.5-103-385.5 103-385.5 279.5-279.5 385.5-103 385.5 103 279.5 279.5 103 385.5z"></path>
                        </svg>
                    </span>
                    <p class="title-text">INGRESOS</p>
                    <p class="percent positive">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1792 1792" fill="currentColor" height="16" width="16">
                            <path d="M1408 1216q0 26-19 45t-45 19h-896q-26 0-45-19t-19-45 19-45l448-448q19-19 45-19t45 19l448 448q19 19 19 45z"></path>
                        </svg>
                        ${summary.totalIncome > 0 ? Math.round((summary.totalIncome / (summary.totalIncome + summary.totalExpense)) * 100) : 0}%
                    </p>
                </div>
                <div class="data">
                    <p>$${summary.totalIncome.toFixed(2)}</p>
                    <div class="range">
                        <div class="fill income-fill" style="width: ${ingresoPorcentaje}%"></div>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="col-md-3 mb-4">
            <div class="card-finance expense-card">
                <div class="title">
                    <span class="icon-expense">
                        <svg width="20" fill="currentColor" height="20" viewBox="0 0 1792 1792" xmlns="http://www.w3.org/2000/svg">
                            <path d="M1344 960v-128q0-26-19-45t-45-19h-384q-26 0-45 19t-19 45v128q0 26 19 45t45 19h384q26 0 45-19t19-45zm320-64q0 209-103 385.5t-279.5 279.5-385.5 103-385.5-103-279.5-279.5-103-385.5 103-385.5 279.5-279.5 385.5-103 385.5 103 279.5 279.5 103 385.5z"></path>
                        </svg>
                    </span>
                    <p class="title-text">GASTOS</p>
                    <p class="percent negative">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1792 1792" fill="currentColor" height="16" width="16">
                            <path d="M1408 1216q0 26-19 45t-45 19h-896q-26 0-45-19t-19-45 19-45l448-448q19-19 45-19t45 19l448 448q19 19 19 45z" transform="rotate(180, 896, 896)"></path>
                        </svg>
                        ${summary.totalIncome > 0 ? Math.round((summary.totalExpense / summary.totalIncome) * 100) : 0}%
                    </p>
                </div>
                <div class="data">
                    <p>$${summary.totalExpense.toFixed(2)}</p>
                    <div class="range">
                        <div class="fill expense-fill" style="width: ${gastoPorcentaje}%"></div>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="col-md-3 mb-4">
            <div class="card-finance ${summary.balance >= 0 ? 'balance-positive' : 'balance-negative'}">
                <div class="title">
                    <span class="icon-balance">
                        <svg width="20" fill="currentColor" height="20" viewBox="0 0 1792 1792" xmlns="http://www.w3.org/2000/svg">
                            <path d="M1408 992v-192q0-14-9-23t-23-9h-96v-288q0-14-9-23t-23-9h-192q-14 0-23 9t-9 23v288h-96q-14 0-23 9t-9 23v192q0 14 9 23t23 9h96v288q0 14 9 23t23 9h192q14 0 23-9t9-23v-288h96q14 0 23-9t9-23zm-384-896q-148 0-273 73t-198 198-73 273 73 273 198 198 273 73 273-73 198-198 73-273-73-273-198-198-273-73zm768 544v96q0 14-9 23t-23 9h-96v96q0 14-9 23t-23 9h-96q-14 0-23-9t-9-23v-96h-96q-14 0-23-9t-9-23v-96q0-14 9-23t23-9h96v-96q0-14 9-23t23-9h96q14 0 23 9t9 23v96h96q14 0 23 9t9 23z"></path>
                        </svg>
                    </span>
                    <p class="title-text">BALANCE</p>
                    <p class="percent ${summary.balance >= 0 ? 'positive' : 'negative'}">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1792 1792" fill="currentColor" height="16" width="16">
                            <path d="${summary.balance >= 0 ? 'M1408 1216q0 26-19 45t-45 19h-896q-26 0-45-19t-19-45 19-45l448-448q19-19 45-19t45 19l448 448q19 19 19 45z' : 'M1408 1216q0 26-19 45t-45 19h-896q-26 0-45-19t-19-45 19-45l448-448q19-19 45-19t45 19l448 448q19 19 19 45z'}" ${summary.balance < 0 ? 'transform="rotate(180, 896, 896)"' : ''}></path>
                        </svg>
                        ${summary.totalIncome > 0 ? Math.round((Math.abs(summary.balance) / summary.totalIncome) * 100) : 0}%
                    </p>
                </div>
                <div class="data">
                    <p class="${summary.balance >= 0 ? 'text-positive' : 'text-negative'}">$${Math.abs(summary.balance).toFixed(2)}</p>
                    <div class="range">
                        <div class="fill ${summary.balance >= 0 ? 'balance-positive-fill' : 'balance-negative-fill'}" style="width: ${balancePorcentaje}%"></div>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="col-md-3 mb-4">
            <div class="card-finance daily-card">
                <div class="title">
                    <span class="icon-daily">
                        <svg width="20" fill="currentColor" height="20" viewBox="0 0 1792 1792" xmlns="http://www.w3.org/2000/svg">
                            <path d="M1024 544v448q0 14-9 23t-23 9h-320q-14 0-23-9t-9-23v-64q0-14 9-23t23-9h224v-352q0-14 9-23t23-9h64q14 0 23 9t9 23zm416 352q0-148-73-273t-198-198-273-73-273 73-198 198-73 273 73 273 198 198 273 73 273-73 198-198 73-273zm224 0q0 209-103 385.5t-279.5 279.5-385.5 103-385.5-103-279.5-279.5-103-385.5 103-385.5 279.5-279.5 385.5-103 385.5 103 279.5 279.5 103 385.5z"></path>
                        </svg>
                    </span>
                    <p class="title-text">GASTO DIARIO</p>
                    <p class="percent neutral">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1792 1792" fill="currentColor" height="16" width="16">
                            <path d="M1408 1216q0 26-19 45t-45 19h-896q-26 0-45-19t-19-45 19-45l448-448q19-19 45-19t45 19l448 448q19 19 19 45z"></path>
                        </svg>
                        ${Math.round(gastoDiarioPorcentaje)}%
                    </p>
                </div>
                <div class="data">
                    <p>$${gastoDiarioPromedio.toFixed(2)}</p>
                    <div class="range">
                        <div class="fill daily-fill" style="width: ${gastoDiarioPorcentaje}%"></div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    financialSummary.innerHTML = summaryHTML;
}

// Agregar estos estilos CSS al archivo de estilos existente
const financeCardsStyles = `
<style>
    .card-finance {
        padding: 1.5rem;
        background-color: var(--card-bg, #e5e7eb);
        box-shadow: -10px -10px 20px rgba(255, 255, 255, 0.8), 
                    10px 10px 20px rgba(153, 161, 175, 0.3),
                    inset -10px -10px 20px rgba(209, 213, 220, 0.5);
        border-radius: 20px;
        transition: all 0.3s ease;
        height: 100%;
    }

    .card-finance:hover {
        transform: translateY(-5px);
        box-shadow: -15px -15px 30px rgba(255, 255, 255, 0.8), 
                    15px 15px 30px rgba(153, 161, 175, 0.4);
    }

    .title {
        display: flex;
        align-items: center;
        margin-bottom: 1rem;
    }

    .title span {
        position: relative;
        padding: 0.5rem;
        box-shadow: -2px -2px 4px rgba(255, 255, 255, 0.8),
                    2px 2px 4px rgba(153, 161, 175, 0.3);
        width: 2.5rem;
        height: 2.5rem;
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .icon-income {
        background: linear-gradient(135deg, #10b981, #059669);
    }

    .icon-expense {
        background: linear-gradient(135deg, #ef4444, #dc2626);
    }

    .icon-balance {
        background: linear-gradient(135deg, #3b82f6, #1d4ed8);
    }

    .icon-daily {
        background: linear-gradient(135deg, #8b5cf6, #7c3aed);
    }

    .title span svg {
        color: #ffffff;
        height: 1.2rem;
        width: 1.2rem;
    }

    .title-text {
        margin-left: 0.75rem;
        color: var(--text-color, #374151);
        font-size: 0.9rem;
        font-weight: 600;
        flex: 1;
    }

    .percent {
        display: flex;
        align-items: center;
        font-size: 0.8rem;
        font-weight: 600;
        padding: 0.25rem 0.5rem;
        border-radius: 8px;
        box-shadow: inset -2px -2px 4px rgba(255, 255, 255, 0.8),
                    inset 2px 2px 4px rgba(153, 161, 175, 0.2);
    }

    .percent.positive {
        color: #10b981;
        background-color: rgba(16, 185, 129, 0.1);
    }

    .percent.negative {
        color: #ef4444;
        background-color: rgba(239, 68, 68, 0.1);
    }

    .percent.neutral {
        color: #6b7280;
        background-color: rgba(107, 114, 128, 0.1);
    }

    .percent svg {
        margin-right: 0.25rem;
    }

    .data {
        display: flex;
        flex-direction: column;
        justify-content: flex-start;
    }

    .data p {
        margin-top: 0.5rem;
        margin-bottom: 1rem;
        color: var(--text-color, #1f2937);
        font-size: 1.75rem;
        font-weight: 700;
        text-align: left;
    }

    .text-positive {
        color: #10b981 !important;
    }

    .text-negative {
        color: #ef4444 !important;
    }

    .data .range {
        position: relative;
        background-color: var(--card-bg, #e5e7eb);
        box-shadow: inset -2px -2px 4px rgba(255, 255, 255, 0.8),
                    inset 2px 2px 4px rgba(153, 161, 175, 0.3);
        width: 100%;
        height: 0.5rem;
        border-radius: 0.5rem;
        overflow: hidden;
    }

    .data .range .fill {
        position: absolute;
        top: 0;
        left: 0;
        height: 100%;
        border-radius: 0.5rem;
        transition: width 0.8s ease-in-out;
    }

    .income-fill {
        background: linear-gradient(90deg, #10b981, #34d399);
    }

    .expense-fill {
        background: linear-gradient(90deg, #ef4444, #f87171);
    }

    .balance-positive-fill {
        background: linear-gradient(90deg, #3b82f6, #60a5fa);
    }

    .balance-negative-fill {
        background: linear-gradient(90deg, #f59e0b, #fbbf24);
    }

    .daily-fill {
        background: linear-gradient(90deg, #8b5cf6, #a78bfa);
    }

    /* Modo oscuro */
    @media (prefers-color-scheme: dark) {
        .card-finance {
            background-color: var(--card-bg, #1e1e1e);
            box-shadow: -10px -10px 20px rgba(255, 255, 255, 0.05), 
                        10px 10px 20px rgba(0, 0, 0, 0.3),
                        inset -10px -10px 20px rgba(255, 255, 255, 0.05);
        }

        .title span {
            box-shadow: -2px -2px 4px rgba(255, 255, 255, 0.05),
                        2px 2px 4px rgba(0, 0, 0, 0.3);
        }

        .data .range {
            box-shadow: inset -2px -2px 4px rgba(255, 255, 255, 0.05),
                        inset 2px 2px 4px rgba(0, 0, 0, 0.3);
        }

        .percent {
            box-shadow: inset -2px -2px 4px rgba(255, 255, 255, 0.05),
                        inset 2px 2px 4px rgba(0, 0, 0, 0.2);
        }
    }

    /* Responsive */
    @media (max-width: 768px) {
        .card-finance {
            padding: 1rem;
        }
        
        .title span {
            width: 2rem;
            height: 2rem;
        }
        
        .title span svg {
            height: 1rem;
            width: 1rem;
        }
        
        .data p {
            font-size: 1.5rem;
        }
    }
</style>
`;

// Agregar los estilos al documento
document.head.insertAdjacentHTML('beforeend', financeCardsStyles);

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

// FUNCIÓN: Recargar dashboard con tipo de gráfica seleccionado
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
                                <button type="submit" class="btn btn-primary btn-lg" id="submit-transaction-btn">
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

    // Variable para controlar el estado del envío
    let isSubmitting = false;

    document.getElementById('add-transaction-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Prevenir múltiples envíos
        if (isSubmitting) {
            console.log('⏳ Transacción ya en proceso, ignorando clic...');
            return;
        }
        
        isSubmitting = true;
        
        // Deshabilitar botón y mostrar estado de carga
        const submitBtn = document.getElementById('submit-transaction-btn');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Guardando...';
        submitBtn.disabled = true;
        
        try {
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

            await transactionManager.addTransaction(transactionData);
            showToast('Transacción agregada correctamente', 'success');
            
            // Limpiar formulario después de éxito
            document.getElementById('add-transaction-form').reset();
            document.getElementById('transaction-date').value = adjustDateForInput(new Date());
            
            // Actualizar dashboard después de un breve delay
            setTimeout(() => {
                if (window.auth && window.auth.currentUser) {
                    console.log('🔄 Actualizando dashboard después de agregar transacción...');
                    loadDashboard(window.auth.currentUser);
                }
            }, 1500);
            
        } catch (error) {
            console.error('Error guardando transacción:', error);
            showToast('Error al guardar la transacción: ' + error.message, 'danger');
        } finally {
            // Rehabilitar botón sin importar el resultado
            isSubmitting = false;
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    });
}

async function editTransaction(transactionId) {
    try {
        console.log('🔍 Editando transacción ID:', transactionId);
        
        // Prevenir múltiples clics
        if (window.isEditingTransaction) {
            console.log('⏳ Ya se está editando una transacción...');
            return;
        }
        window.isEditingTransaction = true;
        
        // Obtener la transacción
        const transactions = await transactionManager.getTransactions({});
        const transaction = transactions.find(t => t.id === transactionId);
        
        if (!transaction) {
            console.error('❌ Transacción no encontrada');
            showToast('Transacción no encontrada', 'danger');
            window.isEditingTransaction = false;
            return;
        }
        
        console.log('✅ Transacción encontrada:', transaction);
        console.log('📅 Fecha de la transacción:', transaction.date);
        console.log('📅 Tipo de fecha:', typeof transaction.date);
        
        // Mostrar formulario de edición
        showEditTransactionForm(transaction);
        
    } catch (error) {
        console.error('❌ Error al editar transacción:', error);
        showToast('Error al cargar la transacción: ' + error.message, 'danger');
    } finally {
        window.isEditingTransaction = false;
    }
}

async function deleteTransaction(transactionId) {
    // Prevenir múltiples clics
    if (window.isDeletingTransaction) {
        console.log('⏳ Ya se está eliminando una transacción...');
        return;
    }
    
    if (confirm('¿Estás seguro de que quieres eliminar esta transacción?')) {
        window.isDeletingTransaction = true;
        
        try {
            // Mostrar indicador de carga
            showToast('Eliminando transacción...', 'info');
            
            await transactionManager.deleteTransaction(transactionId);
            showToast('Transacción eliminada correctamente', 'success');
            
            // Actualizar dashboard después de un breve delay
            setTimeout(() => {
                if (window.auth && window.auth.currentUser) {
                    console.log('🔄 Actualizando dashboard después de eliminar transacción...');
                    loadDashboard(window.auth.currentUser);
                }
            }, 1500);
            
        } catch (error) {
            console.error('Error al eliminar transacción:', error);
            showToast('Error al eliminar la transacción: ' + error.message, 'danger');
        } finally {
            window.isDeletingTransaction = false;
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
                                <button type="submit" class="btn btn-primary btn-lg" id="update-transaction-btn">
                                    <i class="fas fa-save me-2"></i>Actualizar Transacción
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Variable para controlar el estado del envío
    let isUpdating = false;

    document.getElementById('edit-transaction-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Prevenir múltiples envíos
        if (isUpdating) {
            console.log('⏳ Actualización ya en proceso, ignorando clic...');
            return;
        }
        
        isUpdating = true;
        
        // Deshabilitar botón y mostrar estado de carga
        const updateBtn = document.getElementById('update-transaction-btn');
        const originalText = updateBtn.innerHTML;
        updateBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Actualizando...';
        updateBtn.disabled = true;
        
        try {
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

            await transactionManager.updateTransaction(transaction.id, transactionData);
            showToast('Transacción actualizada correctamente', 'success');
            
            // Actualizar dashboard después de un breve delay
            setTimeout(() => {
                if (window.auth && window.auth.currentUser) {
                    console.log('🔄 Actualizando dashboard después de editar transacción...');
                    loadDashboard(window.auth.currentUser);
                }
            }, 1500);
            
        } catch (error) {
            console.error('Error actualizando transacción:', error);
            showToast('Error al actualizar la transacción: ' + error.message, 'danger');
        } finally {
            // Rehabilitar botón sin importar el resultado
            isUpdating = false;
            updateBtn.innerHTML = originalText;
            updateBtn.disabled = false;
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
            if (window.auth && window.auth.currentUser) {
                loadDashboard(window.auth.currentUser);
            }
        } catch (error) {
            console.error('Error creando presupuesto:', error);
            showToast('Error al crear el presupuesto', 'danger');
        }
    });
}

function showProfile() {
    try {
        console.log('👤 Mostrando perfil...');
        
        // CORRECCIÓN: Usar firebase.auth() directamente
        const user = firebase.auth().currentUser;
        
        if (!user) {
            console.error('❌ Usuario no autenticado');
            showToast('Debes iniciar sesión para ver tu perfil', 'warning');
            loadLoginPage();
            return;
        }

        console.log('✅ Usuario para perfil:', user.email);
        
        // Cargar la página de perfil
        loadProfilePage(user);
        
    } catch (error) {
        console.error('❌ Error en showProfile:', error);
        showToast('Error al cargar el perfil: ' + error.message, 'danger');
    }
}

// FUNCIÓN AUXILIAR: Cargar página de perfil
// Función para cargar estadísticas del perfil - VERSIÓN CORREGIDA
async function loadProfileStats() {
    try {
        // CORRECCIÓN: Usar firebase.auth() directamente
        const user = firebase.auth().currentUser;
        if (!user) {
            console.log('⚠️ No hay usuario para cargar estadísticas');
            return;
        }

        console.log('📊 Cargando estadísticas para:', user.email);

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
        
        console.log('✅ Estadísticas cargadas:', {
            ahorros: totalSavings,
            transacciones: transactions.length
        });
        
    } catch (error) {
        console.error('Error loading profile stats:', error);
    }
}

// FUNCIÓN FALTANTE: Inicializar rueda de la vida
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
    if (!sliderContainer) {
        console.error('❌ sliderContainer no encontrado');
        return;
    }
    
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
    const ctx = document.getElementById('lifeWheel');
    if (!ctx) {
        console.error('❌ Canvas lifeWheel no encontrado');
        return;
    }

    const chartCtx = ctx.getContext('2d');
    window.lifeWheelChart = new Chart(chartCtx, {
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

// FUNCIONES FALTANTES PARA LA RUEDA DE LA VIDA
function updateWheelChart(index, value) {
    const valueElement = document.getElementById(`value${index}`);
    if (valueElement) {
        valueElement.textContent = value;
    }
    
    if (window.lifeWheelChart) {
        window.lifeWheelChart.data.datasets[0].data[index] = parseInt(value);
        window.lifeWheelChart.update();
    }
}

function saveWheelProgress() {
    if (window.lifeWheelChart) {
        const values = window.lifeWheelChart.data.datasets[0].data;
        // CORRECCIÓN: Usar firebase.auth() directamente
        const user = firebase.auth().currentUser;
        if (user) {
            try {
                localStorage.setItem(`wheelValues_${user.uid}`, JSON.stringify(values));
                showToast('Progreso guardado correctamente', 'success');
            } catch (error) {
                console.error('❌ Error guardando progreso:', error);
                showToast('Error al guardar el progreso', 'danger');
            }
        }
    }
}

function loadWheelProgress() {
    // CORRECCIÓN: Usar firebase.auth() directamente
    const user = firebase.auth().currentUser;
    if (user && window.lifeWheelChart) {
        try {
            const savedValues = localStorage.getItem(`wheelValues_${user.uid}`);
            if (savedValues) {
                const values = JSON.parse(savedValues);
                window.lifeWheelChart.data.datasets[0].data = values;
                
                // Actualizar los sliders
                values.forEach((value, index) => {
                    const slider = document.getElementById(`slider${index}`);
                    const valueDisplay = document.getElementById(`value${index}`);
                    
                    if (slider) slider.value = value;
                    if (valueDisplay) valueDisplay.textContent = value;
                });
                
                window.lifeWheelChart.update();
                showToast('Progreso cargado correctamente', 'success');
            } else {
                showToast('No hay progreso guardado', 'info');
            }
        } catch (error) {
            console.error('❌ Error cargando progreso:', error);
            showToast('Error al cargar el progreso', 'danger');
        }
    }
}

// FUNCIÓN AUXILIAR: Cargar página de perfil
function loadProfilePage(user) {
    const content = document.getElementById('content');
    
    content.innerHTML = `
        <div class="container mt-4">
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
                                <button class="btn btn-secondary" onclick="loadDashboard(firebase.auth().currentUser)">
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

function showNotificationPanel() {
    const content = document.getElementById('content');
    
    // VERIFICACIONES DE SEGURIDAD MEJORADAS
    if (!content) {
        console.error('❌ Elemento content no encontrado');
        return;
    }
    
    // Verificar que notificationManager existe y tiene los métodos necesarios
    const hasNotificationManager = window.notificationManager && 
                                 typeof window.notificationManager === 'object';
    
    const hasGetStatus = hasNotificationManager && 
                        typeof window.notificationManager.getStatus === 'function';
    
    const hasTestNotification = hasNotificationManager && 
                              typeof window.notificationManager.testNotification === 'function';
    
    const hasTestUpcomingTransactions = hasNotificationManager && 
                                      typeof window.notificationManager.testUpcomingTransactions === 'function';
    
    const hasRequestPermission = hasNotificationManager && 
                               typeof window.notificationManager.requestPermission === 'function';
    
    const hasRestart = hasNotificationManager && 
                      typeof window.notificationManager.restart === 'function';
    
    // Obtener estado de forma segura
    let status;
    try {
        status = hasGetStatus ? 
                window.notificationManager.getStatus() : 
                { 
                    error: "NotificationManager no disponible",
                    permission: "unknown",
                    initialized: false,
                    browserSupport: 'Notification' in window
                };
    } catch (error) {
        console.error('❌ Error obteniendo estado de notificaciones:', error);
        status = { 
            error: "Error al obtener estado: " + error.message,
            permission: "error",
            initialized: false 
        };
    }
    
    // Verificar autenticación de forma segura
    const isAuthenticated = window.auth && window.auth.currentUser;
    const userEmail = isAuthenticated ? window.auth.currentUser.email : 'No autenticado';
    
    // Determinar modo (prueba/producción)
    const isTestMode = window.location.hostname === 'localhost' || 
                      window.location.hostname === '127.0.0.1' ||
                      window.location.search.includes('test=true');
    
    content.innerHTML = `
        <div class="container mt-4">
            <div class="row justify-content-center">
                <div class="col-md-10">
                    <div class="card shadow">
                        <div class="card-header bg-primary text-white d-flex justify-content-between align-items-center">
                            <h4 class="mb-0">
                                <i class="fas fa-bell me-2"></i>Panel de Control - Notificaciones
                            </h4>
                            <span class="badge ${isTestMode ? 'bg-warning' : 'bg-success'}">
                                ${isTestMode ? 'MODO PRUEBA' : 'MODO PRODUCCIÓN'}
                            </span>
                        </div>
                        <div class="card-body">
                            <!-- Estado Actual -->
                            <div class="alert ${hasNotificationManager ? 'alert-info' : 'alert-warning'}">
                                <h5 class="d-flex align-items-center">
                                    <i class="fas fa-info-circle me-2"></i>
                                    Estado Actual del Sistema de Notificaciones
                                    ${!hasNotificationManager ? 
                                        '<span class="badge bg-danger ms-2">NO DISPONIBLE</span>' : 
                                        ''
                                    }
                                </h5>
                                <div class="mt-3">
                                    <pre class="bg-dark text-light p-3 rounded" style="font-size: 0.85rem; max-height: 300px; overflow-y: auto;">${JSON.stringify(status, null, 2)}</pre>
                                </div>
                            </div>
                            
                            <!-- Tarjetas de Control -->
                            <div class="row mb-4">
                                <!-- Pruebas de Notificación -->
                                <div class="col-md-6 mb-3">
                                    <div class="card h-100">
                                        <div class="card-header bg-success text-white d-flex align-items-center">
                                            <i class="fas fa-vial me-2"></i>
                                            <h6 class="mb-0">Pruebas de Notificación</h6>
                                        </div>
                                        <div class="card-body">
                                            <button class="btn btn-success w-100 mb-2" 
                                                    onclick="handleTestNotification()"
                                                    ${!hasTestNotification ? 'disabled' : ''}>
                                                <i class="fas fa-bell me-2"></i>
                                                Probar Notificación Simple
                                                ${!hasTestNotification ? '<span class="badge bg-secondary ms-2">No disponible</span>' : ''}
                                            </button>
                                            <button class="btn btn-warning w-100" 
                                                    onclick="handleTestUpcomingTransactions()"
                                                    ${!hasTestUpcomingTransactions ? 'disabled' : ''}>
                                                <i class="fas fa-clock me-2"></i>
                                                Probar Transacciones Próximas
                                                ${!hasTestUpcomingTransactions ? '<span class="badge bg-secondary ms-2">No disponible</span>' : ''}
                                            </button>
                                            <div class="mt-2">
                                                <small class="text-muted">
                                                    Prueba el sistema de notificaciones con estos ejemplos
                                                </small>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                
                                <!-- Gestión del Sistema -->
                                <div class="col-md-6 mb-3">
                                    <div class="card h-100">
                                        <div class="card-header bg-warning text-dark d-flex align-items-center">
                                            <i class="fas fa-cog me-2"></i>
                                            <h6 class="mb-0">Gestión del Sistema</h6>
                                        </div>
                                        <div class="card-body">
                                            <button class="btn btn-info w-100 mb-2" 
                                                    onclick="handleRequestPermission()"
                                                    ${!hasRequestPermission ? 'disabled' : ''}>
                                                <i class="fas fa-sync-alt me-2"></i>
                                                Solicitar Permisos
                                                ${!hasRequestPermission ? '<span class="badge bg-secondary ms-2">No disponible</span>' : ''}
                                            </button>
                                            <button class="btn btn-secondary w-100 mb-2" 
                                                    onclick="handleRestartNotifications()"
                                                    ${!hasRestart ? 'disabled' : ''}>
                                                <i class="fas fa-redo me-2"></i>
                                                Reiniciar Notificaciones
                                                ${!hasRestart ? '<span class="badge bg-secondary ms-2">No disponible</span>' : ''}
                                            </button>
                                            <button class="btn btn-outline-dark w-100" 
                                                    onclick="showDebugInfo()">
                                                <i class="fas fa-bug me-2"></i>
                                                Información de Depuración
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Información de Configuración -->
                            <div class="card mb-4">
                                <div class="card-header bg-secondary text-white d-flex align-items-center">
                                    <i class="fas fa-sliders-h me-2"></i>
                                    <h6 class="mb-0">Configuración Actual</h6>
                                </div>
                                <div class="card-body">
                                    <div class="row">
                                        <div class="col-md-6">
                                            <ul class="list-group">
                                                <li class="list-group-item d-flex justify-content-between align-items-center">
                                                    <strong>Modo de Operación:</strong> 
                                                    <span class="badge ${isTestMode ? 'bg-warning' : 'bg-success'}">
                                                        ${isTestMode ? 'PRUEBAS' : 'PRODUCCIÓN'}
                                                    </span>
                                                </li>
                                                <li class="list-group-item d-flex justify-content-between align-items-center">
                                                    <strong>Recordatorio Diario:</strong> 
                                                    <span class="text-end">
                                                        ${isTestMode ? 'Cada 2 minutos' : 'Cada 24 horas (6 PM)'}
                                                    </span>
                                                </li>
                                                <li class="list-group-item d-flex justify-content-between align-items-center">
                                                    <strong>Verificación Transacciones:</strong> 
                                                    <span class="text-end">
                                                        ${isTestMode ? 'Cada 2 minutos' : 'Cada 1 hora'}
                                                    </span>
                                                </li>
                                            </ul>
                                        </div>
                                        <div class="col-md-6">
                                            <ul class="list-group">
                                                <li class="list-group-item d-flex justify-content-between align-items-center">
                                                    <strong>Usuario Autenticado:</strong> 
                                                    <span class="badge ${isAuthenticated ? 'bg-success' : 'bg-danger'}">
                                                        ${isAuthenticated ? 'SÍ' : 'NO'}
                                                    </span>
                                                </li>
                                                <li class="list-group-item">
                                                    <strong>Email:</strong> 
                                                    <div class="text-truncate" title="${userEmail}">
                                                        ${userEmail}
                                                    </div>
                                                </li>
                                                <li class="list-group-item d-flex justify-content-between align-items-center">
                                                    <strong>Navegador:</strong> 
                                                    <span>${navigator.userAgent.split(' ')[0]}</span>
                                                </li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Información de Compatibilidad -->
                            <div class="card mb-4">
                                <div class="card-header bg-dark text-white">
                                    <h6 class="mb-0">
                                        <i class="fas fa-check-circle me-2"></i>Compatibilidad del Navegador
                                    </h6>
                                </div>
                                <div class="card-body">
                                    <div class="row text-center">
                                        <div class="col-md-3 mb-2">
                                            <div class="p-2 ${'Notification' in window ? 'bg-success text-white' : 'bg-danger text-white'} rounded">
                                                <i class="fas ${'Notification' in window ? 'fa-check' : 'fa-times'} fa-lg mb-2"></i><br>
                                                <small>Notifications API</small>
                                            </div>
                                        </div>
                                        <div class="col-md-3 mb-2">
                                            <div class="p-2 ${'serviceWorker' in navigator ? 'bg-success text-white' : 'bg-danger text-white'} rounded">
                                                <i class="fas ${'serviceWorker' in navigator ? 'fa-check' : 'fa-times'} fa-lg mb-2"></i><br>
                                                <small>Service Worker</small>
                                            </div>
                                        </div>
                                        <div class="col-md-3 mb-2">
                                            <div class="p-2 ${'localStorage' in window ? 'bg-success text-white' : 'bg-danger text-white'} rounded">
                                                <i class="fas ${'localStorage' in window ? 'fa-check' : 'fa-times'} fa-lg mb-2"></i><br>
                                                <small>Local Storage</small>
                                            </div>
                                        </div>
                                        <div class="col-md-3 mb-2">
                                            <div class="p-2 ${typeof firebase !== 'undefined' ? 'bg-success text-white' : 'bg-danger text-white'} rounded">
                                                <i class="fas ${typeof firebase !== 'undefined' ? 'fa-check' : 'fa-times'} fa-lg mb-2"></i><br>
                                                <small>Firebase</small>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Botones de Navegación -->
                            <div class="text-center">
                                <button class="btn btn-primary me-2" onclick="loadDashboard(auth.currentUser)">
                                    <i class="fas fa-arrow-left me-2"></i>Volver al Dashboard
                                </button>
                                <button class="btn btn-outline-secondary" onclick="location.reload()">
                                    <i class="fas fa-redo me-2"></i>Recargar Página
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// FUNCIONES UTILITARIAS
function showLoading(show) {
    const loadingSpinner = document.getElementById('loading-spinner');
    if (loadingSpinner) {
        loadingSpinner.style.display = show ? 'block' : 'none';
    }
}

// FUNCIÓN TOAST MEJORADA - Reemplaza la función showToast existente
function showToast(message, type = 'info') {
    // Destruir toasts de Bootstrap existentes primero
    const existingToasts = document.querySelectorAll('.custom-toast');
    existingToasts.forEach(toast => toast.remove());
    
    const toastContainer = document.getElementById('toast-container');
    if (!toastContainer) {
        console.error('❌ Toast container no encontrado');
        return;
    }

    const toastId = 'toast-' + Date.now();
    
    // Definir íconos y colores según el tipo
    const toastConfig = {
        success: {
            icon: '<path d="M15.795 8.342l-5.909 9.545a1 1 0 0 1-1.628 0l-3.182-4.909a1 1 0 0 1 1.629-1.165l2.556 3.953L14.165 7.51a1 1 0 0 1 1.63 1.165z"></path>',
            bgColor: '#10b981'
        },
        error: {
            icon: '<path d="M12 2c5.514 0 10 4.486 10 10s-4.486 10-10 10-10-4.486-10-10 4.486-10 10-10zm0-2c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm-1 15h2v2h-2v-2zm0-10h2v8h-2v-8z"></path>',
            bgColor: '#ef4444'
        },
        warning: {
            icon: '<path d="M12 2c5.514 0 10 4.486 10 10s-4.486 10-10 10-10-4.486-10-10 4.486-10 10-10zm0-2c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm-1 15h2v2h-2v-2zm0-10h2v8h-2v-8z"></path>',
            bgColor: '#f59e0b'
        },
        info: {
            icon: '<path d="M12 2c5.514 0 10 4.486 10 10s-4.486 10-10 10-10-4.486-10-10 4.486-10 10-10zm0-2c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm1 15h-2v-6h2v6zm0-8h-2v-2h2v2z"></path>',
            bgColor: '#3b82f6'
        },
        danger: {
            icon: '<path d="M12 2c5.514 0 10 4.486 10 10s-4.486 10-10 10-10-4.486-10-10 4.486-10 10-10zm0-2c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm-1 15h2v2h-2v-2zm0-10h2v8h-2v-8z"></path>',
            bgColor: '#dc3545'
        }
    };

    const config = toastConfig[type] || toastConfig.info;

    const toastHTML = `
        <div id="${toastId}" class="custom-toast" style="background-color: ${config.bgColor}">
            <div class="toast-content">
                ${message}
            </div>
            <div class="toast-icon">
                <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    ${config.icon}
                </svg>
            </div>
        </div>
    `;
    
    toastContainer.innerHTML += toastHTML;
    
    const toastElement = document.getElementById(toastId);
    
    // Mostrar toast con animación
    setTimeout(() => {
        toastElement.classList.add('show');
    }, 100);
    
    // Auto-remover después de 4 segundos
    setTimeout(() => {
        toastElement.classList.remove('show');
        setTimeout(() => {
            if (toastElement.parentNode) {
                toastElement.remove();
            }
        }, 300);
    }, 4000);
    
    return toastElement;
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

// FUNCIONES DE AUTENTICACIÓN
async function loginWithEmail(email, password) {
    showLoading(true);
    try {
        const authInstance = window.auth || auth;
        const userCredential = await authInstance.signInWithEmailAndPassword(email, password);
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
        const authInstance = window.auth || auth;
        const userCredential = await authInstance.createUserWithEmailAndPassword(email, password);
        const user = userCredential.user;
        
        // Actualizar perfil con el nombre de usuario
        await user.updateProfile({
            displayName: username
        });
        
        console.log('✅ Usuario registrado:', user.email);
        showToast('¡Cuenta creada exitosamente!', 'success');
        
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
        const authInstance = window.auth || auth;
        const provider = new firebase.auth.GoogleAuthProvider();
        provider.addScope('profile');
        provider.addScope('email');
        
        const result = await authInstance.signInWithPopup(provider);
        console.log('✅ Login con Google exitoso:', result.user.email);
        showToast('¡Bienvenido!', 'success');
    } catch (error) {
        console.error('❌ Error en login con Google:', error);
        showToast('Error al iniciar sesión con Google', 'danger');
    } finally {
        showLoading(false);
    }
}

function closeNavbar() {
    const navbarToggler = document.querySelector('.navbar-toggler');
    const navbarCollapse = document.getElementById('navbarNav');
    
    if (navbarToggler && navbarCollapse && navbarCollapse.classList.contains('show')) {
        // Cerrar el menú colapsable
        const bsCollapse = new bootstrap.Collapse(navbarCollapse, {
            toggle: false
        });
        bsCollapse.hide();
        console.log('📱 Menú de navegación cerrado');
    }
}

async function logout() {
    try {
        console.log('🚪 Cerrando sesión...');
        
        // Cerrar sesión en Firebase
        await firebase.auth().signOut();
        console.log('✅ Sesión cerrada en Firebase');
        
        // Limpiar datos locales
        localStorage.clear();
        console.log('✅ localStorage limpiado');
        
        // Mostrar mensaje
        showToast('Sesión cerrada correctamente', 'info');
        
        // Recargar la página para limpiar completamente el estado
        setTimeout(() => {
            console.log('🔄 Recargando página...');
            location.reload();
        }, 1500);
        
    } catch (error) {
        console.error('❌ Error al cerrar sesión:', error);
        showToast('Error al cerrar sesión: ' + error.message, 'danger');
    }
}



// ==================== EVENT LISTENERS GLOBALES ====================

// Cerrar menú al hacer click fuera de él
document.addEventListener('click', function(e) {
    const navbar = document.getElementById('navbarNav');
    const toggler = document.querySelector('.navbar-toggler');
    
    if (navbar && navbar.classList.contains('show') && 
        !navbar.contains(e.target) && 
        !toggler.contains(e.target)) {
        closeNavbar();
    }
});

// MANEJO DE ERRORES GLOBAL
window.addEventListener('error', function(event) {
    console.error('❌ Error global capturado:', event.error);
    if (typeof showToast === 'function') {
        showToast('Ocurrió un error inesperado', 'danger');
    }
});

window.addEventListener('unhandledrejection', function(event) {
    console.error('❌ Promise rechazada no manejada:', event.reason);
    if (typeof showToast === 'function') {
        showToast('Error en operación asíncrona', 'danger');
    }
});