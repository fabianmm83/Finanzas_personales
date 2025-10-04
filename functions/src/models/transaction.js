class Transaction {
    constructor(data) {
        this.userId = data.userId;
        this.type = data.type; // 'i' or 'g'
        this.category = data.category;
        this.amount = parseFloat(data.amount);
        this.date = admin.firestore.Timestamp.fromDate(new Date(data.date));
        this.description = data.description || '';
        this.createdAt = admin.firestore.FieldValue.serverTimestamp();
    }
    
    toFirestore() {
        return {
            userId: this.userId,
            type: this.type,
            category: this.category,
            amount: this.amount,
            date: this.date,
            description: this.description,
            createdAt: this.createdAt
        };
    }
    
    isExpense() {
        return this.type === 'g';
    }
    
    isIncome() {
        return this.type === 'i';
    }
}

module.exports = Transaction;