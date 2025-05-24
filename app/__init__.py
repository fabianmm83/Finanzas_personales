from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager
from flask_jwt_extended import JWTManager
from flask_migrate import Migrate
from flask_bcrypt import Bcrypt
from config import Config
import logging
from logging.handlers import RotatingFileHandler
import os
import firebase_admin
from firebase_admin import credentials # Esta importación ya estaba, la dejamos.
# Necesitarás importar auth, firestore o db aquí o en otros archivos
# según los servicios de Firebase que uses con el Admin SDK.
# from firebase_admin import auth
# from firebase_admin import firestore
# from firebase_admin import db


# Inicialización de extensiones (sin app context todavía)
db = SQLAlchemy()
migrate = Migrate()
login_manager = LoginManager()
jwt = JWTManager()
bcrypt = Bcrypt()

def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    # ** AQUÍ AÑADIMOS LA INICIALIZACIÓN DEL ADMIN SDK **
    # Si GOOGLE_APPLICATION_CREDENTIALS está configurada, el SDK la usará automáticamente.
    # Si no, buscará otras credenciales por defecto del entorno.
    # Solo se inicializa una vez, idealmente al crear la app.
    try:
        # Intenta obtener la app por defecto. Si ya existe, no hacemos nada.
        firebase_admin.get_app()
    except ValueError:
        # Si no existe la app por defecto, la inicializamos.
        # Puedes pasar un nombre si inicializas múltiples apps,
        # pero para una sola app, dejar el nombre por defecto es común.
        firebase_admin.initialize_app()
        app.logger.info('Firebase Admin SDK inicializado.')
    except Exception as e:
         app.logger.error(f'❌ Error al inicializar Firebase Admin SDK: {str(e)}')


    # Configuración adicional para PostgreSQL en producción
    if app.config['SQLALCHEMY_DATABASE_URI'].startswith('postgresql'):
        app.config.update({
            'SQLALCHEMY_ENGINE_OPTIONS': {
                'pool_pre_ping': True,
                'pool_recycle': 300,
                'pool_size': 10,
                'max_overflow': 20,
                'pool_timeout': 30
            }
        })

    # Inicializar extensiones
    db.init_app(app)
    migrate.init_app(app, db)
    login_manager.init_app(app)
    jwt.init_app(app)
    bcrypt.init_app(app)

    # Configuración de login_manager
    login_manager.login_view = 'auth.login'
    login_manager.login_message_category = 'info'

    # Configurar logging en producción
    if not app.debug:
        if not os.path.exists('logs'):
            os.mkdir('logs')
        file_handler = RotatingFileHandler('logs/finanzas.log', maxBytes=10240, backupCount=10)
        file_handler.setFormatter(logging.Formatter(
            '%(asctime)s %(levelname)s: %(message)s [in %(pathname)s:%(lineno)d]'))
        file_handler.setLevel(logging.INFO)
        app.logger.addHandler(file_handler)
        app.logger.setLevel(logging.INFO)
        app.logger.info('Inicio de Finanzas Personales')

    # Registrar blueprints
    register_blueprints(app)

    # Registrar comandos CLI personalizados
    register_commands(app)

    return app

def register_blueprints(app):
    """Registra todos los blueprints de la aplicación"""
    from app.routes.main import main_bp
    from app.routes.auth import auth_bp
    from app.routes.budgets import budget_bp
    from app.routes.transactions import transactions_bp
    from app.routes.reports import report_bp

    app.register_blueprint(main_bp)
    app.register_blueprint(auth_bp, url_prefix='/auth')
    app.register_blueprint(budget_bp, url_prefix='/api/budgets')
    app.register_blueprint(transactions_bp, url_prefix='/api/transactions')
    app.register_blueprint(report_bp, url_prefix='/api/reports')

def register_commands(app):
    """Registra comandos CLI personalizados"""
    @app.cli.command('init-db')
    def init_db():
        """Inicializa la base de datos"""
        db.create_all()
        app.logger.info('Base de datos inicializada')

    @app.cli.command('check-db')
    def check_db():
        """Verifica la conexión a la base de datos"""
        try:
            db.session.execute('SELECT 1')
            app.logger.info('✅ Conexión a la base de datos exitosa!')
        except Exception as e:
              app.logger.error(f'❌ Error de conexión a la base de datos: {str(e)}')



