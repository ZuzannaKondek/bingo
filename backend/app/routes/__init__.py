"""Blueprint registration."""
from flask import Flask


def register_blueprints(app: Flask) -> None:
    """Register all application blueprints.
    
    Args:
        app: Flask application instance
    """
    from app.routes.auth import auth_bp
    from app.routes.game import game_bp
    # from app.routes.lobby import lobby_bp
    
    app.register_blueprint(auth_bp)
    app.register_blueprint(game_bp)
    # app.register_blueprint(lobby_bp)

