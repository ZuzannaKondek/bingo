# Bingo - Connect Four Game

A browser-based Connect Four game with three modes: vs AI, hot-seat (local), and online multiplayer. Built with Flask backend and React frontend.

## Features

- 🎮 **Three Game Modes**:
  - VS Computer (Easy/Hard AI)
  - Hot-seat (Local 2-player)
  - Online Multiplayer (Real-time via WebSockets)
- 🔐 **User Authentication** (JWT-based)
- 🎨 **Modern UI** (React + TypeScript + Tailwind CSS + Shadcn UI)
- 🐳 **Dockerized** (Single command setup)
- 🧪 **Tested** (pytest for backend)

## Prerequisites

- **Docker** (with Docker Compose)
- **Docker Compose** v2.0+

That's it! No need to install Python, Node.js, or any dependencies manually.

## Quick Start

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

The first startup will take a few minutes to build the images and install dependencies. Subsequent starts will be much faster.

## Development Workflow

### Hot Reload

Both frontend and backend support hot-reload during development:

- **Backend**: Flask debug mode automatically reloads on code changes
- **Frontend**: Vite HMR (Hot Module Replacement) instantly reflects changes

### Running Tests

**Backend tests** (pytest):
```bash
docker-compose exec backend pytest
```

**Backend tests with coverage**:
```bash
docker-compose exec backend pytest --cov=app --cov-report=html
```

### Database Migrations

**Create a migration**:
```bash
docker-compose exec backend flask db migrate -m "Description of changes"
```

**Apply migrations**:
```bash
docker-compose exec backend flask db upgrade
```

### Accessing Containers

**Backend shell**:
```bash
docker-compose exec backend sh
```

**Frontend shell**:
```bash
docker-compose exec frontend sh
```

## Project Structure

```
bingo/
├── docker-compose.yml       # Service orchestration
├── README.md
├── backend/                 # Flask API
│   ├── Dockerfile
│   ├── pyproject.toml       # Python dependencies (uv)
│   ├── app/                 # Application code
│   │   ├── __init__.py      # App factory
│   │   ├── models/          # SQLAlchemy models
│   │   ├── routes/          # API blueprints
│   │   ├── services/        # Business logic
│   │   └── schemas/         # Marshmallow schemas
│   └── tests/               # pytest tests
└── frontend/                # React app
    ├── Dockerfile
    ├── package.json
    └── src/
        ├── components/      # React components
        ├── pages/           # Page components
        ├── store/           # Redux Toolkit
        └── services/        # API client
```

## Technology Stack

### Backend
- **Framework**: Flask
- **ORM**: SQLAlchemy (SQLite dev, any RDBMS prod)
- **Migrations**: Flask-Migrate (Alembic)
- **Authentication**: Flask-JWT-Extended
- **Serialization**: Marshmallow
- **Real-time**: Flask-SocketIO
- **Testing**: pytest

### Frontend
- **Framework**: React + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS + Shadcn UI
- **State Management**: Redux Toolkit
- **Routing**: React Router
- **Real-time**: Socket.IO Client

## Environment Variables

### Backend (.env)
```bash
FLASK_ENV=development
FLASK_DEBUG=1
DATABASE_URL=sqlite:///bingo.db
JWT_SECRET_KEY=your-secret-key-here
```

### Frontend (.env)
```bash
VITE_API_URL=http://localhost:5000
```

## Troubleshooting

### Port already in use
If ports 3000 or 5000 are already in use:
```bash
# Stop the containers
docker-compose down

# Edit docker-compose.yml to use different ports
# Then restart
docker-compose up
```

### Database issues
Reset the database:
```bash
docker-compose down -v  # Remove volumes
docker-compose up
```

### Permission issues (Linux)
If you encounter permission issues:
```bash
sudo chown -R $USER:$USER backend frontend
```

### Rebuild containers
If dependencies have changed:
```bash
docker-compose build --no-cache
docker-compose up
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login and get tokens
- `POST /api/auth/logout` - Logout (revoke tokens)
- `POST /api/auth/refresh` - Refresh access token
- `GET /api/auth/me` - Get current user

### Game
- `POST /api/game/ai` - Create AI game
- `POST /api/game/local` - Create hot-seat game
- `POST /api/game/{id}/move` - Make a move
- `GET /api/game/{id}` - Get game state

### Lobby
- `POST /api/lobby/create` - Create multiplayer room
- `POST /api/lobby/join/{code}` - Join room by code

## License

MIT

