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

    async getTransactions(filters = {}) {
        try {
            const user = firebase.auth().currentUser;
            if (!user) return [];

            let query = this.db.collection('transactions')
                .where('userId', '==', user.uid);

            // Aplicar filtros
            if (filters.month && filters.year) {
                const startDate = new Date(filters.year, filters.month - 1, 1);
                const endDate = new Date(filters.year, filters.month, 0);
                query = query.where('date', '>=', startDate)
                            .where('date', '<=', endDate);
            }

            if (filters.startDate && filters.endDate) {
                query = query.where('date', '>=', new Date(filters.startDate))
                            .where('date', '<=', new Date(filters.endDate));
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
                    balance: totalIncome - totalExpense,
                    transactionCount: transactions.length
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
}

window.transactionManager = new TransactionManager();