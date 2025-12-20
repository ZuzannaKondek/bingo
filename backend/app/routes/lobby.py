"""Lobby blueprint for online multiplayer."""
import json
import random
import string
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.models import Room, Game, Player, User
from app.services import game_logic
from app.extensions import db
from app.routes.socketio_handlers import broadcast_room_update

lobby_bp = Blueprint('lobby', __name__, url_prefix='/api/lobby')


def generate_room_code() -> str:
    """Generate a unique 6-character room code.
    
    Returns:
        6-character uppercase alphanumeric code
    """
    while True:
        code = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
        if not Room.query.filter_by(code=code).first():
            return code


@lobby_bp.route('/create', methods=['POST'])
@jwt_required()
def create_room():
    """Create a new multiplayer room.
    
    Returns:
        JSON response with room data
    """
    try:
        identity = get_jwt_identity()
        print(f"JWT Identity received: {identity}, type: {type(identity)}")
        
        if not identity:
            return jsonify({'error': 'Invalid token - no identity'}), 401
        
        # Convert string identity to integer for database queries
        user_id = int(identity)
        
        # Check if user already has an active room
        existing_room = Room.query.filter(
            (Room.host_id == user_id) | (Room.guest_id == user_id),
            Room.status == 'waiting'
        ).first()
        
        if existing_room:
            return jsonify(existing_room.to_dict()), 200
        
        # Create new room
        room = Room(
            code=generate_room_code(),
            host_id=user_id,
            status='waiting'
        )
        db.session.add(room)
        db.session.commit()
        
        return jsonify(room.to_dict()), 201
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@lobby_bp.route('/join/<room_code>', methods=['POST'])
@jwt_required()
def join_room(room_code: str):
    """Join an existing room.
    
    Args:
        room_code: 6-character room code
        
    Returns:
        JSON response with room data
    """
    try:
        identity = get_jwt_identity()
        if not identity:
            return jsonify({'error': 'Invalid token'}), 401
        
        # Convert string identity to integer for database queries
        user_id = int(identity)
        
        # Find room
        room = Room.query.filter_by(code=room_code.upper()).first()
        if not room:
            return jsonify({'error': 'Room not found'}), 404
        
        # Check if room is full
        if room.guest_id is not None:
            return jsonify({'error': 'Room is full'}), 400
        
        # Check if user is trying to join their own room
        if room.host_id == user_id:
            return jsonify({'error': 'Cannot join your own room'}), 400
        
        # Check if room is in waiting status
        if room.status != 'waiting':
            return jsonify({'error': 'Room is not available'}), 400
        
        # Join room
        room.guest_id = user_id
        db.session.commit()
        
        # Refresh room from database to get latest state
        db.session.refresh(room)
        
        # Broadcast room update to all players in the room
        print(f'Guest {user_id} joined room {room.code}, broadcasting update')
        broadcast_room_update(room.code, room.to_dict())
        
        return jsonify(room.to_dict()), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@lobby_bp.route('/start/<int:room_id>', methods=['POST'])
@jwt_required()
def start_game(room_id: int):
    """Start a game in a room.
    
    Args:
        room_id: Room ID
        
    Returns:
        JSON response with game data
    """
    try:
        identity = get_jwt_identity()
        if not identity:
            return jsonify({'error': 'Invalid token'}), 401
        
        # Convert string identity to integer for database queries
        user_id = int(identity)
        
        # Find room
        room = Room.query.get(room_id)
        if not room:
            return jsonify({'error': 'Room not found'}), 404
        
        # Only the host can start the game
        if room.host_id != user_id:
            return jsonify({'error': 'Only the host can start the game'}), 403
        
        # Check if room is ready (has both players)
        if room.guest_id is None:
            return jsonify({'error': 'Waiting for second player'}), 400
        
        # Check if game already exists
        if room.game_id:
            game = Game.query.get(room.game_id)
            if game:
                return jsonify(game.to_dict()), 200
        
        # Create game
        board = game_logic.create_board()
        game = Game(
            game_mode='online',
            status='playing',
            current_player=1,
            board_state=json.dumps(board),
            owner_id=room.host_id
        )
        db.session.add(game)
        db.session.flush()
        
        # Create players
        host = User.query.get(room.host_id)
        guest = User.query.get(room.guest_id)
        
        player1 = Player(
            nickname=host.username,
            color='red',
            is_ai=False,
            game_id=game.id,
            player_number=1,
            user_id=room.host_id
        )
        player2 = Player(
            nickname=guest.username,
            color='yellow',
            is_ai=False,
            game_id=game.id,
            player_number=2,
            user_id=room.guest_id
        )
        db.session.add_all([player1, player2])
        
        # Link room to game
        room.game_id = game.id
        room.status = 'playing'
        db.session.commit()
        
        # Broadcast room update to all players in the room
        broadcast_room_update(room.code, room.to_dict())
        
        return jsonify(game.to_dict()), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@lobby_bp.route('/<int:room_id>', methods=['GET'])
@jwt_required()
def get_room(room_id: int):
    """Get room information.
    
    Args:
        room_id: Room ID
        
    Returns:
        JSON response with room data
    """
    try:
        room = Room.query.get(room_id)
        if not room:
            return jsonify({'error': 'Room not found'}), 404
        
        return jsonify(room.to_dict()), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@lobby_bp.route('/code/<room_code>', methods=['GET'])
@jwt_required()
def get_room_by_code(room_code: str):
    """Get room information by code.
    
    Args:
        room_code: 6-character room code
        
    Returns:
        JSON response with room data
    """
    try:
        room = Room.query.filter_by(code=room_code.upper()).first()
        if not room:
            return jsonify({'error': 'Room not found'}), 404
        
        return jsonify(room.to_dict()), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

