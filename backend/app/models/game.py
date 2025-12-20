"""Game model."""
from datetime import datetime
from app.extensions import db


class Game(db.Model):
    """Game model for storing game state."""
    
    __tablename__ = 'games'
    
    id: int = db.Column(db.Integer, primary_key=True)
    game_mode: str = db.Column(db.String(20), nullable=False)  # 'ai', 'local', 'online'
    status: str = db.Column(db.String(20), nullable=False, default='waiting')  # 'waiting', 'playing', 'finished', 'draw'
    current_player: int = db.Column(db.Integer, nullable=False, default=1)  # 1 or 2
    board_state: str = db.Column(db.Text, nullable=False)  # JSON string of board matrix
    winner: int = db.Column(db.Integer, nullable=True)  # 1, 2, or NULL
    owner_id: int = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    created_at: datetime = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at: datetime = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Relationships
    players = db.relationship('Player', backref='game', lazy=True, cascade='all, delete-orphan')
    
    def to_dict(self) -> dict:
        """Convert game to dictionary.
        
        Returns:
            Dictionary representation of game
        """
        import json
        
        # Include players information
        players_dict = {}
        for player in self.players:
            players_dict[player.player_number] = player.to_dict()
        
        return {
            'id': self.id,
            'game_mode': self.game_mode,
            'status': self.status,
            'current_player': self.current_player,
            'board_state': json.loads(self.board_state) if self.board_state else None,
            'winner': self.winner,
            'owner_id': self.owner_id,
            'players': players_dict,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat(),
        }
    
    def __repr__(self) -> str:
        """String representation."""
        return f'<Game {self.id} - {self.game_mode}>'

