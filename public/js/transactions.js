// transactions.js - Versión corregida
if (typeof TransactionManager === 'undefined') {
    class TransactionManager {
        constructor() {
            this.db = firebase.firestore();
            // Verificar si Firebase Functions está disponible
            this.functions = null;
            try {
                if (firebase.functions) {
                    this.functions = firebase.functions();
                    console.log("✅ Firebase Functions disponible");
                } else {
                    console.log("⚠️ Firebase Functions no disponible, usando Firestore directamente");
                }
            } catch (error) {
                console.log("⚠️ Error inicializando Functions:", error);
            }
        }

        async addTransaction(transactionData) {
            try {
                console.log("📝 Agregando transacción:", transactionData);
                
                // Intentar usar Cloud Functions si está disponible
                if (this.functions) {
                    try {
                        const addTransactionFunction = this.functions.httpsCallable('addTransaction');
                        const result = await addTransactionFunction(transactionData);
                        console.log("✅ Transacción agregada via Cloud Functions:", result.data);
                        showToast(result.data.message || 'Transacción agregada correctamente', 'success');
                        return result.data;
                    } catch (cfError) {
                        console.log("⚠️ Falló Cloud Functions, usando Firestore directamente:", cfError);
                    }
                }
                
                // Fallback a Firestore directo
                return await this.addTransactionDirect(transactionData);
                
            } catch (error) {
                console.error('❌ Error al agregar transacción:', error);
                showToast('Error al agregar transacción: ' + error.message, 'danger');
                throw error;
            }
        }

        // Método directo a Firestore
        async addTransactionDirect(transactionData) {
            try {
                const user = firebase.auth().currentUser;
                if (!user) throw new Error('Usuario no autenticado');

                const transaction = {
                    userId: user.uid,
                    type: transactionData.type,
                    category: transactionData.category,
                    amount: parseFloat(transactionData.amount),
                    date: firebase.firestore.Timestamp.fromDate(new Date(transactionData.date)),
                    description: transactionData.description || '',
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                };

                const result = await this.db.collection('transactions').add(transaction);
                console.log("✅ Transacción guardada directamente con ID:", result.id);
                
                showToast('Transacción agregada correctamente', 'success');
                return { success: true, id: result.id };
                
            } catch (error) {
                console.error('❌ Error en método directo:', error);
                throw error;
            }
        }

        async getTransactions(filters = {}) {
            try {
                console.log("📊 Obteniendo transacciones con filtros:", filters);
                
                // Intentar usar Cloud Functions si está disponible
                if (this.functions) {
                    try {
                        const getTransactionsFunction = this.functions.httpsCallable('getUserTransactions');
                        const result = await getTransactionsFunction(filters);
                        console.log(`✅ Se encontraron ${result.data.transactions.length} transacciones via Cloud Functions`);
                        return result.data.transactions || [];
                    } catch (cfError) {
                        console.log("⚠️ Falló Cloud Functions, usando Firestore directamente:", cfError);
                    }
                }
                
                // Fallback a Firestore directo
                return await this.getTransactionsDirect(filters);
                
            } catch (error) {
                console.error('❌ Error al obtener transacciones:', error);
                showToast('Error al cargar transacciones: ' + error.message, 'danger');
                return [];
            }
        }

        // Método directo a Firestore
        async getTransactionsDirect(filters = {}) {
            try {
                const user = firebase.auth().currentUser;
                if (!user) {
                    console.log("Usuario no autenticado");
                    return [];
                }

                let query = this.db.collection('transactions')
                    .where('userId', '==', user.uid);

                // Aplicar filtros
                if (filters.month && filters.year) {
                    const startDate = new Date(filters.year, filters.month - 1, 1);
                    const endDate = new Date(filters.year, filters.month, 0, 23, 59, 59);
                    
                    query = query.where('date', '>=', firebase.firestore.Timestamp.fromDate(startDate))
                                .where('date', '<=', firebase.firestore.Timestamp.fromDate(endDate));
                }

                if (filters.type) {
                    query = query.where('type', '==', filters.type);
                }

                if (filters.category) {
                    query = query.where('category', '==', filters.category);
                }

                const snapshot = await query.orderBy('date', 'desc').get();
                const transactions = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                
                console.log(`✅ Se encontraron ${transactions.length} transacciones directamente`);
                return transactions;

            } catch (error) {
                console.error('❌ Error en método directo:', error);
                throw error;
            }
        }

        async getDashboardData(month, year) {
            try {
                console.log(`📈 Obteniendo datos del dashboard para ${month}/${year}`);
                const transactions = await this.getTransactions({ month, year });
                
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

                const result = {
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
                };

                console.log("✅ Datos del dashboard calculados:", result);
                return result;
                
            } catch (error) {
                console.error('❌ Error en getDashboardData:', error);
                throw error;
            }
        }

        async getMonthlySummaries() {
            try {
                console.log("📅 Obteniendo resúmenes mensuales");
                const transactions = await this.getTransactions({});
                
                // Agrupar por mes y año
                const monthlyData = {};
                transactions.forEach(transaction => {
                    const date = transaction.date.toDate();
                    const month = date.getMonth() + 1;
                    const year = date.getFullYear();
                    const key = `${year}-${month}`;
                    
                    if (!monthlyData[key]) {
                        monthlyData[key] = {
                            month,
                            year,
                            name: this.getMonthName(month) + ' ' + year,
                            income: 0,
                            expense: 0,
                            balance: 0
                        };
                    }
                    
                    if (transaction.type === 'income') {
                        monthlyData[key].income += transaction.amount;
                    } else {
                        monthlyData[key].expense += transaction.amount;
                    }
                    monthlyData[key].balance = monthlyData[key].income - monthlyData[key].expense;
                });

                const result = Object.values(monthlyData).sort((a, b) => {
                    if (a.year !== b.year) return b.year - a.year;
                    return b.month - a.month;
                });

                console.log("✅ Resúmenes mensuales calculados:", result);
                return result;

            } catch (error) {
                console.error('❌ Error en getMonthlySummaries:', error);
                return [];
            }
        }

        getMonthName(month) {
            const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
                           'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
            return months[month - 1];
        }
    }

    window.transactionManager = new TransactionManager();
    console.log("🚀 TransactionManager inicializado correctamente");
} else {
    console.log("ℹ️ TransactionManager ya estaba definido");
}