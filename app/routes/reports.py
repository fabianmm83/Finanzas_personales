from flask import Blueprint, jsonify, request
from flask_login import login_required, current_user
from app.models.transaction import Transaction
from app import db 
from datetime import datetime, timedelta

report_bp = Blueprint('reports', __name__, url_prefix='/api/reports')








@report_bp.route('/weekly', methods=['GET'])
@login_required
def weekly_report():
    user_id = current_user.id
    end_date = datetime.now()
    start_date = end_date - timedelta(days=7)
    
    transactions = Transaction.query.filter(
        Transaction.user_id == user_id,
        Transaction.date >= start_date,
        Transaction.date <= end_date
    ).all()
    
    return _generate_report(transactions)







@report_bp.route('/monthly', methods=['GET'])
@login_required
def monthly_report():
    user_id = current_user.id
    try:
        month = int(request.args.get('month', datetime.now().month))
        year = int(request.args.get('year', datetime.now().year))
    except ValueError:
        return jsonify({"error": "Mes/año deben ser números"}), 400

    transactions = Transaction.query.filter(
        Transaction.user_id == user_id,
        db.extract('month', Transaction.date) == month,
        db.extract('year', Transaction.date) == year
    ).all()
    
    return _generate_report(transactions)

def _generate_report(transactions):
    income = round(sum(t.amount for t in transactions if t.type == 'i'), 2)
    expenses = round(sum(t.amount for t in transactions if t.type == 'g'), 2)
    
    categories = {}
    for t in transactions:
        if t.type == 'g':
            categories[t.category] = round(categories.get(t.category, 0) + t.amount, 2)
    
    return jsonify({
        "income": income,
        "expenses": expenses,
        "balance": round(income - expenses, 2),
        "categories": categories,
        "transaction_count": len(transactions)
    }), 200
