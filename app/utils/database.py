from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import MetaData

# Convención para nombres de constraints (evita errores en migraciones)
naming_convention = {
    "ix": 'ix_%(column_0_label)s',
    "uq": "uq_%(table_name)s_%(column_0_name)s",
    "ck": "ck_%(table_name)s_%(column_0_name)s",
    "fk": "fk_%(table_name)s_%(column_0_name)s_%(referred_table_name)s",
    "pk": "pk_%(table_name)s"
}

db = SQLAlchemy(metadata=MetaData(naming_convention=naming_convention))

def init_db(app):
    """Inicializa la base de datos con la app Flask"""
    db.init_app(app)
    with app.app_context():
        db.create_all()