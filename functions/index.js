const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

// Función para obtener transacciones del usuario
exports.getUserTransactions = functions.https.onCall(async (data, context) => {
    try {
        console.log("🔍 Iniciando getUserTransactions");
        
        // Verificar autenticación
        if (!context.auth) {
            console.log("❌ Usuario no autenticado");
            throw new functions.https.HttpsError('unauthenticated', 'Usuario no autenticado');
        }

        const userId = context.auth.uid;
        const { month, year, type, category } = data;

        console.log(`📊 Solicitando transacciones para usuario: ${userId}`, { month, year, type, category });

        // CONSULTA SIMPLIFICADA - Primero solo por usuario
        let query = admin.firestore().collection('transactions')
            .where('userId', '==', userId);

        console.log("🔧 Construyendo consulta...");

        // Si hay filtros de fecha, usar el índice
        if (month && year) {
            const startDate = new Date(year, month - 1, 1);
            const endDate = new Date(year, month, 0, 23, 59, 59);
            
            console.log(`📅 Filtrando por fecha: ${startDate} a ${endDate}`);
            
            try {
                query = query.where('date', '>=', startDate)
                            .where('date', '<=', endDate);
            } catch (dateError) {
                console.error("❌ Error con filtro de fecha:", dateError);
                // Continuar sin filtro de fecha
            }
        }

        // Ordenar por fecha
        query = query.orderBy('date', 'desc');

        console.log("🚀 Ejecutando consulta...");
        const snapshot = await query.get();
        console.log(`✅ Consulta exitosa, ${snapshot.size} documentos encontrados`);

        let transactions = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                // Convertir Timestamp a Date
                date: data.date.toDate ? data.date.toDate() : data.date
            };
        });

        // Aplicar filtros adicionales en memoria si es necesario
        if (type) {
            transactions = transactions.filter(transaction => transaction.type === type);
            console.log(`🔍 Filtrado por tipo '${type}': ${transactions.length} transacciones`);
        }

        if (category) {
            transactions = transactions.filter(transaction => transaction.category === category);
            console.log(`🔍 Filtrado por categoría '${category}': ${transactions.length} transacciones`);
        }

        console.log(`🎯 Total de transacciones a enviar: ${transactions.length}`);

        return {
            success: true,
            transactions: transactions
        };

    } catch (error) {
        console.error('❌ Error CRÍTICO en getUserTransactions:', error);
        console.error('Detalles del error:', {
            code: error.code,
            message: error.message,
            details: error.details
        });
        
        // Devolver array vacío en lugar de error para que el frontend funcione
        return {
            success: false,
            transactions: [],
            error: error.message
        };
    }
});

// Función para agregar transacción
exports.addTransaction = functions.https.onCall(async (data, context) => {
    try {
        if (!context.auth) {
            throw new functions.https.HttpsError('unauthenticated', 'Usuario no autenticado');
        }

        const userId = context.auth.uid;
        const { type, amount, category, date, description } = data;

        console.log(`➕ Agregando transacción para usuario: ${userId}`, data);

        const transaction = {
            userId: userId,
            type: type,
            category: category,
            amount: parseFloat(amount),
            date: admin.firestore.Timestamp.fromDate(new Date(date)),
            description: description || '',
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        };

        const docRef = await admin.firestore().collection('transactions').add(transaction);

        console.log(`✅ Transacción creada con ID: ${docRef.id}`);

        return {
            success: true,
            id: docRef.id,
            message: 'Transacción agregada correctamente'
        };

    } catch (error) {
        console.error('❌ Error en addTransaction:', error);
        throw new functions.https.HttpsError('internal', 'Error al agregar transacción: ' + error.message);
    }
});

// Función para obtener dashboard data
exports.getDashboardData = functions.https.onCall(async (data, context) => {
    try {
        if (!context.auth) {
            throw new functions.https.HttpsError('unauthenticated', 'Usuario no autenticado');
        }

        const userId = context.auth.uid;
        const { month, year } = data;

        console.log(`📈 Obteniendo dashboard para usuario: ${userId}, mes: ${month}, año: ${year}`);

        // Usar getUserTransactions para obtener los datos
        const transactionsResult = await exports.getUserTransactions({ 
            month, year 
        }, context);

        if (!transactionsResult.success) {
            throw new functions.https.HttpsError('internal', 'Error al obtener transacciones para dashboard');
        }

        const transactions = transactionsResult.transactions;

        const totalIncome = transactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + t.amount, 0);
            
        const totalExpense = transactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + t.amount, 0);

        // Agrupar por categorías
        const incomeByCategory = {};
        const expenseByCategory = {};
        
        transactions.forEach(t => {
            if (t.type === 'income') {
                incomeByCategory[t.category] = (incomeByCategory[t.category] || 0) + t.amount;
            } else {
                expenseByCategory[t.category] = (expenseByCategory[t.category] || 0) + t.amount;
            }
        });

        console.log(`✅ Dashboard calculado: ${transactions.length} transacciones`);

        return {
            success: true,
            data: {
                transactions,
                summary: {
                    totalIncome,
                    totalExpense,
                    balance: totalIncome - totalExpense,
                    transactionCount: transactions.length,
                    month,
                    year
                },
                categories: {
                    income: incomeByCategory,
                    expense: expenseByCategory
                }
            }
        };

    } catch (error) {
        console.error('❌ Error en getDashboardData:', error);
        throw new functions.https.HttpsError('internal', 'Error al obtener datos del dashboard: ' + error.message);
    }
});