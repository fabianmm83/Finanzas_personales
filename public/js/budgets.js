class BudgetManager {
    constructor() {
        this.db = firebase.firestore();
    }

    async createBudget(budgetData) {
        try {
            const user = firebase.auth().currentUser;
            if (!user) throw new Error('Usuario no autenticado');

            const budget = {
                userId: user.uid,
                category: budgetData.category,
                limit: parseFloat(budgetData.limit),
                month: parseInt(budgetData.month),
                year: parseInt(budgetData.year),
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            };

            const docRef = await this.db.collection('budgets').add(budget);
            
            showToast('Presupuesto creado correctamente', 'success');
            return { success: true, id: docRef.id, ...budget };
            
        } catch (error) {
            showToast('Error al crear presupuesto: ' + error.message, 'danger');
            throw error;
        }
    }

    async getBudgets(month, year) {
        try {
            const user = firebase.auth().currentUser;
            if (!user) return [];

            const snapshot = await this.db.collection('budgets')
                .where('userId', '==', user.uid)
                .where('month', '==', month)
                .where('year', '==', year)
                .get();

            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            
        } catch (error) {
            console.error('Error getting budgets:', error);
            showToast('Error al cargar presupuestos', 'danger');
            return [];
        }
    }

    async getBudgetStatus(month, year) {
        try {
            const [budgets, transactions] = await Promise.all([
                this.getBudgets(month, year),
                transactionManager.getTransactions({ month, year, type: 'g' })
            ]);

            const budgetStatus = budgets.map(budget => {
                const spent = transactions
                    .filter(t => t.category === budget.category)
                    .reduce((sum, t) => sum + t.amount, 0);
                    
                const remaining = budget.limit - spent;
                const percentageUsed = budget.limit > 0 ? (spent / budget.limit) * 100 : 0;

                return {
                    ...budget,
                    spent,
                    remaining,
                    percentageUsed: Math.min(percentageUsed, 100)
                };
            });

            return budgetStatus;
            
        } catch (error) {
            console.error('Error getting budget status:', error);
            throw error;
        }
    }

    async updateBudget(budgetId, updates) {
        try {
            await this.db.collection('budgets').doc(budgetId).update({
                ...updates,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            showToast('Presupuesto actualizado correctamente', 'success');
            return { success: true };
            
        } catch (error) {
            showToast('Error al actualizar presupuesto', 'danger');
            throw error;
        }
    }

    async deleteBudget(budgetId) {
        try {
            await this.db.collection('budgets').doc(budgetId).delete();
            showToast('Presupuesto eliminado correctamente', 'success');
            return { success: true };
        } catch (error) {
            showToast('Error al eliminar presupuesto', 'danger');
            throw error;
        }
    }
}

window.budgetManager = new BudgetManager();