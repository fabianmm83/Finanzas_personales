import os
from dotenv import load_dotenv

load_dotenv()  # Carga variables de .env

class Config:
    SECRET_KEY = os.getenv('SECRET_KEY', 'dev-key-segura')
    SQLALCHEMY_DATABASE_URI = os.getenv('DATABASE_URL', 'sqlite:///finanzas.db')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', 'jwt-key-segura')
    MAIL_SERVER = os.getenv('MAIL_SERVER')  # Para notificaciones

class DevelopmentConfig(Config):
    DEBUG = True

class ProductionConfig(Config):
    DEBUG = False