from flask import Blueprint, request, jsonify, render_template, redirect, url_for, flash
from flask_login import login_required, current_user
from app.models.transaction import Transaction
from app import db
from datetime import datetime, timedelta
import plotly.express as px
import json
from plotly.utils import PlotlyJSONEncoder
import plotly.express as px
import json
from flask import render_template
from plotly.utils import PlotlyJSONEncoder
from dateutil.relativedelta import relativedelta








transactions_bp = Blueprint('transactions', __name__)




@transactions_bp.route('/dashboard')
@login_required
def dashboard():
    try:
        user_id = current_user.id
        interval = request.args.get('interval', 'month')
        category_filter = request.args.get('category', None)
        amount_min = request.args.get('amount_min', None)
        amount_max = request.args.get('amount_max', None)
        page = request.args.get('page', 1, type=int)
        per_page = 6

        selected_month = request.args.get('month', datetime.now().month)
        selected_year = request.args.get('year', datetime.now().year)

        try:
            selected_month = int(selected_month)
            selected_year = int(selected_year)
            start_date = datetime(selected_year, selected_month, 1).date()
            next_month = start_date.replace(day=28) + timedelta(days=4)
            end_date = next_month - timedelta(days=next_month.day)
            interval = 'month'
        except (ValueError, TypeError):
            flash("Mes o año inválido", "warning")
            return redirect(url_for('transactions.dashboard'))

        query = Transaction.query.filter(
            Transaction.user_id == user_id,
            Transaction.date >= start_date,
            Transaction.date <= end_date
        )

        if category_filter:
            query = query.filter(Transaction.category == category_filter)
        if amount_min:
            query = query.filter(Transaction.amount >= float(amount_min))
        if amount_max:
            query = query.filter(Transaction.amount <= float(amount_max))

        transactions_paginated = query.order_by(Transaction.date.desc()).paginate(
            page=page, per_page=per_page, error_out=False)

        all_transactions = query.order_by(Transaction.date.desc()).all()

        total_income = 0
        total_expense = 0
        income_categories = []
        income_amounts = []
        expense_categories = []
        expense_amounts = []
        timeline_data = {'dates': [], 'income': [], 'expense': []}

        current_date = start_date
        while current_date <= end_date:
            timeline_data['dates'].append(current_date.strftime('%d/%m'))
            timeline_data['income'].append(0)
            timeline_data['expense'].append(0)
            current_date += timedelta(days=1)

        for t in all_transactions:
            if t.amount and t.category:
                if t.type == 'i':
                    total_income += t.amount
                    if t.category not in income_categories:
                        income_categories.append(t.category)
                        income_amounts.append(t.amount)
                    else:
                        idx = income_categories.index(t.category)
                        income_amounts[idx] += t.amount
                    day_index = (t.date - start_date).days
                    if 0 <= day_index < len(timeline_data['income']):
                        timeline_data['income'][day_index] += t.amount

                elif t.type == 'g':
                    total_expense += t.amount
                    if t.category not in expense_categories:
                        expense_categories.append(t.category)
                        expense_amounts.append(t.amount)
                    else:
                        idx = expense_categories.index(t.category)
                        expense_amounts[idx] += t.amount
                    day_index = (t.date - start_date).days
                    if 0 <= day_index < len(timeline_data['expense']):
                        timeline_data['expense'][day_index] += t.amount

        income_chart_data = {
            "labels": income_categories,
            "datasets": [{
                "label": "Ingresos",
                "data": income_amounts,
                "backgroundColor": "rgba(75, 192, 192, 0.2)",
                "borderColor": "rgba(75, 192, 192, 1)",
                "borderWidth": 1
            }]
        }

        expense_chart_data = {
            "labels": expense_categories,
            "datasets": [{
                "label": "Gastos",
                "data": expense_amounts,
                "backgroundColor": "rgba(255, 99, 132, 0.2)",
                "borderColor": "rgba(255, 99, 132, 1)",
                "borderWidth": 1
            }]
        }

        timeline_chart_data = {
            "labels": timeline_data['dates'],
            "datasets": [
                {
                    "label": "Ingresos",
                    "data": timeline_data['income'],
                    "borderColor": "rgba(75, 192, 192, 1)",
                    "backgroundColor": "transparent",
                    "tension": 0.1
                },
                {
                    "label": "Gastos",
                    "data": timeline_data['expense'],
                    "borderColor": "rgba(255, 99, 132, 1)",
                    "backgroundColor": "transparent",
                    "tension": 0.1
                }
            ]
        }

        balance_total = total_income - total_expense
        ahorro_potencial = total_income * 0.2
        dias_periodo = (end_date - start_date).days + 1
        gasto_diario_promedio = total_expense / dias_periodo if dias_periodo > 0 else 0

        all_categories = list(set([t.category for t in all_transactions if t.category]))

        pagination_args = {
            'interval': interval,
            'category': category_filter,
            'amount_min': amount_min,
            'amount_max': amount_max,
            'month': selected_month,
            'year': selected_year
        }

        # ✅ Carrusel: solo meses desde marzo 2025
        available_months = []
        month_cursor = datetime(2025, 3, 1)
        now = datetime.now()

        while month_cursor <= now:
            month_name = month_cursor.strftime('%B %Y')
            month_number = month_cursor.month
            year_number = month_cursor.year

            month_income = db.session.query(db.func.sum(Transaction.amount)).filter(
                Transaction.user_id == user_id,
                Transaction.type == 'i',
                db.extract('month', Transaction.date) == month_number,
                db.extract('year', Transaction.date) == year_number
            ).scalar() or 0

            month_expense = db.session.query(db.func.sum(Transaction.amount)).filter(
                Transaction.user_id == user_id,
                Transaction.type == 'g',
                db.extract('month', Transaction.date) == month_number,
                db.extract('year', Transaction.date) == year_number
            ).scalar() or 0

            available_months.append({
                'name': month_name,
                'month': month_number,
                'year': year_number,
                'income': float(month_income),
                'expense': float(month_expense),
                'balance': float(month_income) - float(month_expense)
            })

            month_cursor += relativedelta(months=1)

        if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
            transactions_html = render_template(
                'finances/_transactions_partial.html',
                transactions=transactions_paginated.items,
                pagination=transactions_paginated,
                pagination_args=pagination_args,
                total_transactions=transactions_paginated.total,
                current_filters=pagination_args
            )
            return jsonify({
                'html': transactions_html,
                'page': page
            })

        return render_template('finances/dashboard.html',
                               transactions=transactions_paginated.items,
                               total_income=total_income,
                               total_expense=total_expense,
                               income_chart_data=json.dumps(income_chart_data),
                               expense_chart_data=json.dumps(expense_chart_data),
                               timeline_chart_data=json.dumps(timeline_chart_data),
                               interval=interval,
                               start_date=start_date,
                               end_date=end_date,
                               start_date_str=start_date.strftime('%d/%m/%Y'),
                               end_date_str=end_date.strftime('%d/%m/%Y'),
                               balance_total=balance_total,
                               ahorro_potencial=ahorro_potencial,
                               gasto_diario_promedio=gasto_diario_promedio,
                               categories=all_categories,
                               current_filters=pagination_args,
                               pagination=transactions_paginated,
                               pagination_args=pagination_args,
                               total_transactions=transactions_paginated.total,
                               available_months=available_months,
                               selected_month=selected_month,
                               selected_year=selected_year,
                               datetime=datetime)

    except Exception as e:
        if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
            return jsonify({'error': str(e)}), 500
        flash(f"Error al obtener las transacciones: {str(e)}", "danger")
        return redirect(url_for('transactions.add_transaction_view'))







