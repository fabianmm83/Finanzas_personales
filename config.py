import os
from dotenv import load_dotenv
from pathlib import Path
from urllib.parse import urlparse

load_dotenv()

# Asegurar formato correcto para SQLAlchemy + PostgreSQL
def format_db_url(db_url):
    if db_url.startswith('postgres://'):
        return db_url.replace('postgres://', 'postgresql://', 1)
    return db_url

# Configuración de la URL de la base de datos
database_url = format_db_url(
    os.getenv('DATABASE_URL', 
    f"sqlite:///{os.path.join(Path(__file__).parent, 'instance', 'app.db')}")
)

class Config:
    SQLALCHEMY_DATABASE_URI = database_url
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SECRET_KEY = os.getenv('SECRET_KEY', os.urandom(24).hex())
    
    # Configuración adicional recomendada para PostgreSQL
    SQLALCHEMY_ENGINE_OPTIONS = {
        'pool_pre_ping': True,
        'pool_recycle': 300,
        'pool_size': 20,
        'max_overflow': 30
    }

    @classmethod
    def print_config(cls):
        print(f"Database URL: {cls.SQLALCHEMY_DATABASE_URI}")
        print(f"Secret Key: {'*'*20 if cls.SECRET_KEY else 'Not set'}")