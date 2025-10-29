class ReportsManager {
    constructor() {
        this.functions = firebase.functions();
    }

    async generateFinancialReport(reportData) {
        try {
            const generateReport = this.functions.httpsCallable('generateFinancialReport');
            const result = await generateReport(reportData);
            
            if (result.data.success) {
                return result.data.report;
            }
        } catch (error) {
            console.error('Error generating report:', error);
            showToast('Error al generar reporte: ' + error.message, 'danger');
            throw error;
        }
    }

    async getUserStats() {
        try {
            const getUserStats = this.functions.httpsCallable('getUserStats');
            const result = await getUserStats();
            
            if (result.data.success) {
                return result.data.stats;
            }
        } catch (error) {
            console.error('Error getting user stats:', error);
            throw error;
        }
    }

    // Similar a weekly_report en Python
    async getWeeklyReport() {
        try {
            const endDate = new Date();
            const startDate = new Date();
            startDate.setDate(endDate.getDate() - 7);
            
            const transactions = await transactionManager.getTransactionsByDateRange(startDate, endDate);
            return this._generateReport(transactions);
            
        } catch (error) {
            console.error('Error generating weekly report:', error);
            throw error;
        }
    }

    // Similar a monthly_report en Python
    async getMonthlyReport(month = null, year = null) {
        try {
            const now = new Date();
            const currentMonth = month || now.getMonth() + 1;
            const currentYear = year || now.getFullYear();
            
            const transactions = await transactionManager.getTransactions({ 
                month: currentMonth, 
                year: currentYear 
            });
            
            return this._generateReport(transactions);
            
        } catch (error) {
            console.error('Error generating monthly report:', error);
            throw error;
        }
    }

    // Similar a _generate_report en Python
    _generateReport(transactions) {
        let income = 0;
        let expenses = 0;
        const categories = {};

        transactions.forEach(transaction => {
            const amount = parseFloat(transaction.amount) || 0;
            
            if (transaction.type === 'income') {
                income += amount;
            } else {
                expenses += amount;
                
                // Categorías solo para gastos (como en Python)
                const category = transaction.category || 'Sin categoría';
                categories[category] = (categories[category] || 0) + amount;
            }
        });

        // Redondear a 2 decimales (como en Python)
        income = Math.round(income * 100) / 100;
        expenses = Math.round(expenses * 100) / 100;
        const balance = Math.round((income - expenses) * 100) / 100;

        // Redondear categorías
        Object.keys(categories).forEach(category => {
            categories[category] = Math.round(categories[category] * 100) / 100;
        });

        return {
            income: income,
            expenses: expenses,
            balance: balance,
            categories: categories,
            transaction_count: transactions.length,
            transactions: transactions
        };
    }

    // Función optimizada para exportar transacciones a CSV con colores y resumen
    async exportTransactionsToCSV(year, month, transactions = null) {
        try {
            console.log(`📊 Exportando transacciones de ${this.getMonthName(month)} ${year} a CSV`);
            
            let reportData;
            
            if (transactions) {
                // Si se proporcionan transacciones, generar el reporte
                reportData = this._generateReport(transactions);
            } else {
                // Si no, obtener el reporte mensual
                reportData = await this.getMonthlyReport(month, year);
            }
            
            if (!reportData || reportData.transaction_count === 0) {
                showToast('No hay transacciones para exportar', 'warning');
                return;
            }

            // Generar contenido CSV con formato mejorado
            const csvContent = this.generateFinancialCSV(reportData, year, month);
            
            // Descargar el archivo
            this.downloadCSV(csvContent, `reporte-financiero-${this.getMonthName(month).toLowerCase()}-${year}.csv`);
            
            showToast(`Reporte de ${this.getMonthName(month)} ${year} exportado exitosamente`, 'success');
            return csvContent;
            
        } catch (error) {
            console.error('Error exporting transactions:', error);
            showToast('Error al exportar transacciones: ' + error.message, 'danger');
            throw error;
        }
    }

    generateFinancialCSV(reportData, year, month) {
        const { income, expenses, balance, categories, transaction_count, transactions } = reportData;
        
        const headers = [
            `REPORTE FINANCIERO - ${this.getMonthName(month).toUpperCase()} ${year}`,
            `Generado: ${new Date().toLocaleDateString('es-ES', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            })}`,
            `Total de transacciones: ${transaction_count}`,
            ''
        ];

        // RESUMEN FINANCIERO (similar al Python)
        const financialSummary = [
            '=== RESUMEN FINANCIERO ===',
            'Concepto,Monto',
            `Ingresos Total,${this.formatCurrencyForCSV(income)}`,
            `Gastos Total,${this.formatCurrencyForCSV(expenses)}`,
            `Balance Neto,${this.formatCurrencyForCSV(balance)}`,
            ''
        ];

        // RESUMEN POR CATEGORÍAS (solo gastos - como en Python)
        const categorySummary = [
            '=== GASTOS POR CATEGORÍA ===',
            'Categoría,Monto,Porcentaje'
        ];

        if (expenses > 0) {
            Object.entries(categories).forEach(([category, amount]) => {
                const percentage = ((amount / expenses) * 100).toFixed(1);
                categorySummary.push(
                    `${category},${this.formatCurrencyForCSV(amount)},${percentage}%`
                );
            });
        } else {
            categorySummary.push('No hay gastos registrados para este período,0,0%');
        }

        categorySummary.push('');

        // DETALLE DE TRANSACCIONES CON COLORES
        const transactionHeader = [
            '=== DETALLE DE TRANSACCIONES ===',
            'Fecha,Tipo,Categoría,Descripción,Monto,Color'
        ];

        const transactionLines = transactions.map(transaction => {
            const date = new Date(transaction.date).toLocaleDateString('es-ES');
            const type = transaction.type === 'income' ? 'INGRESO' : 'GASTO';
            const category = transaction.category || 'Sin categoría';
            const description = (transaction.description || '-').replace(/,/g, ';');
            const amount = this.formatCurrencyForCSV(transaction.amount);
            // Color para Excel/Google Sheets - verde para ingresos, rojo para gastos
            const color = transaction.type === 'income' ? 'VERDE' : 'ROJO';

            return `${date},${type},${category},${description},${amount},${color}`;
        });

        // ANÁLISIS ADICIONAL
        const analysis = [
            '',
            '=== ANÁLISIS FINANCIERO ===',
            `Ratio Ahorro,${income > 0 ? ((balance / income) * 100).toFixed(1) : '0'}%`,
            `Promedio Ingresos Diarios,${this.formatCurrencyForCSV(income / 30)}`,
            `Promedio Gastos Diarios,${this.formatCurrencyForCSV(expenses / 30)}`,
            `Transacciones por Día,${(transaction_count / 30).toFixed(1)}`,
            ''
        ];

        // Combinar todas las secciones
        const csvLines = [
            ...headers,
            ...financialSummary,
            ...categorySummary,
            ...analysis,
            ...transactionHeader,
            ...transactionLines
        ];

        return csvLines.join('\n');
    }

    // Función para mostrar reporte en la interfaz
    async showFinancialReport(year = null, month = null) {
        try {
            const now = new Date();
            const currentYear = year || now.getFullYear();
            const currentMonth = month || now.getMonth() + 1;
            
            const reportData = await this.getMonthlyReport(currentMonth, currentYear);
            
            this.displayReportInUI(reportData, currentYear, currentMonth);
            
        } catch (error) {
            console.error('Error showing financial report:', error);
            showToast('Error al cargar el reporte financiero', 'danger');
        }
    }

    displayReportInUI(reportData, year, month) {
        const { income, expenses, balance, categories, transaction_count } = reportData;
        
        const content = document.getElementById('content');
        content.innerHTML = `
            <div class="container mt-4">
                <div class="d-flex justify-content-between align-items-center mb-4">
                    <h2 class="mb-0">
                        <i class="fas fa-chart-bar text-primary me-2"></i>
                        Reporte Financiero - ${this.getMonthName(month)} ${year}
                    </h2>
                    <div>
                        <button class="btn btn-primary" onclick="reportsManager.exportTransactionsToCSV(${year}, ${month})">
                            <i class="fas fa-download me-1"></i>Exportar CSV
                        </button>
                    </div>
                </div>

                <!-- Resumen Financiero -->
                <div class="row mb-4">
                    <div class="col-md-4 mb-3">
                        <div class="card bg-success bg-opacity-10 border-success">
                            <div class="card-body text-center">
                                <h6 class="card-title text-success">
                                    <i class="fas fa-arrow-down me-2"></i>Total Ingresos
                                </h6>
                                <h3 class="text-success">+$${income.toFixed(2)}</h3>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-4 mb-3">
                        <div class="card bg-danger bg-opacity-10 border-danger">
                            <div class="card-body text-center">
                                <h6 class="card-title text-danger">
                                    <i class="fas fa-arrow-up me-2"></i>Total Gastos
                                </h6>
                                <h3 class="text-danger">-$${expenses.toFixed(2)}</h3>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-4 mb-3">
                        <div class="card ${balance >= 0 ? 'bg-primary bg-opacity-10 border-primary' : 'bg-warning bg-opacity-10 border-warning'}">
                            <div class="card-body text-center">
                                <h6 class="card-title ${balance >= 0 ? 'text-primary' : 'text-warning'}">
                                    <i class="fas fa-balance-scale me-2"></i>Balance Neto
                                </h6>
                                <h3 class="${balance >= 0 ? 'text-primary' : 'text-warning'}">
                                    ${balance >= 0 ? '+' : ''}$${balance.toFixed(2)}
                                </h3>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Gastos por Categoría -->
                <div class="row">
                    <div class="col-md-6 mb-4">
                        <div class="card shadow">
                            <div class="card-header bg-light">
                                <h5 class="card-title mb-0">
                                    <i class="fas fa-tags me-2"></i>Gastos por Categoría
                                </h5>
                            </div>
                            <div class="card-body">
                                ${this.generateCategoriesHTML(categories, expenses)}
                            </div>
                        </div>
                    </div>
                    
                    <div class="col-md-6 mb-4">
                        <div class="card shadow">
                            <div class="card-header bg-light">
                                <h5 class="card-title mb-0">
                                    <i class="fas fa-chart-pie me-2"></i>Métricas Clave
                                </h5>
                            </div>
                            <div class="card-body">
                                ${this.generateMetricsHTML(reportData)}
                            </div>
                        </div>
                    </div>
                </div>

                <div class="text-center mt-3">
                    <p class="text-muted">
                        <i class="fas fa-info-circle me-2"></i>
                        Mostrando ${transaction_count} transacciones de ${this.getMonthName(month)} ${year}
                    </p>
                </div>
            </div>
        `;
    }

    generateCategoriesHTML(categories, totalExpenses) {
        if (Object.keys(categories).length === 0) {
            return '<p class="text-muted text-center">No hay gastos registrados</p>';
        }

        let html = '';
        Object.entries(categories)
            .sort(([,a], [,b]) => b - a)
            .forEach(([category, amount]) => {
                const percentage = totalExpenses > 0 ? (amount / totalExpenses * 100).toFixed(1) : 0;
                html += `
                    <div class="mb-3">
                        <div class="d-flex justify-content-between align-items-center mb-1">
                            <span class="fw-medium">${category}</span>
                            <span class="text-danger">-$${amount.toFixed(2)}</span>
                        </div>
                        <div class="progress" style="height: 8px;">
                            <div class="progress-bar bg-danger" role="progressbar" 
                                 style="width: ${percentage}%" 
                                 aria-valuenow="${percentage}" 
                                 aria-valuemin="0" 
                                 aria-valuemax="100">
                            </div>
                        </div>
                        <small class="text-muted">${percentage}% del total de gastos</small>
                    </div>
                `;
            });
        
        return html;
    }

    generateMetricsHTML(reportData) {
        const { income, expenses, balance, transaction_count } = reportData;
        const savingsRate = income > 0 ? (balance / income * 100).toFixed(1) : 0;
        const avgDailyIncome = income / 30;
        const avgDailyExpense = expenses / 30;
        const transactionsPerDay = (transaction_count / 30).toFixed(1);

        return `
            <div class="mb-3">
                <div class="d-flex justify-content-between">
                    <span>Ratio de Ahorro:</span>
                    <span class="fw-medium ${savingsRate >= 0 ? 'text-success' : 'text-danger'}">
                        ${savingsRate}%
                    </span>
                </div>
            </div>
            <div class="mb-3">
                <div class="d-flex justify-content-between">
                    <span>Promedio Ingresos Diario:</span>
                    <span class="text-success">+$${avgDailyIncome.toFixed(2)}</span>
                </div>
            </div>
            <div class="mb-3">
                <div class="d-flex justify-content-between">
                    <span>Promedio Gastos Diario:</span>
                    <span class="text-danger">-$${avgDailyExpense.toFixed(2)}</span>
                </div>
            </div>
            <div class="mb-3">
                <div class="d-flex justify-content-between">
                    <span>Transacciones por Día:</span>
                    <span class="fw-medium">${transactionsPerDay}</span>
                </div>
            </div>
        `;
    }

    formatCurrencyForCSV(amount) {
        return parseFloat(amount).toFixed(2);
    }

    getMonthName(month) {
        const months = [
            'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
            'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
        ];
        return months[month - 1] || 'Mes Desconocido';
    }

    downloadCSV(csvContent, filename) {
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}

window.reportsManager = new ReportsManager();

// Mantener función existente para compatibilidad
function exportTransactionsToCSV(year, month) {
    return window.reportsManager.exportTransactionsToCSV(year, month);
}

// Función para mostrar reporte financiero
function showFinancialReport(year = null, month = null) {
    return window.reportsManager.showFinancialReport(year, month);
}