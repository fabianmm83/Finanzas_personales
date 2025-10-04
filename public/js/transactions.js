class TransactionManager {
    constructor() {
        this.db = firebase.firestore();
    }

    async addTransaction(transactionData) {
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

            await this.db.collection('transactions').add(transaction);
            showToast('Transacción agregada correctamente', 'success');
            return { success: true };
            
        } catch (error) {
            showToast('Error: ' + error.message, 'danger');
            throw error;
        }
    }

   
    // En transactions.js - actualiza la función getTransactions
async getTransactions(filters = {}) {
    try {
        const user = firebase.auth().currentUser;
        if (!user) return [];

        let query = this.db.collection('transactions')
            .where('userId', '==', user.uid);

        // Aplicar filtros
        if (filters.month && filters.year) {
            const startDate = new Date(filters.year, filters.month - 1, 1);
            const endDate = new Date(filters.year, filters.month, 0, 23, 59, 59);
            
            // CORRECCIÓN: Usar Timestamp para las fechas
            query = query.where('date', '>=', firebase.firestore.Timestamp.fromDate(startDate))
                        .where('date', '<=', firebase.firestore.Timestamp.fromDate(endDate));
        }

        if (filters.startDate && filters.endDate) {
            query = query.where('date', '>=', firebase.firestore.Timestamp.fromDate(new Date(filters.startDate)))
                        .where('date', '<=', firebase.firestore.Timestamp.fromDate(new Date(filters.endDate)));
        }

        if (filters.category) {
            query = query.where('category', '==', filters.category);
        }

        if (filters.type) {
            query = query.where('type', '==', filters.type);
        }

        const snapshot = await query.orderBy('date', 'desc').get();
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

    } catch (error) {
        console.error('Error getting transactions:', error);
        showToast('Error al cargar transacciones', 'danger');
        return [];
    }
}

    async getDashboardData(month, year) {
        try {
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

            return {
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
            
        } catch (error) {
            console.error('Error getting dashboard data:', error);
            throw error;
        }
    }

    async updateTransaction(transactionId, updates) {
        try {
            await this.db.collection('transactions').doc(transactionId).update({
                ...updates,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            showToast('Transacción actualizada correctamente', 'success');
            return { success: true };
            
        } catch (error) {
            showToast('Error al actualizar transacción', 'danger');
            throw error;
        }
    }

    async deleteTransaction(transactionId) {
        try {
            await this.db.collection('transactions').doc(transactionId).delete();
            showToast('Transacción eliminada correctamente', 'success');
            return { success: true };
        } catch (error) {
            showToast('Error al eliminar transacción', 'danger');
            throw error;
        }
    }

    // Nueva función para obtener datos de meses anteriores
    async getMonthlySummaries() {
        try {
            const user = firebase.auth().currentUser;
            if (!user) return [];

            const snapshot = await this.db.collection('transactions')
                .where('userId', '==', user.uid)
                .orderBy('date', 'desc')
                .get();

            const transactions = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

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

            return Object.values(monthlyData).sort((a, b) => {
                if (a.year !== b.year) return b.year - a.year;
                return b.month - a.month;
            });

        } catch (error) {
            console.error('Error getting monthly summaries:', error);
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