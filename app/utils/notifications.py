from datetime import datetime

def validate_transaction_data(data):
    """Valida los datos de una transacción"""
    errors = []
    
    if data['amount'] <= 0:
        errors.append("El monto debe ser positivo")
    if data['type'] not in ('ingreso', 'gasto'):
        errors.append("Tipo debe ser 'ingreso' o 'gasto'")
    try:
        datetime.strptime(data['date'], '%Y-%m-%d')
    except ValueError:
        errors.append("Formato de fecha inválido (YYYY-MM-DD)")
    
    return errors

def validate_budget_data(data):
    """Valida los datos de un presupuesto"""
    errors = []
    if data['limit'] <= 0:
        errors.append("El límite debe ser positivo")
    if not 1 <= data['month'] <= 12:
        errors.append("Mes inválido (1-12)")
    if data['year'] < 2000:
        errors.append("Año inválido")
    
    return errors