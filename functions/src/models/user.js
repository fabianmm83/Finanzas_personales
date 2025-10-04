// functions/src/models/User.js
class User {
    constructor(data) {
        this.username = data.username;
        this.email = data.email;
        this.hashedPassword = data.hashedPassword;
        this.isAdmin = data.isAdmin || false;
        this.createdAt = admin.firestore.FieldValue.serverTimestamp();
        this.lastLogin = admin.firestore.FieldValue.serverTimestamp();
    }
    
    toFirestore() {
        return {
            username: this.username,
            email: this.email,
            hashedPassword: this.hashedPassword,
            isAdmin: this.isAdmin,
            createdAt: this.createdAt,
            lastLogin: this.lastLogin
        };
    }
}