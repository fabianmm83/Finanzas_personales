# Personal Finance Manager

A web application built with Flask to help users manage their personal finances, track expenses, and maintain budgets.

## Features

- 👤 User Authentication & Authorization
- 💰 Transaction Management 
- 📊 Budget Planning & Tracking
- 📈 Financial Reports & Analytics
- 📱 Responsive Web Interface
- 📧 Notification System

## Tech Stack

- **Backend**: Python/Flask
- **Database**: SQLite (with SQLAlchemy)
- **Authentication**: Firebase Admin SDK
- **Deployment**: Docker & Fly.io
- **Frontend**: HTML, CSS, JavaScript
- **Migrations**: Alembic

## Project Structure

```
├── app/
│   ├── models/          # Database models
│   ├── routes/          # Application routes
│   ├── static/          # Static assets
│   ├── templates/       # HTML templates
│   └── utils/           # Utility functions
├── migrations/          # Database migrations
├── instance/           # Instance-specific files
├── logs/               # Application logs
└── config.py           # Configuration settings
```

## Setup & Installation

1. Clone the repository:
```bash
git clone [repository-url]
cd [project-directory]
```

2. Create and activate a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

5. Initialize the database:
```bash
flask db upgrade
```

## Running the Application

Development mode:
```bash
flask run
```

Production mode:
```bash
gunicorn run:app
```

## Docker Deployment

Build and run with Docker:
```bash
docker build -t personal-finance .
docker run -p 8000:8000 personal-finance
```
