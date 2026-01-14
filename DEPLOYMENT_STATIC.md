# Static Flask Deployment Guide

This guide explains how to deploy the Bingo application as a single Flask process serving both static frontend files and the backend API/Socket.IO server.

## Overview

The application runs as a single Flask process that:
- Serves static frontend files (built with Vite)
- Handles API requests (`/api/*`)
- Manages Socket.IO WebSocket connections
- Runs on port 12199 (configurable via `PORT` environment variable)

## Prerequisites

### Server Requirements

- Python 3.11+ (available at `/usr/local/bin/python3.11`)
- Node.js and npm (for building frontend, if building on server)
- Git (for deployment)
- Write access to `/home/epi/myuser`

### Local Requirements (for building)

- Node.js and npm
- Git

## Deployment Options

### Option 1: Build Locally, Deploy Built Files

**Pros**: Faster server deployment, no Node.js needed on server  
**Cons**: Must commit built files to git

1. **Build frontend locally**:
   ```bash
   ./build.sh
   ```

2. **Commit built files** (ensure `backend/static/` is NOT in `.gitignore`):
   ```bash
   git add backend/static/
   git commit -m "Build frontend for deployment"
   git push
   ```

3. **Deploy on server**:
   ```bash
   ssh user@server
   cd /home/epi/myuser
   git pull
   
   # Install Python dependencies
   /usr/local/bin/python3.11 -m pip install --user -e backend/
   
   # Run database migrations
   cd backend
   export FLASK_APP=run:app
   /usr/local/bin/python3.11 -m flask db upgrade
   
   # Start the application
   /usr/local/bin/python3.11 run.py
   ```

### Option 2: Build on Server

**Pros**: No need to commit built files  
**Cons**: Requires Node.js on server

1. **Deploy source code**:
   ```bash
   ssh user@server
   cd /home/epi/myuser
   git pull
   ```

2. **Build on server** (if Node.js is available):
   ```bash
   ./build.sh
   ```

3. **Install dependencies and run** (same as Option 1, steps 3-5)

## Configuration

### Environment Variables

Set these environment variables before running:

```bash
export FLASK_ENV=production
export FLASK_DEBUG=False
export PORT=12199  # Optional, defaults to 12199
export DATABASE_URL=sqlite:///bingo.db  # Or your database URL
export JWT_SECRET_KEY=your-secret-key-here
export SECRET_KEY=your-secret-key-here
export CORS_ORIGINS=http://your-server.com:12199
```

### Python Path

The application uses Python 3.11 at `/usr/local/bin/python3.11`. If your Python is in a different location, update the commands accordingly.

## Running the Application

### Basic Run

```bash
cd /home/epi/myuser/backend
/usr/local/bin/python3.11 run.py
```

### With Environment Variables

```bash
cd /home/epi/myuser/backend
export FLASK_ENV=production
export PORT=12199
export JWT_SECRET_KEY=your-secret-key
export SECRET_KEY=your-secret-key
/usr/local/bin/python3.11 run.py
```

### Using nohup (Background Process)

```bash
cd /home/epi/myuser/backend
nohup /usr/local/bin/python3.11 run.py > app.log 2>&1 &
```

### Using screen (Detached Session)

```bash
screen -S bingo
cd /home/epi/myuser/backend
/usr/local/bin/python3.11 run.py
# Press Ctrl+A then D to detach
# Reattach with: screen -r bingo
```

## Project Structure After Build

```
/home/epi/myuser/
├── backend/
│   ├── static/          # Built frontend files (from build.sh)
│   │   ├── index.html
│   │   ├── assets/
│   │   └── ...
│   ├── app/
│   ├── run.py
│   └── ...
├── frontend/
└── build.sh
```

## Database Setup

### Initial Setup

```bash
cd /home/epi/myuser/backend
export FLASK_APP=run:app
/usr/local/bin/python3.11 -m flask db init  # Only needed once
/usr/local/bin/python3.11 -m flask db migrate -m "Initial migration"
/usr/local/bin/python3.11 -m flask db upgrade
```

### Running Migrations

```bash
cd /home/epi/myuser/backend
export FLASK_APP=run:app
/usr/local/bin/python3.11 -m flask db upgrade
```

## Troubleshooting

### Port Already in Use

If port 12199 is already in use:

```bash
# Find process using the port
lsof -i :12199

# Kill the process or use a different port
export PORT=12200
/usr/local/bin/python3.11 run.py
```

### Static Files Not Found

Ensure the frontend has been built:

```bash
# Check if static directory exists
ls -la backend/static/

# If missing, build it
./build.sh
```

### Socket.IO Connection Issues

Socket.IO should work automatically since everything is served from the same origin. If you encounter issues:

1. Check browser console for errors
2. Verify Flask-SocketIO is installed: `/usr/local/bin/python3.11 -m pip list | grep flask-socketio`
3. Check that eventlet is installed: `/usr/local/bin/python3.11 -m pip list | grep eventlet`

### Python Import Errors

If you get import errors:

```bash
# Install dependencies
/usr/local/bin/python3.11 -m pip install --user -e backend/

# Or install from requirements
/usr/local/bin/python3.11 -m pip install --user -r backend/requirements.txt
```

### Permission Issues

If you get permission errors:

```bash
# Install to user directory (--user flag)
/usr/local/bin/python3.11 -m pip install --user -e backend/

# Or use virtual environment (if allowed)
/usr/local/bin/python3.11 -m venv venv
source venv/bin/activate
pip install -e backend/
```

## Updating the Application

1. **Pull latest code**:
   ```bash
   cd /home/epi/myuser
   git pull
   ```

2. **Rebuild frontend** (if building on server):
   ```bash
   ./build.sh
   ```

3. **Run migrations** (if database schema changed):
   ```bash
   cd backend
   export FLASK_APP=run:app
   /usr/local/bin/python3.11 -m flask db upgrade
   ```

4. **Restart application**:
   - If using nohup: kill the process and restart
   - If using screen: restart in the screen session

## Security Considerations

1. **Use Strong Secrets**: Generate strong random keys for `JWT_SECRET_KEY` and `SECRET_KEY`
2. **Environment Variables**: Never commit `.env` files with secrets
3. **Database**: Consider using a proper database (PostgreSQL/MySQL) instead of SQLite for production
4. **HTTPS**: If possible, use a reverse proxy (nginx) with SSL certificates
5. **Firewall**: Configure firewall to only allow necessary ports

## Accessing the Application

Once running, the application will be available at:
- **Frontend**: `http://your-server:12199/`
- **API**: `http://your-server:12199/api/`
- **Health Check**: `http://your-server:12199/api/health`
- **Socket.IO**: Automatically connects via WebSocket on the same origin

## Development vs Production

The application automatically detects the environment:
- `FLASK_ENV=development` - Debug mode, detailed error pages
- `FLASK_ENV=production` - Production mode, minimal error pages

For production, always set:
```bash
export FLASK_ENV=production
export FLASK_DEBUG=False
```
