// functions/src/models/Budget.js
class Budget {
    constructor(data) {
        this.userId = data.userId;
        this.category = data.category;
        this.limit = parseFloat(data.limit);
        this.month = parseInt(data.month);
        this.year = parseInt(data.year);
        this.createdAt = admin.firestore.FieldValue.serverTimestamp();
    }
    
    toFirestore() {
        return {
            userId: this.userId,
            category: this.category,
            limit: this.limit,
            month: this.month,
            year: this.year,
            createdAt: this.createdAt
        };
    }
}