# Ruta para la vista de agregar transacción
@transactions_bp.route('/transactions/add', methods=['GET'])
@login_required
def add_transaction_view():
    return render_template('finances/add_transaction.html')









# Ruta para agregar una nueva transacción (POST)
@transactions_bp.route('/transactions/add', methods=['POST'])
@login_required
def add_transaction():
    try:
        user_id = current_user.id
        
        # Obtener datos del formulario
        type_ = request.form.get('type')
        category = request.form.get('category')
        amount = request.form.get('amount')
        date_str = request.form.get('date')
        
        # Validación de los campos
        if not type_ or not category or not amount:
            flash("Todos los campos son obligatorios.", "warning")
            return redirect(url_for('transactions.add_transaction_view'))
        
        if type_ not in ['i', 'g']:
            flash("El tipo de transacción debe ser 'i' (ingreso) o 'g' (gasto).", "warning")
            return redirect(url_for('transactions.add_transaction_view'))
        
        try:
            amount = float(amount)
        except ValueError:
            flash("El monto debe ser un número válido.", "warning")
            return redirect(url_for('transactions.add_transaction_view'))
        
        # Validación de la fecha
        if date_str:
            try:
                date = datetime.strptime(date_str, '%Y-%m-%d')
            except ValueError:
                flash("Fecha inválida. Usa el formato YYYY-MM-DD.", "warning")
                return redirect(url_for('transactions.add_transaction_view'))
        else:
            date = datetime.now()  # Si no se proporciona la fecha, se toma la fecha actual

        # Crear una nueva transacción
        new_transaction = Transaction(
            user_id=user_id,
            type=type_,
            category=category,
            amount=amount,
            date=date
        )
        
        db.session.add(new_transaction)
        db.session.commit()
        
        # Mensaje de éxito
        flash("Transacción registrada con éxito.", "success")
        return redirect(url_for('transactions.dashboard'))
    
    except Exception as e:
        db.session.rollback()  # Revertir la transacción en caso de error
        flash(f"Error al registrar la transacción: {str(e)}", "danger")
        return redirect(url_for('transactions.add_transaction_view'))









