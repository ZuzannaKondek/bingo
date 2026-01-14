"""Flask application factory."""
import os
import sys
from pathlib import Path

# Add custom site-packages directory to Python path if it exists
# This handles cases where packages are installed in non-standard locations
# This must be done BEFORE importing any Flask extensions
app_dir = Path(__file__).parent
backend_dir = app_dir.parent

# Try multiple possible locations for custom site-packages
possible_paths = [
    backend_dir / 'app' / 'lib' / f'python{sys.version_info.major}.{sys.version_info.minor}' / 'site-packages',
    backend_dir / 'app' / 'lib' / 'python3.11' / 'site-packages',
    backend_dir / 'app' / 'lib' / 'site-packages',
    backend_dir / 'lib' / f'python{sys.version_info.major}.{sys.version_info.minor}' / 'site-packages',
]

for custom_site_packages in possible_paths:
    if custom_site_packages.exists() and str(custom_site_packages) not in sys.path:
        sys.path.insert(0, str(custom_site_packages))

from flask import Flask, send_from_directory
from app.config import config
from app.extensions import db, migrate, jwt, ma, cors, socketio


def create_app(config_name: str = None) -> Flask:
    """Create and configure the Flask application.
    
    Args:
        config_name: Configuration name (development, testing, production)
        
    Returns:
        Configured Flask application instance
    """
    if config_name is None:
        config_name = os.getenv('FLASK_ENV', 'development')
    
    # Create Flask app with static folder configuration
    static_folder = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'static')
    app = Flask(__name__, static_folder=static_folder, static_url_path='')
    app.config.from_object(config[config_name])
    
    # Initialize extensions
    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)
    ma.init_app(app)
    cors.init_app(app, origins=app.config['CORS_ORIGINS'])
    socketio.init_app(app)
    
    # Register blueprints (must be before static file serving)
    from app.routes import register_blueprints
    register_blueprints(app)
    
    # Register Socket.IO handlers
    from app.routes import socketio_handlers
    
    # Health check endpoint
    @app.route('/api/health', methods=['GET'])
    def health_check():
        """Health check endpoint."""
        return {'status': 'healthy', 'message': 'Bingo API is running'}, 200
    
    # Root route - serve index.html (must be before catch-all)
    @app.route('/')
    def index():
        """Serve the React app index.html."""
        return send_from_directory(static_folder, 'index.html')
    
    # Serve static files (catch-all for React Router, but exclude API and socket.io)
    @app.route('/<path:path>')
    def serve_static(path):
        """Serve static files from the static directory."""
        # Don't serve static files for API routes or socket.io
        if path.startswith('api/') or path == 'api' or path.startswith('socket.io/'):
            return {'error': 'Not found'}, 404
        
        # Check if it's a static file that exists
        file_path = os.path.join(static_folder, path)
        if os.path.exists(file_path) and os.path.isfile(file_path):
            return send_from_directory(static_folder, path)
        
        # Fallback to index.html for React Router (SPA routing)
        return send_from_directory(static_folder, 'index.html')
    
    return app

