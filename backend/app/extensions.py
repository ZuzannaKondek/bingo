"""Flask extensions initialization."""
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_jwt_extended import JWTManager
from flask_marshmallow import Marshmallow
from flask_cors import CORS
from flask_socketio import SocketIO

db = SQLAlchemy()
migrate = Migrate()
jwt = JWTManager()
ma = Marshmallow()
cors = CORS()
socketio = SocketIO(cors_allowed_origins="*")


@jwt.expired_token_loader
def expired_token_callback(jwt_header, jwt_payload):
    """Handle expired token."""
    return {'error': 'Token has expired'}, 401


@jwt.invalid_token_loader
def invalid_token_callback(error):
    """Handle invalid token."""
    return {'error': f'Invalid token: {str(error)}'}, 422


@jwt.unauthorized_loader
def missing_token_callback(error):
    """Handle missing token."""
    return {'error': 'Authorization token is missing'}, 401