# Ruta para obtener las transacciones (GET)
@transactions_bp.route('/transactions', methods=['GET'])
@login_required
def get_transactions():
    try:
        user_id = current_user.id
        transactions = Transaction.query.filter_by(user_id=user_id).all()
        
        if not transactions:
            flash("No tienes transacciones registradas. Agrega una para comenzar.", "info")
            return redirect(url_for('transactions.add_transaction_view'))
        
        # Convertir las transacciones a formato JSON
        return jsonify([{  
            "id": t.id,
            "type": t.type,
            "category": t.category,
            "amount": t.amount,
            "date": t.date.strftime('%Y-%m-%d')
        } for t in transactions]), 200
    
    except Exception as e:
        flash(f"Error al obtener las transacciones: {str(e)}", "danger")
        return redirect(url_for('transactions.add_transaction_view'))









@transactions_bp.route('/edit/<int:transaction_id>', methods=['GET', 'POST'])
@login_required
def edit_transaction(transaction_id):
    transaction = Transaction.query.get_or_404(transaction_id)

    if request.method == 'POST':
        transaction.type = request.form['type']
        transaction.category = request.form['category']
        transaction.amount = request.form['amount']
        transaction.date = request.form['date']

        db.session.commit()
        flash("Transacción actualizada correctamente", "success")
        return redirect(url_for('transactions.dashboard'))

    return render_template('finances/edit_transaction.html', transaction=transaction)








@transactions_bp.route('/delete/<int:transaction_id>', methods=['POST'])
@login_required
def delete_transaction(transaction_id):
    transaction = Transaction.query.get_or_404(transaction_id)
    db.session.delete(transaction)
    db.session.commit()
    flash("Transacción eliminada correctamente", "danger")
    return redirect(url_for('transactions.dashboard'))

