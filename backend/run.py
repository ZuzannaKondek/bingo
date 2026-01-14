"""Flask application entry point."""
import os
from app import create_app
from app.extensions import socketio

app = create_app()

if __name__ == '__main__':
    # Get port from environment variable or default to 12199
    port = int(os.getenv('PORT', 12199))
    # Get debug mode from environment (default to False for production)
    debug = os.getenv('FLASK_DEBUG', 'False').lower() == 'true'
    
    socketio.run(app, host='0.0.0.0', port=port, debug=debug)

