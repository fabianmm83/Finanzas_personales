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

    // Función optimizada para exportar transacciones a CSV
    async exportTransactionsToCSV(year, month, transactions = null) {
        try {
            console.log(`📊 Exportando transacciones de ${this.getMonthName(month)} ${year} a CSV`);
            
            let transactionsData = transactions;
            
            // Si no se proporcionan transacciones, generarlas
            if (!transactionsData) {
                transactionsData = await this.generateTransactionReport(year, month);
            }
            
            if (!transactionsData || transactionsData.length === 0) {
                showToast('No hay transacciones para exportar', 'warning');
                return;
            }

            // Generar contenido CSV optimizado
            const csvContent = this.generateTransactionsCSV(transactionsData, year, month);
            
            // Descargar el archivo
            this.downloadCSV(csvContent, `transacciones-${this.getMonthName(month)}-${year}.csv`);
            
            showToast(`Transacciones de ${this.getMonthName(month)} ${year} exportadas exitosamente`, 'success');
            return csvContent;
            
        } catch (error) {
            console.error('Error exporting transactions:', error);
            showToast('Error al exportar transacciones: ' + error.message, 'danger');
            throw error;
        }
    }

    // Generar reporte de transacciones (puedes adaptar esta función según tu estructura de datos)
    async generateTransactionReport(year, month) {
        try {
            // Aquí llamas a tu función existente para obtener transacciones
            // Por ejemplo:
            const transactionReport = this.functions.httpsCallable('getTransactionsByMonth');
            const result = await transactionReport({ year, month });
            
            if (result.data.success) {
                return result.data.transactions;
            }
            return [];
        } catch (error) {
            console.error('Error generating transaction report:', error);
            return [];
        }
    }

    generateTransactionsCSV(transactions, year, month) {
        const headers = [
            `REPORTE DE TRANSACCIONES - ${this.getMonthName(month).toUpperCase()} ${year}`,
            `Generado: ${new Date().toLocaleDateString('es-ES', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            })}`,
            `Total de transacciones: ${transactions.length}`,
            ''
        ];

        // Encabezados de columnas
        const columnHeaders = [
            'FECHA,TIPO,CATEGORÍA,DESCRIPCIÓN,MONTO,ESTADO,CUENTA,NOTAS'
        ];

        // Resumen por categorías (se calculará mientras procesamos las transacciones)
        const categorySummary = {};
        let totalIncome = 0;
        let totalExpenses = 0;

        // Procesar cada transacción
        const transactionLines = transactions.map(transaction => {
            const date = new Date(transaction.date).toLocaleDateString('es-ES');
            const type = transaction.type || 'N/A';
            const category = transaction.category || 'Sin categoría';
            const description = transaction.description || '';
            const amount = this.formatCurrencyForCSV(transaction.amount || 0);
            const status = transaction.status || 'Completado';
            const account = transaction.account || 'N/A';
            const notes = (transaction.notes || '').replace(/,/g, ';'); // Evitar comas en notas

            // Calcular resumen por categoría
            if (!categorySummary[category]) {
                categorySummary[category] = { income: 0, expenses: 0 };
            }
            
            if (type.toLowerCase() === 'ingreso') {
                categorySummary[category].income += parseFloat(transaction.amount || 0);
                totalIncome += parseFloat(transaction.amount || 0);
            } else {
                categorySummary[category].expenses += parseFloat(transaction.amount || 0);
                totalExpenses += parseFloat(transaction.amount || 0);
            }

            return `${date},${type},${category},${description},${amount},${status},${account},${notes}`;
        });

        // Sección de resumen
        const summarySection = [
            '',
            '=== RESUMEN DEL MES ===',
            `Total Ingresos: ${this.formatCurrencyForCSV(totalIncome)}`,
            `Total Gastos: ${this.formatCurrencyForCSV(totalExpenses)}`,
            `Balance Neto: ${this.formatCurrencyForCSV(totalIncome - totalExpenses)}`,
            ''
        ];

        // Resumen por categorías
        const categorySection = [
            '=== RESUMEN POR CATEGORÍA ===',
            'Categoría,Ingresos,Gastos,Total'
        ];

        Object.entries(categorySummary).forEach(([category, amounts]) => {
            const total = amounts.income - amounts.expenses;
            categorySection.push(
                `${category},${this.formatCurrencyForCSV(amounts.income)},${this.formatCurrencyForCSV(amounts.expenses)},${this.formatCurrencyForCSV(total)}`
            );
        });

        // Combinar todas las secciones
        const csvLines = [
            ...headers,
            ...summarySection,
            ...categorySection,
            '',
            '=== DETALLE DE TRANSACCIONES ===',
            ...columnHeaders,
            ...transactionLines
        ];

        return csvLines.join('\n');
    }

    formatCurrencyForCSV(amount) {
        // Para CSV, usar formato numérico simple sin símbolos
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

// Mantener tu función existente para compatibilidad
function exportTransactionsToCSV(year, month) {
    return window.reportsManager.exportTransactionsToCSV(year, month);
}