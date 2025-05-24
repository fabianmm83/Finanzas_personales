from app import db 
from datetime import datetime

class Transaction(db.Model):
    __tablename__ = 'transactions'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    type = db.Column(db.String(1), nullable=False)  # 'i'=ingreso, 'g'=gasto
    category = db.Column(db.String(50), nullable=False)
    amount = db.Column(db.Float, nullable=False)
    date = db.Column(db.Date, nullable=False, default=datetime.utcnow)  # Cambiado a nullable=False
    description = db.Column(db.Text)

    # Nuevos métodos para integración con presupuestos
    def is_expense(self):
        return self.type == 'g'
    
    def is_income(self):
        return self.type == 'i'
    
    def matches_budget(self, budget):
        """Verifica si esta transacción aplica a un presupuesto específico"""
        return (self.user_id == budget.user_id and
                self.is_expense() and
                self.category.lower() == budget.category.lower() and
                self.date.month == budget.month and
                self.date.year == budget.year)

    def to_dict(self):
        return {
            'id': self.id,
            'type': self.type,
            'category': self.category,
            'amount': self.amount,
            'date': self.date.isoformat(),
            'description': self.description,
            'is_expense': self.is_expense()
        }

    
def get_affected_budgets(self):
    """Obtiene todos los presupuestos que esta transacción afectaría"""
    if not self.is_expense():
        return []
        
    from app.models.budget import Budget
    return Budget.query.filter(
        Budget.user_id == self.user_id,
        db.func.lower(Budget.category) == db.func.lower(self.category),
        Budget.month == self.date.month,
        Budget.year == self.date.year
    ).all()

def affect_budgets(self):
    """Notifica a los presupuestos afectados sobre esta transacción"""
    if not self.is_expense():
        return
        
    affected_budgets = self.get_affected_budgets()
    for budget in affected_budgets:
        budget.handle_transaction(self)

    
    
    
    def __repr__(self):
        return f'<Transaction {self.id}: {self.category} - ${self.amount} ({self.date})>'