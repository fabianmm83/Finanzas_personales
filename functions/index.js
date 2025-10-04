const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

// Export all route files
exports.auth = require('./src/routes/auth');
exports.transactions = require('./src/routes/transactions');
exports.budgets = require('./src/routes/budgets');
exports.reports = require('./src/routes/reports');