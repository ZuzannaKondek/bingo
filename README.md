# Bingo - Connect Four Game

A browser-based Connect Four game with three modes: vs AI, hot-seat (local), and online multiplayer. Single Flask application serving React frontend as static files.

## Features

- 🎮 **Three Game Modes**:
  - VS Computer 
  - Hot-seat (Local 2-player)
  - Online Multiplayer (Real-time via WebSockets)
- 🔐 **User Authentication** (JWT-based)
- 🎨 **Modern UI** (React + TypeScript + Tailwind CSS + Shadcn UI)
- 🐳 **Dockerized** (Single command setup)
- 🧪 **Tested** (pytest for backend)

## Architecture

This is a **single Flask application** that serves both the API and the React frontend as static files. The static files are built from the React source and committed to the repository because the deployment server does not have Node.js installed.

## Prerequisites

- **Docker** (with Docker Compose) - for development
- **Python 3.11+** - for production deployment
- **Node.js & npm** - only needed for building frontend (not required on deployment server)

## Quick Start

### Development (Docker)

1. **Clone the repository**:
   ```bash
   git clone <repo-url>
   cd bingo
   ```

2. **Start the application**:
   ```bash
   docker-compose up
   ```

3. **Access the application**:
   - **Frontend**: http://localhost:3000
   - **Backend API**: http://localhost:5000

### Production

The application runs as a single Flask server:

```bash
python3.11 backend/run.py
```

The server will serve both the API and frontend on the configured port (default: 12366).

## Building Frontend

Since static files are committed to the repository, rebuild the frontend when making changes:

```bash
./build.sh
```

This will:
1. Build the React app
2. Copy output to `backend/static/`
3. Remind you to commit the static files

**Note**: Static files in `backend/static/` are committed to the repo because the deployment server doesn't have Node.js.

## Development Workflow

### Running Tests

```bash
docker-compose exec backend pytest
```

With coverage:
```bash
docker-compose exec backend pytest --cov=app --cov-report=html
```

### Database Migrations

Create a migration:
```bash
docker-compose exec backend flask db migrate -m "Description of changes"
```

Apply migrations:
```bash
docker-compose exec backend flask db upgrade
```

## Project Structure

```
bingo/
├── docker-compose.yml       # Development setup
├── build.sh                 # Frontend build script
├── backend/
│   ├── static/              # Built React app (committed to repo)
│   ├── app/                 # Flask application
│   │   ├── __init__.py      # App factory (serves static files)
│   │   ├── models/          # SQLAlchemy models
│   │   ├── routes/          # API blueprints
│   │   ├── services/        # Business logic
│   │   └── schemas/         # Marshmallow schemas
│   ├── run.py               # Application entry point
│   └── tests/               # pytest tests
└── frontend/                # React source (builds to backend/static/)
    └── src/
        ├── components/      # React components
        ├── pages/           # Page components
        ├── store/           # Redux Toolkit
        └── services/        # API client
```

## Technology Stack

- **Backend**: Flask, SQLAlchemy, Flask-SocketIO, Flask-JWT-Extended
- **Frontend**: React + TypeScript, Vite, Tailwind CSS, Redux Toolkit
- **Database**: SQLite (dev), any RDBMS (prod)
- **Real-time**: Socket.IO

## Example .env

```bash
FLASK_ENV=development
FLASK_DEBUG=1
DATABASE_URL=sqlite:///bingo.db
JWT_SECRET_KEY=your-secret-key-here
PORT=12366  # Server port (default: 12366)
```

