// functions/src/routes/transactions.js
exports.addTransaction = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Usuario no autenticado');
    }
    
    try {
        const transaction = new Transaction({
            ...data,
            userId: context.auth.uid
        });
        
        const docRef = await admin.firestore()
            .collection('transactions')
            .add(transaction.toFirestore());
            
        return {
            success: true,
            message: 'Transacción registrada con éxito',
            transaction: {
                id: docRef.id,
                ...transaction.toFirestore()
            }
        };
        
    } catch (error) {
        throw new functions.https.HttpsError('internal', error.message);
    }
});

exports.getDashboardData = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Usuario no autenticado');
    }
    
    const { month, year } = data;
    const userId = context.auth.uid;
    
    try {
        // Obtener transacciones del mes
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0);
        
        const transactionsSnapshot = await admin.firestore()
            .collection('transactions')
            .where('userId', '==', userId)
            .where('date', '>=', startDate)
            .where('date', '<=', endDate)
            .orderBy('date', 'desc')
            .get();
            
        const transactions = transactionsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        
        // Calcular totales
        const totalIncome = transactions
            .filter(t => t.type === 'i')
            .reduce((sum, t) => sum + t.amount, 0);
            
        const totalExpense = transactions
            .filter(t => t.type === 'g')
            .reduce((sum, t) => sum + t.amount, 0);
            
        // Agrupar por categorías
        const incomeByCategory = {};
        const expenseByCategory = {};
        
        transactions.forEach(t => {
            if (t.type === 'i') {
                incomeByCategory[t.category] = (incomeByCategory[t.category] || 0) + t.amount;
            } else {
                expenseByCategory[t.category] = (expenseByCategory[t.category] || 0) + t.amount;
            }
        });
        
        return {
            transactions,
            summary: {
                totalIncome,
                totalExpense,
                balance: totalIncome - totalExpense
            },
            categories: {
                income: incomeByCategory,
                expense: expenseByCategory
            }
        };
        
    } catch (error) {
        throw new functions.https.HttpsError('internal', error.message);
    }
});