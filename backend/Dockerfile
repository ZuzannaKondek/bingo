# Backend Dockerfile
FROM python:3.12-slim

WORKDIR /app

# Install uv package manager
RUN pip install uv

# Copy dependency files first (for better layer caching)
COPY pyproject.toml ./

# Install dependencies using uv
# Install the package which will pull in all dependencies from pyproject.toml
# We need to create a minimal setup to install dependencies
RUN uv pip install --system flask>=3.0.0 flask-sqlalchemy>=3.1.1 flask-migrate>=4.0.5 flask-jwt-extended>=4.6.0 flask-socketio>=5.3.6 flask-cors>=4.0.0 flask-marshmallow>=0.15.0 marshmallow>=3.20.1 marshmallow-sqlalchemy>=1.0.0 python-dotenv>=1.0.0 werkzeug>=3.0.0 python-socketio>=5.11.0 eventlet>=0.35.0

# Copy application code
COPY . .

# Expose port
EXPOSE 5000

# Run Flask development server
CMD ["flask", "run", "--host=0.0.0.0", "--reload"]

