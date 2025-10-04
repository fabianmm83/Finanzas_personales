const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

// Función para obtener transacciones del usuario
exports.getUserTransactions = functions.https.onCall(async (data, context) => {
    // Verificar autenticación
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Usuario no autenticado');
    }

    const userId = context.auth.uid;
    const { month, year, type, category } = data;

    try {
        let query = admin.firestore().collection('transactions')
            .where('userId', '==', userId);

        // Aplicar filtros
        if (month && year) {
            const startDate = new Date(year, month - 1, 1);
            const endDate = new Date(year, month, 0, 23, 59, 59);
            
            query = query.where('date', '>=', startDate)
                        .where('date', '<=', endDate);
        }

        if (type) {
            query = query.where('type', '==', type);
        }

        if (category) {
            query = query.where('category', '==', category);
        }

        const snapshot = await query.orderBy('date', 'desc').get();
        const transactions = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            // Convertir Timestamp a Date para el frontend
            date: doc.data().date.toDate()
        }));

        return {
            success: true,
            transactions: transactions
        };

    } catch (error) {
        console.error('Error en getUserTransactions:', error);
        throw new functions.https.HttpsError('internal', 'Error al obtener transacciones');
    }
});

// Función para agregar transacción
exports.addTransaction = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Usuario no autenticado');
    }

    const userId = context.auth.uid;
    const { type, amount, category, date, description } = data;

    try {
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

        return {
            success: true,
            id: docRef.id,
            message: 'Transacción agregada correctamente'
        };

    } catch (error) {
        console.error('Error en addTransaction:', error);
        throw new functions.https.HttpsError('internal', 'Error al agregar transacción');
    }
});

// Función para obtener dashboard data
exports.getDashboardData = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Usuario no autenticado');
    }

    const userId = context.auth.uid;
    const { month, year } = data;

    try {
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0, 23, 59, 59);

        const snapshot = await admin.firestore().collection('transactions')
            .where('userId', '==', userId)
            .where('date', '>=', startDate)
            .where('date', '<=', endDate)
            .orderBy('date', 'desc')
            .get();

        const transactions = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            date: doc.data().date.toDate()
        }));

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
        console.error('Error en getDashboardData:', error);
        throw new functions.https.HttpsError('internal', 'Error al obtener datos del dashboard');
    }
});