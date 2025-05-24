from flask import Blueprint, render_template, redirect, url_for
from flask_login import current_user, login_required
from sqlalchemy import func
from app import db

from app.models.transaction import Transaction

main_bp = Blueprint("main", __name__)

@main_bp.route('/', methods=['GET', 'POST'])
def home():
    if current_user.is_authenticated:
        return redirect(url_for('transactions.dashboard'))  # Redirige si está autenticado
    return render_template('auth/login.html')  # Página de login si no está autenticado

@main_bp.route('/dashboard')
def main_dashboard():
    return redirect(url_for('transactions.dashboard'))


@main_bp.route('/profile')
@login_required
def profile():
    # Calcular total ahorrado
    total_savings = db.session.query(func.sum(Transaction.amount))\
        .filter(Transaction.user_id == current_user.id)\
        .filter(Transaction.type == 'income')\
        .scalar() or 0
    
    # Contar número de transacciones
    total_transactions = Transaction.query\
        .filter_by(user_id=current_user.id)\
        .count()

    return render_template('usuario/perfil.html',
                         total_savings=total_savings,
                         total_transactions=total_transactions)