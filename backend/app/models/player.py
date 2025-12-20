"""Player model."""
from app.extensions import db


class Player(db.Model):
    """Player model for game participants."""
    
    __tablename__ = 'players'
    
    id: int = db.Column(db.Integer, primary_key=True)
    user_id: int = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)  # NULL for AI players
    nickname: str = db.Column(db.String(80), nullable=False)
    color: str = db.Column(db.String(20), nullable=False)  # 'red' or 'yellow'
    is_ai: bool = db.Column(db.Boolean, default=False, nullable=False)
    game_id: int = db.Column(db.Integer, db.ForeignKey('games.id'), nullable=False)
    player_number: int = db.Column(db.Integer, nullable=False)  # 1 or 2
    
    # Relationships
    user = db.relationship('User', backref='player_profiles')
    
    def to_dict(self) -> dict:
        """Convert player to dictionary.
        
        Returns:
            Dictionary representation of player
        """
        return {
            'id': self.id,
            'user_id': self.user_id,
            'nickname': self.nickname,
            'color': self.color,
            'is_ai': self.is_ai,
            'game_id': self.game_id,
            'player_number': self.player_number,
        }
    
    def __repr__(self) -> str:
        """String representation."""
        return f'<Player {self.nickname} - {self.color}>'

