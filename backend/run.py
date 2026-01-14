"""Flask application entry point."""
import os
import sys
from pathlib import Path

# Add custom site-packages directory to Python path if it exists
# This handles cases where packages are installed in non-standard locations
backend_dir = Path(__file__).parent

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
        break

from app import create_app
from app.extensions import socketio

app = create_app()

if __name__ == '__main__':
    # Get port from environment variable or default to 12199
    port = int(os.getenv('PORT', 12199))
    # Get debug mode from environment (default to False for production)
    debug = os.getenv('FLASK_DEBUG', 'False').lower() == 'true'
    
    socketio.run(app, host='0.0.0.0', port=port, debug=debug)

