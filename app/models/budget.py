from app import db
from sqlalchemy import extract
from datetime import datetime
from app.models.transaction import Transaction
    

class Budget(db.Model):
    __tablename__ = 'budgets'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    category = db.Column(db.String(50), nullable=False, index=True)
    limit = db.Column(db.Float, nullable=False)
    month = db.Column(db.Integer, nullable=False, index=True)
    year = db.Column(db.Integer, nullable=False, index=True)
    
    def calculate_remaining(self):
        """Calculate remaining budget amount"""
        spent = db.session.query(
            db.func.coalesce(db.func.sum(Transaction.amount), 0.0)
        ).filter(
            Transaction.user_id == self.user_id,
            db.func.lower(Transaction.category) == db.func.lower(self.category),
            Transaction.type == 'g',
            extract('month', Transaction.date) == self.month,
            extract('year', Transaction.date) == self.year
        ).scalar()
        
        return self.limit - abs(float(spent))
    
    def get_spent_amount(self):
        """Get total spent amount for this budget"""
        return self.limit - self.calculate_remaining()
    
    def get_percentage_used(self):
        """Get percentage of budget used"""
        if self.limit <= 0:
            return 0
        return min((self.get_spent_amount() / self.limit) * 100, 100)
    
    def handle_transaction(self, transaction):
        """Handle a new transaction that might affect this budget"""
        if self.matches_transaction(transaction):
            pass
        
    def matches_transaction(self, transaction):
        """Check if a transaction matches this budget's criteria"""
        return (transaction.user_id == self.user_id and
                transaction.is_expense() and
                transaction.category.lower() == self.category.lower() and
                transaction.date.month == self.month and
                transaction.date.year == self.year)
    
    def to_dict(self):
        """Convert budget to dictionary for API responses"""
        return {
            'id': self.id,
            'category': self.category,
            'limit': self.limit,
            'month': self.month,
            'year': self.year,
            'remaining': self.calculate_remaining(),
            'spent': self.get_spent_amount(),
            'percentage_used': self.get_percentage_used()
        }

    def __repr__(self):
        return f'<Budget {self.id} {self.category} {self.month}/{self.year}>'