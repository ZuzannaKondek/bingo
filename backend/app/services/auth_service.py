"""Authentication service."""
from typing import Dict, Tuple
from flask_jwt_extended import create_access_token, create_refresh_token
from app.models.user import User
from app.extensions import db


def register_user(username: str, email: str, password: str) -> Tuple[User, Dict[str, str]]:
    """Register a new user.
    
    Args:
        username: User's username
        email: User's email
        password: User's password (plain text)
        
    Returns:
        Tuple of (User instance, tokens dict)
    """
    user = User(username=username, email=email)
    user.set_password(password)
    
    db.session.add(user)
    db.session.commit()
    
    tokens = generate_tokens(user)
    
    return user, tokens


def authenticate_user(username: str, password: str) -> Tuple[User | None, Dict[str, str] | None]:
    """Authenticate user and generate tokens.
    
    Args:
        username: User's username
        password: User's password (plain text)
        
    Returns:
        Tuple of (User instance, tokens dict) if successful, (None, None) otherwise
    """
    user = User.query.filter_by(username=username).first()
    
    if not user or not user.check_password(password):
        return None, None
    
    if not user.is_active:
        return None, None
    
    tokens = generate_tokens(user)
    
    return user, tokens


def generate_tokens(user: User) -> Dict[str, str]:
    """Generate access and refresh tokens for user.
    
    Args:
        user: User instance
        
    Returns:
        Dictionary with access_token and refresh_token
    """
    identity = {
        'id': user.id,
        'username': user.username,
    }
    
    access_token = create_access_token(identity=identity)
    refresh_token = create_refresh_token(identity=identity)
    
    return {
        'access_token': access_token,
        'refresh_token': refresh_token,
    }

