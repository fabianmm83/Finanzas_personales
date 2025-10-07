const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();


// Función para obtener transacciones del usuario - VERSIÓN COMPLETAMENTE CORREGIDA
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
            
            // CORRECCIÓN MEJORADA: Procesar la fecha de manera más robusta
            let transactionDate;
            
            if (data.date && typeof data.date.toDate === 'function') {
                // Si es un Timestamp de Firestore
                transactionDate = data.date.toDate();
                console.log('✅ Convertido de Timestamp.toDate()');
            } else if (data.date && data.date._seconds) {
                // Si es un Timestamp serializado
                transactionDate = new Date(data.date._seconds * 1000);
                console.log('✅ Convertido de _seconds');
            } else if (data.date instanceof Date) {
                // Si ya es una Date
                transactionDate = data.date;
                console.log('✅ Ya era una Date');
            } else if (data.date) {
                // Intentar convertir de cualquier otra forma
                try {
                    transactionDate = new Date(data.date);
                    if (isNaN(transactionDate.getTime())) {
                        throw new Error('Fecha inválida');
                    }
                    console.log('✅ Convertido de formato genérico');
                } catch (e) {
                    console.error('❌ No se pudo convertir la fecha:', data.date);
                    transactionDate = new Date(); // Fallback
                }
            } else {
                console.error('❌ data.date está vacío o undefined');
                transactionDate = new Date(); // Fallback
            }

            // Crear el objeto de transacción SIN sobrescribir data
            const transaction = {
                id: doc.id,
                type: data.type,
                category: data.category,
                amount: data.amount,
                description: data.description || '',
                userId: data.userId,
                date: transactionDate // Usar la fecha procesada
            };

            console.log('📊 Transacción procesada:', {
                id: transaction.id,
                fechaProcesada: transactionDate.toLocaleDateString('es-ES'),
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

        // DEBUG FINAL: Verificar que las fechas están correctas
        console.log('🎯 TRANSACCIONES FINALES A ENVIAR:');
        transactions.forEach((t, i) => {
            console.log(`Transacción ${i}:`, {
                id: t.id,
                fecha: t.date.toLocaleDateString('es-ES'),
                tipo: t.type,
                categoria: t.category
            });
        });

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

// Función para agregar transacción - VERSIÓN COMPLETAMENTE CORREGIDA
exports.addTransaction = functions.https.onCall(async (data, context) => {
    try {
        if (!context.auth) {
            throw new functions.https.HttpsError('unauthenticated', 'Usuario no autenticado');
        }

        const userId = context.auth.uid;
        const { type, amount, category, date, description } = data;

        console.log(`➕ Agregando transacción para usuario: ${userId}`, data);

        // DEBUG DETALLADO de la fecha que llega
        console.log('📅 FECHA RECIBIDA DEL FRONTEND - ANÁLISIS COMPLETO:');
        console.log('   - date (raw):', date);
        console.log('   - tipo de date:', typeof date);
        console.log('   - como Date:', new Date(date));
        console.log('   - timestamp:', new Date(date).getTime());
        console.log('   - fecha legible:', new Date(date).toLocaleDateString('es-ES'));
        console.log('   - es válida?:', !isNaN(new Date(date).getTime()));

        // VALIDACIÓN CRÍTICA: Verificar que la fecha es válida
        const transactionDate = new Date(date);
        if (isNaN(transactionDate.getTime())) {
            console.error('❌ FECHA INVÁLIDA recibida del frontend:', date);
            throw new functions.https.HttpsError('invalid-argument', 'La fecha proporcionada no es válida');
        }

        console.log('✅ Fecha validada correctamente:', transactionDate.toLocaleDateString('es-ES'));

        // CORRECCIÓN: Crear el Timestamp de Firestore CORRECTAMENTE
        const firestoreTimestamp = admin.firestore.Timestamp.fromDate(transactionDate);
        
        console.log('🔥 Timestamp de Firestore creado:', {
            seconds: firestoreTimestamp.seconds,
            nanoseconds: firestoreTimestamp.nanoseconds,
            comoDate: firestoreTimestamp.toDate().toLocaleDateString('es-ES')
        });

        const transaction = {
            userId: userId,
            type: type,
            category: category,
            amount: parseFloat(amount),
            date: firestoreTimestamp, // Usar el Timestamp correcto
            description: description || '',
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        };

        console.log('💾 TRANSACCIÓN COMPLETA A GUARDAR:');
        console.log('   - ID usuario:', transaction.userId);
        console.log('   - Tipo:', transaction.type);
        console.log('   - Categoría:', transaction.category);
        console.log('   - Monto:', transaction.amount);
        console.log('   - Fecha (Timestamp):', transaction.date);
        console.log('   - Fecha (legible):', transaction.date.toDate().toLocaleDateString('es-ES'));
        console.log('   - Descripción:', transaction.description);

        const docRef = await admin.firestore().collection('transactions').add(transaction);

        console.log(`✅ Transacción creada con ID: ${docRef.id}`);
        console.log(`📅 Fecha guardada en BD: ${transactionDate.toLocaleDateString('es-ES')}`);

        return {
            success: true,
            id: docRef.id,
            message: 'Transacción agregada correctamente',
            debug: {
                fechaGuardada: transactionDate.toLocaleDateString('es-ES'),
                timestampGuardado: firestoreTimestamp.seconds
            }
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