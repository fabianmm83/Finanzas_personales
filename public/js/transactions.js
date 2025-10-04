// transactions.js - Versión con Cloud Functions
if (typeof TransactionManager === 'undefined') {
    class TransactionManager {
        constructor() {
            this.db = firebase.firestore();
            this.functions = firebase.functions();
        }

        async addTransaction(transactionData) {
            try {
                console.log("Agregando transacción via Cloud Function:", transactionData);
                
                const addTransactionFunction = this.functions.httpsCallable('addTransaction');
                const result = await addTransactionFunction(transactionData);
                
                console.log("Respuesta de Cloud Function:", result);
                showToast('Transacción agregada correctamente', 'success');
                return result.data;
                
            } catch (error) {
                console.error('Error al agregar transacción via Cloud Function:', error);
                
                // Fallback: guardar directamente en Firestore si la función falla
                console.log("Intentando guardar directamente en Firestore...");
                return await this.addTransactionDirect(transactionData);
            }
        }

        // Fallback method para guardar directamente
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
                console.log("Transacción guardada directamente con ID:", result.id);
                
                showToast('Transacción agregada correctamente', 'success');
                return { success: true, id: result.id };
                
            } catch (directError) {
                console.error('Error también en método directo:', directError);
                showToast('Error: ' + directError.message, 'danger');
                throw directError;
            }
        }

        async getTransactions(filters = {}) {
            try {
                console.log("Obteniendo transacciones via Cloud Function:", filters);
                
                const getTransactionsFunction = this.functions.httpsCallable('getUserTransactions');
                const result = await getTransactionsFunction(filters);
                
                console.log("Transacciones desde Cloud Function:", result.data);
                return result.data.transactions || [];
                
            } catch (error) {
                console.error('Error al obtener transacciones via Cloud Function:', error);
                
                // Fallback: obtener directamente de Firestore
                console.log("Intentando obtener directamente de Firestore...");
                return await this.getTransactionsDirect(filters);
            }
        }

        // Fallback method para obtener directamente
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
                
                console.log(`Se encontraron ${transactions.length} transacciones directamente`);
                return transactions;

            } catch (directError) {
                console.error('Error también en método directo:', directError);
                showToast('Error al cargar transacciones: ' + directError.message, 'danger');
                return [];
            }
        }

        async getDashboardData(month, year) {
            try {
                console.log(`Obteniendo datos del dashboard para ${month}/${year}`);
                const transactions = await this.getTransactions({ month, year });
                
                console.log("Transacciones para dashboard:", transactions);

                const totalIncome = transactions
                    .filter(t => t.type === 'income')
                    .reduce((sum, t) => sum + t.amount, 0);
                    
                const totalExpense = transactions
                    .filter(t => t.type === 'expense')
                    .reduce((sum, t) => sum + t.amount, 0);

                console.log("Total ingresos:", totalIncome, "Total gastos:", totalExpense);

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

                console.log("Datos del dashboard:", result);
                return result;
                
            } catch (error) {
                console.error('Error en getDashboardData:', error);
                throw error;
            }
        }

        async getMonthlySummaries() {
            try {
                console.log("Obteniendo resúmenes mensuales");
                const transactions = await this.getTransactions({});
                
                console.log("Todas las transacciones para resumen mensual:", transactions);

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

                console.log("Resúmenes mensuales:", result);
                return result;

            } catch (error) {
                console.error('Error en getMonthlySummaries:', error);
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
    console.log("TransactionManager inicializado correctamente con Cloud Functions");
} else {
    console.log("TransactionManager ya estaba definido");
}