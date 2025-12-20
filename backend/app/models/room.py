"""Room model for online multiplayer lobbies."""
from datetime import datetime
from app.extensions import db


class Room(db.Model):
    """Room model for managing online game lobbies."""
    
    __tablename__ = 'rooms'
    
    id: int = db.Column(db.Integer, primary_key=True)
    code: str = db.Column(db.String(6), unique=True, nullable=False, index=True)  # 6-character room code
    host_id: int = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    guest_id: int = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    game_id: int = db.Column(db.Integer, db.ForeignKey('games.id'), nullable=True)
    status: str = db.Column(db.String(20), nullable=False, default='waiting')  # 'waiting', 'playing', 'finished'
    created_at: datetime = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at: datetime = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Relationships
    host = db.relationship('User', foreign_keys=[host_id], backref='hosted_rooms')
    guest = db.relationship('User', foreign_keys=[guest_id], backref='joined_rooms')
    game = db.relationship('Game', backref='room', uselist=False)
    
    def to_dict(self) -> dict:
        """Convert room to dictionary.
        
        Returns:
            Dictionary representation of room
        """
        return {
            'id': self.id,
            'code': self.code,
            'host_id': self.host_id,
            'guest_id': self.guest_id,
            'game_id': self.game_id,
            'status': self.status,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat(),
        }
    
    def __repr__(self) -> str:
        """String representation."""
        return f'<Room {self.code} - {self.status}>'

