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
}

window.reportsManager = new ReportsManager();