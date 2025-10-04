// budgets.js - Versión con verificaciones de seguridad completas
if (typeof BudgetManager === 'undefined') {
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

        async getAllUserBudgets() {
            try {
                const user = firebase.auth().currentUser;
                if (!user) return [];

                const snapshot = await this.db.collection('budgets')
                    .where('userId', '==', user.uid)
                    .get();

                return snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                
            } catch (error) {
                console.error('Error getting all budgets:', error);
                return [];
            }
        }

        async getBudgetStatus(month, year) {
            try {
                const [budgets, transactions] = await Promise.all([
                    this.getBudgets(month, year),
                    transactionManager.getTransactions({ month, year, type: 'expense' })
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
                        percentageUsed: Math.min(percentageUsed, 100),
                        isOverBudget: spent > budget.limit
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
                const user = firebase.auth().currentUser;
                if (!user) throw new Error('Usuario no autenticado');

                // VERIFICACIÓN DE SEGURIDAD: Confirmar que el presupuesto pertenece al usuario
                const budgetDoc = await this.db.collection('budgets').doc(budgetId).get();
                if (!budgetDoc.exists) {
                    throw new Error('El presupuesto no existe');
                }
                
                if (budgetDoc.data().userId !== user.uid) {
                    throw new Error('No tienes permisos para editar este presupuesto');
                }

                const updateData = {
                    ...updates,
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                };

                // Si se actualiza el límite, convertirlo a número
                if (updateData.limit) {
                    updateData.limit = parseFloat(updateData.limit);
                }

                await this.db.collection('budgets').doc(budgetId).update(updateData);
                
                showToast('Presupuesto actualizado correctamente', 'success');
                return { success: true };
                
            } catch (error) {
                showToast('Error al actualizar presupuesto: ' + error.message, 'danger');
                throw error;
            }
        }

        async deleteBudget(budgetId) {
            try {
                const user = firebase.auth().currentUser;
                if (!user) throw new Error('Usuario no autenticado');

                // VERIFICACIÓN DE SEGURIDAD: Confirmar que el presupuesto pertenece al usuario
                const budgetDoc = await this.db.collection('budgets').doc(budgetId).get();
                if (!budgetDoc.exists) {
                    throw new Error('El presupuesto no existe');
                }
                
                if (budgetDoc.data().userId !== user.uid) {
                    throw new Error('No tienes permisos para eliminar este presupuesto');
                }

                await this.db.collection('budgets').doc(budgetId).delete();
                showToast('Presupuesto eliminado correctamente', 'success');
                return { success: true };
            } catch (error) {
                showToast('Error al eliminar presupuesto: ' + error.message, 'danger');
                throw error;
            }
        }

        async checkBudgetExists(category, month, year) {
            try {
                const user = firebase.auth().currentUser;
                if (!user) return false;

                const snapshot = await this.db.collection('budgets')
                    .where('userId', '==', user.uid)
                    .where('category', '==', category)
                    .where('month', '==', month)
                    .where('year', '==', year)
                    .get();

                return !snapshot.empty;
                
            } catch (error) {
                console.error('Error checking budget existence:', error);
                return false;
            }
        }

        async getBudgetAlerts(month, year) {
            try {
                const budgetStatus = await this.getBudgetStatus(month, year);
                return budgetStatus.filter(budget => budget.isOverBudget || budget.percentageUsed >= 80);
            } catch (error) {
                console.error('Error getting budget alerts:', error);
                return [];
            }
        }
    }

    window.budgetManager = new BudgetManager();
    console.log("💰 BudgetManager inicializado correctamente");
} else {
    console.log("ℹ️ BudgetManager ya estaba definido");
}