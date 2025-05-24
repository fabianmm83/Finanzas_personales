from flask import Blueprint, make_response, request, jsonify, render_template, redirect, url_for
from flask_login import login_required, current_user
from app.models.budget import Budget
from app.models.transaction import Transaction
from app import db 
from datetime import datetime

budget_bp = Blueprint('budgets', __name__, url_prefix='/api/budgets')





@budget_bp.route('/', methods=['POST'])
@login_required
def create_budget():
    try:
        data = request.get_json()
        print("Datos recibidos para crear presupuesto:", data)
        
        # Validación básica
        if not all(key in data for key in ['category', 'limit', 'month', 'year', 'user_id']):
            return jsonify({"success": False, "error": "Datos incompletos"}), 400
        
        # Crear nuevo presupuesto
        new_budget = Budget(
            user_id=data['user_id'],
            category=data['category'],
            limit=float(data['limit']),
            month=int(data['month']),
            year=int(data['year'])
        )
        
        db.session.add(new_budget)
        db.session.commit()
        
        print(f"Presupuesto creado: ID {new_budget.id}")
        return jsonify({"success": True, "message": "Presupuesto creado exitosamente"})
        
    except Exception as e:
        db.session.rollback()
        print("Error al crear presupuesto:", str(e))
        return jsonify({"success": False, "error": str(e)}), 500









@budget_bp.route('/status', methods=['GET'])
@login_required
def get_budgets_status():
    user_id = current_user.id
    try:
        month = int(request.args.get('month', datetime.now().month))
        year = int(request.args.get('year', datetime.now().year))
    except ValueError:
        return jsonify({"error": "Mes/año deben ser números"}), 400

    budgets = Budget.query.filter_by(
        user_id=user_id,
        month=month,
        year=year
    ).all()

    if not budgets:
        return jsonify({"error": "No se encontraron presupuestos"}), 404  # Esto es solo para depuración

    result = []
    for budget in budgets:
        spent = db.session.query(
            db.func.coalesce(db.func.sum(Transaction.amount), 0.0)
        ).filter(
            Transaction.user_id == user_id,
            Transaction.category == budget.category,
            Transaction.type == 'g',
            db.extract('month', Transaction.date) == month,
            db.extract('year', Transaction.date) == year
        ).scalar()

        result.append({
            "id": budget.id,
            "category": budget.category,
            "limit": budget.limit,
            "spent": spent,
            "remaining": budget.limit - spent,
            "month": month,
            "year": year
        })

    return jsonify(result), 200






@budget_bp.route('/add-budget', methods=['GET'])
@login_required
def add_budget():
    now = datetime.now()
    current_year = now.year
    current_month = now.month
    
    # Obtener parámetros GET con valores por defecto
    month = request.args.get('month', current_month)
    year = request.args.get('year', current_year)
    
    # Pasar datos a la plantilla
    return render_template('finances/add_budget.html',
        current_year=current_year,
        current_month=current_month,
        category=request.args.get('category', ''),
        limit=request.args.get('limit', ''),
        month=month,
        year=year
    )
    
 

@budget_bp.route('/view', methods=['GET'])
@login_required
def view_budgets():
    month = int(request.args.get('month', datetime.now().month))
    year = int(request.args.get('year', datetime.now().year))
    
    budgets = Budget.query.filter_by(
        user_id=current_user.id,
        month=month,
        year=year
    ).all()
    
    budget_data = []
    for budget in budgets:
        spent = budget.limit - budget.calculate_remaining()
        percentage_used = min((spent / budget.limit * 100) if budget.limit > 0 else 0, 100)
        
        budget_data.append({
            'id': budget.id,  # Asegúrate de incluir el ID
            'category': budget.category,
            'limit': budget.limit,
            'spent': spent,
            'remaining': budget.calculate_remaining(),
            'percentage_used': percentage_used  # Nombre consistente con la plantilla
        })
    
    return render_template('finances/view_budgets.html',
                         budgets=budget_data,
                         month=month,
                         year=year)

    

# Ruta corregida para editar presupuestos
@budget_bp.route('/edit/<int:budget_id>', methods=['POST'])
@login_required
def edit_budget(budget_id):
    budget = Budget.query.get_or_404(budget_id)
    
    # Verificar que el presupuesto pertenece al usuario actual
    if budget.user_id != current_user.id:
        return jsonify({'success': False, 'message': 'No autorizado'}), 403
    
    try:
        data = request.get_json()
        budget.category = data.get('category', budget.category)
        budget.limit = float(data.get('limit', budget.limit))
        db.session.commit()
        return jsonify({
            'success': True,
            'message': 'Presupuesto actualizado',
            'budget': budget.to_dict()
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': f'Error al actualizar: {str(e)}'
        }), 500



# Ruta para eliminar presupuestos
@budget_bp.route('/delete/<int:budget_id>', methods=['DELETE'])
@login_required
def delete_budget(budget_id):
    budget = Budget.query.get_or_404(budget_id)
    
    if budget.user_id != current_user.id:
        return jsonify({'success': False, 'message': 'No autorizado'}), 403
    
    try:
        db.session.delete(budget)
        db.session.commit()
        return jsonify({
            'success': True,
            'message': 'Presupuesto eliminado'
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': f'Error al eliminar: {str(e)}'
        }), 500