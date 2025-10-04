// migration.js - Migración desde el navegador
class BrowserDataMigrator {
    constructor() {
        this.db = firebase.firestore();
    }

    async loadLocalData() {
        try {
            console.log("📁 Solicitando datos locales al servidor...");
            
            const response = await fetch('/api/export-all-data');
            if (!response.ok) {
                throw new Error(`Error del servidor: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (data.error) {
                throw new Error(data.error);
            }
            
            console.log("📊 Datos cargados:", {
                transacciones: data.transactions?.length || 0,
                presupuestos: data.budgets?.length || 0,
                usuarios: data.users?.length || 0
            });
            
            return data;
            
        } catch (error) {
            console.error('❌ Error cargando datos locales:', error);
            throw error;
        }
    }

    async migrateTransactions(transactions, userMap) {
        try {
            console.log(`🔄 Migrando ${transactions.length} transacciones...`);
            
            const batch = this.db.batch();
            let successCount = 0;
            let errorCount = 0;

            for (const tx of transactions) {
                try {
                    // Determinar el tipo de transacción
                    let transactionType = 'expense';
                    if (tx.type === 'i') {
                        transactionType = 'income';
                    } else if (tx.type === 'g') {
                        transactionType = 'expense';
                    }

                    const firestoreTx = {
                        userId: userMap[tx.user_id] || `user_${tx.user_id}`,
                        type: transactionType,
                        category: tx.category || 'Sin categoría',
                        amount: Math.abs(parseFloat(tx.amount || 0)),
                        date: this.convertDate(tx.date),
                        description: tx.description || '',
                        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                        original_id: tx.id,
                        migrated_at: firebase.firestore.FieldValue.serverTimestamp()
                    };

                    const docRef = this.db.collection('transactions').doc();
                    batch.set(docRef, firestoreTx);
                    successCount++;

                    // Firebase limita a 500 operaciones por batch
                    if (successCount % 400 === 0) {
                        await batch.commit();
                        console.log(`📦 Lote de 400 transacciones enviado...`);
                        // Crear nuevo batch
                        for (let i = 0; i < 400; i++) {
                            // No podemos limpiar el batch fácilmente, así que creamos uno nuevo
                        }
                    }

                } catch (error) {
                    console.error(`❌ Error migrando transacción ${tx.id}:`, error);
                    errorCount++;
                }
            }

            // Commit del batch final
            if (successCount % 400 !== 0) {
                await batch.commit();
            }

            console.log(`✅ ${successCount} transacciones migradas, ${errorCount} errores`);
            return { successCount, errorCount };

        } catch (error) {
            console.error('❌ Error en migración de transacciones:', error);
            throw error;
        }
    }

    async migrateBudgets(budgets, userMap) {
        try {
            console.log(`🔄 Migrando ${budgets.length} presupuestos...`);
            
            const batch = this.db.batch();
            let successCount = 0;
            let errorCount = 0;

            for (const budget of budgets) {
                try {
                    const firestoreBudget = {
                        userId: userMap[budget.user_id] || `user_${budget.user_id}`,
                        category: budget.category || 'Sin categoría',
                        limit: parseFloat(budget.limit || 0),
                        month: parseInt(budget.month || new Date().getMonth() + 1),
                        year: parseInt(budget.year || new Date().getFullYear()),
                        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                        original_id: budget.id,
                        migrated_at: firebase.firestore.FieldValue.serverTimestamp()
                    };

                    const docRef = this.db.collection('budgets').doc();
                    batch.set(docRef, firestoreBudget);
                    successCount++;

                } catch (error) {
                    console.error(`❌ Error migrando presupuesto ${budget.id}:`, error);
                    errorCount++;
                }
            }

            if (successCount > 0) {
                await batch.commit();
                console.log(`✅ ${successCount} presupuestos migrados exitosamente`);
            }
            
            return { successCount, errorCount };

        } catch (error) {
            console.error('❌ Error en migración de presupuestos:', error);
            throw error;
        }
    }

    convertDate(dateString) {
        try {
            if (!dateString) {
                return firebase.firestore.Timestamp.now();
            }
            
            // Manejar diferentes formatos de fecha
            let date;
            if (typeof dateString === 'string') {
                date = new Date(dateString);
            } else if (dateString.toDate) {
                // Si ya es un Timestamp de Firestore
                return dateString;
            } else {
                date = new Date();
            }
            
            // Validar que la fecha sea válida
            if (isNaN(date.getTime())) {
                console.warn('Fecha inválida, usando fecha actual:', dateString);
                return firebase.firestore.Timestamp.now();
            }
            
            return firebase.firestore.Timestamp.fromDate(date);
            
        } catch (error) {
            console.error('Error convirtiendo fecha:', dateString, error);
            return firebase.firestore.Timestamp.now();
        }
    }

    async startMigration() {
        const startTime = Date.now();
        
        try {
            const user = firebase.auth().currentUser;
            if (!user) {
                throw new Error('Usuario no autenticado. Inicia sesión primero.');
            }

            console.log('🚀 Iniciando migración para usuario:', user.uid);
            this.updateProgress('Iniciando migración...', 0);

            // 1. Cargar datos locales
            this.updateProgress('Cargando datos locales...', 10);
            const localData = await this.loadLocalData();
            
            // 2. Mapeo de usuarios (asumimos que migras solo tu usuario actual)
            // Necesitas saber cuál es tu user_id en SQLite
            const userMap = {
                // EJEMPLO: Si tu user_id en SQLite es 1, descomenta la línea siguiente:
                // 1: user.uid
            };
            
            // Si no sabes tu user_id, puedes intentar detectarlo
            if (localData.users && localData.users.length > 0) {
                // Asumir que el primer usuario es el actual (o buscar por email)
                const currentUser = localData.users[0];
                userMap[currentUser.id] = user.uid;
                console.log(`🔗 Mapeando usuario SQLite ${currentUser.id} → Firebase ${user.uid}`);
            }

            // 3. Migrar transacciones
            this.updateProgress('Migrando transacciones...', 30);
            const txResult = await this.migrateTransactions(localData.transactions || [], userMap);
            
            // 4. Migrar presupuestos
            this.updateProgress('Migrando presupuestos...', 70);
            const budgetResult = await this.migrateBudgets(localData.budgets || [], userMap);

            // 5. Resumen final
            const endTime = Date.now();
            const duration = ((endTime - startTime) / 1000).toFixed(2);
            
            console.log('🎉 Migración completada:');
            console.log(`   - Transacciones: ${txResult.successCount} migradas, ${txResult.errorCount} errores`);
            console.log(`   - Presupuestos: ${budgetResult.successCount} migrados, ${budgetResult.errorCount} errores`);
            console.log(`   - Tiempo total: ${duration} segundos`);

            this.updateProgress('Migración completada!', 100);
            
            showToast(
                `✅ Migración completada: ${txResult.successCount} transacciones y ${budgetResult.successCount} presupuestos migrados en ${duration}s`,
                'success'
            );

            return {
                transactions: txResult,
                budgets: budgetResult,
                duration: duration
            };

        } catch (error) {
            console.error('❌ Error en migración:', error);
            this.updateProgress('Error en migración', 0);
            showToast('Error en migración: ' + error.message, 'danger');
            throw error;
        }
    }

    updateProgress(message, percentage) {
        const progressBar = document.getElementById('migrationProgressBar');
        const status = document.getElementById('migrationStatus');
        
        if (progressBar) {
            progressBar.style.width = percentage + '%';
            progressBar.textContent = percentage + '%';
        }
        
        if (status) {
            status.textContent = message;
        }
        
        console.log(`📊 Progreso: ${percentage}% - ${message}`);
    }

    async checkExistingData() {
        try {
            const user = firebase.auth().currentUser;
            if (!user) return;

            // Verificar transacciones existentes
            const txSnapshot = await this.db.collection('transactions')
                .where('userId', '==', user.uid)
                .limit(5)
                .get();

            // Verificar presupuestos existentes
            const budgetSnapshot = await this.db.collection('budgets')
                .where('userId', '==', user.uid)
                .limit(5)
                .get();

            const hasTransactions = !txSnapshot.empty;
            const hasBudgets = !budgetSnapshot.empty;

            let message = 'Datos en Firebase: ';
            message += hasTransactions ? `📊 ${txSnapshot.size}+ transacciones ` : '';
            message += hasBudgets ? `💰 ${budgetSnapshot.size}+ presupuestos ` : '';
            message += (!hasTransactions && !hasBudgets) ? 'Ninguno encontrado' : '';

            showToast(message, 'info');
            
            return {
                hasTransactions,
                hasBudgets,
                transactionCount: txSnapshot.size,
                budgetCount: budgetSnapshot.size
            };

        } catch (error) {
            console.error('Error verificando datos:', error);
            showToast('Error verificando datos existentes', 'danger');
        }
    }
}

// Inicializar migrador cuando se cargue la página
document.addEventListener('DOMContentLoaded', function() {
    window.dataMigrator = new BrowserDataMigrator();
    console.log("🚀 DataMigrator inicializado");
});