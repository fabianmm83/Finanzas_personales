const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();


// Función para obtener transacciones del usuario - VERSIÓN CON SERIALIZACIÓN CORRECTA
exports.getUserTransactions = functions.https.onCall(async (data, context) => {
    try {
        console.log("🔍 Iniciando getUserTransactions");
        
        if (!context.auth) {
            console.log("❌ Usuario no autenticado");
            throw new functions.https.HttpsError('unauthenticated', 'Usuario no autenticado');
        }

        const userId = context.auth.uid;
        const { month, year, type, category } = data;

        console.log(`📊 Solicitando transacciones para usuario: ${userId}`, { month, year, type, category });

        let query = admin.firestore().collection('transactions')
            .where('userId', '==', userId);

        console.log("🔧 Construyendo consulta...");

        // CORRECCIÓN: Usar Timestamp para filtros de fecha
        if (month && year) {
            const startDate = new Date(year, month - 1, 1);
            const endDate = new Date(year, month, 0, 23, 59, 59);
            
            console.log(`📅 Filtrando por fecha: ${startDate} a ${endDate}`);
            
            try {
                query = query.where('date', '>=', admin.firestore.Timestamp.fromDate(startDate))
                            .where('date', '<=', admin.firestore.Timestamp.fromDate(endDate));
            } catch (dateError) {
                console.error("❌ Error con filtro de fecha:", dateError);
            }
        }

        // Ordenar por fecha
        query = query.orderBy('date', 'desc');

        console.log("🚀 Ejecutando consulta...");
        const snapshot = await query.get();
        console.log(`✅ Consulta exitosa, ${snapshot.size} documentos encontrados`);

        let transactions = snapshot.docs.map(doc => {
            const data = doc.data();
            
            // DEBUG: Ver qué contiene data.date
            console.log('📅 data.date original:', data.date);
            console.log('📅 Tipo de data.date:', typeof data.date);
            console.log('📅 data.date tiene toDate?:', data.date && typeof data.date.toDate === 'function');
            console.log('📅 data.date tiene _seconds?:', data.date && data.date._seconds);
            
            // CORRECCIÓN CRÍTICA: Serializar la fecha correctamente
            let transactionDate;
            let dateSerialized = null;
            
            if (data.date && typeof data.date.toDate === 'function') {
                // Si es un Timestamp de Firestore
                transactionDate = data.date.toDate();
                dateSerialized = transactionDate.toISOString(); // Serializar a ISO string
                console.log('✅ Convertido de Timestamp.toDate() y serializado');
            } else if (data.date && data.date._seconds) {
                // Si es un Timestamp serializado
                transactionDate = new Date(data.date._seconds * 1000);
                dateSerialized = transactionDate.toISOString(); // Serializar a ISO string
                console.log('✅ Convertido de _seconds y serializado');
            } else if (data.date instanceof Date) {
                // Si ya es una Date
                transactionDate = data.date;
                dateSerialized = transactionDate.toISOString(); // Serializar a ISO string
                console.log('✅ Ya era una Date, serializada');
            } else {
                console.error('❌ No se pudo procesar la fecha:', data.date);
                transactionDate = new Date(); // Fallback
                dateSerialized = transactionDate.toISOString();
            }

            // Crear el objeto de transacción CON LA FECHA SERIALIZADA
            const transaction = {
                id: doc.id,
                type: data.type,
                category: data.category,
                amount: data.amount,
                description: data.description || '',
                userId: data.userId,
                date: dateSerialized, // ENVIAR COMO STRING SERIALIZADO
                dateObject: transactionDate // Para debug
            };

            console.log('📊 Transacción procesada:', {
                id: transaction.id,
                fechaSerializada: transaction.date,
                fechaLegible: new Date(transaction.date).toLocaleDateString('es-ES'),
                tipo: transaction.type
            });

            return transaction;
        });

        // Aplicar filtros adicionales en memoria
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
        return {
            success: false,
            transactions: [],
            error: error.message
        };
    }
});

// functions/index.js - addTransaction mejorada
exports.addTransaction = functions.https.onCall(async (data, context) => {
    try {
        if (!context.auth) {
            throw new functions.https.HttpsError('unauthenticated', 'Usuario no autenticado');
        }

        const userId = context.auth.uid;
        const { type, amount, category, date, description } = data;

        console.log(`➕ Agregando transacción para usuario: ${userId}`, data);

        // Validar y procesar fecha
        const transactionDate = new Date(date);
        if (isNaN(transactionDate.getTime())) {
            console.error('❌ FECHA INVÁLIDA recibida del frontend:', date);
            throw new functions.https.HttpsError('invalid-argument', 'La fecha proporcionada no es válida');
        }

        console.log('✅ Fecha validada correctamente:', transactionDate.toLocaleDateString('es-ES'));

        const transaction = {
            userId: userId,
            type: type,
            category: category,
            amount: parseFloat(amount),
            date: admin.firestore.Timestamp.fromDate(transactionDate),
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