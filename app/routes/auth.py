from flask import flash, Blueprint, request, redirect, url_for, render_template
from werkzeug.security import generate_password_hash, check_password_hash
from flask_login import login_user, login_required, logout_user, current_user
from app.models.user import User
from app import db, bcrypt

auth_bp = Blueprint('auth', __name__)






# Ruta para registrar un nuevo usuario
@auth_bp.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        # Obtener los datos del formulario
        username = request.form.get('username')
        email = request.form.get('email')
        password = request.form.get('password')

        # Validar si ya existe un usuario con el mismo email
        user = User.query.filter_by(email=email).first()
        if user:
            flash("Este email ya está registrado.", "error")
            return redirect(url_for('auth.register'))

        # Cifrar la contraseña
        hashed_password = bcrypt.generate_password_hash(password).decode('utf-8')

        # Crear un nuevo usuario
        new_user = User(username=username, email=email, hashed_password=hashed_password)
        
        try:
            # Guardar el usuario en la base de datos
            db.session.add(new_user)
            db.session.commit()
            
            # Iniciar sesión automáticamente
            login_user(new_user)
            flash("Registro exitoso. Bienvenido!", "success")
            return redirect(url_for('main.home'))  # Redirigir al home, no al dashboard
        except Exception as e:
            # Si ocurre un error, deshacer los cambios en la base de datos
            db.session.rollback()
            flash(f"Error al registrar el usuario: {str(e)}", "error")
            return redirect(url_for('auth.register'))

    # Si es una solicitud GET, renderizamos el formulario de registro
    return render_template('auth/register.html')






# Ruta para iniciar sesión
@auth_bp.route('/login', methods=['GET', 'POST'])
def login():
    # Verificar si el usuario ya está autenticado
    if current_user.is_authenticated:
        return redirect(url_for('main.dashboard'))  # Si ya está autenticado, redirigir al dashboard

    if request.method == 'POST':
        data = request.form  # Usar formulario (sin JSON)

        # Verificar si se pasaron los campos de email y contraseña
        if "email" not in data or "password" not in data:
            flash("Faltan campos obligatorios", "error")
            return redirect(url_for('auth.login'))

        # Verificar las credenciales del usuario
        user = User.query.filter_by(email=data['email']).first()

        if not user or not bcrypt.check_password_hash(user.hashed_password, data['password']):
            flash("Credenciales inválidas", "error")
            return redirect(url_for('auth.login'))

        # Autenticar al usuario con Flask-Login
        login_user(user)
        flash("Inicio de sesión exitoso", "success")
        return redirect(url_for('transactions.dashboard'))  


    return render_template('auth/login.html')




# Ruta para cerrar sesión
@auth_bp.route('/logout')
@login_required
def logout():
    logout_user()  # Cerrar sesión
    flash("Has cerrado sesión", "info")
    return redirect(url_for('main.home'))  # Redirigir al home
