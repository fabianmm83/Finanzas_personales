from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

from app.models.user import User
from app.models.budget import Budget
from app.models.transaction import Transaction
