"""Socket.IO event handlers for real-time multiplayer."""
from flask import request
from flask_jwt_extended import decode_token
from flask_socketio import emit, join_room, leave_room
from app.extensions import socketio, db
from app.models import Game, Room


def get_user_from_token(token: str):
    """Extract user ID from JWT token.
    
    Args:
        token: JWT token string
        
    Returns:
        User ID (integer) or None
    """
    try:
        decoded = decode_token(token)
        # The 'sub' claim contains the user ID as a string
        identity = decoded.get('sub')
        if identity:
            return int(identity)
        return None
    except (ValueError, TypeError, Exception):
        return None


@socketio.on('connect')
def handle_connect(auth):
    """Handle client connection."""
    token = auth.get('token') if auth else None
    if token:
        user_id = get_user_from_token(token)
        if user_id:
            request.user_id = user_id
            emit('connected', {'user_id': user_id})
        else:
            emit('error', {'message': 'Invalid token'})
            return False
    else:
        # Allow anonymous connections for now
        emit('connected')
    return True


@socketio.on('disconnect')
def handle_disconnect():
    """Handle client disconnection."""
    print(f'Client disconnected: {request.sid}')


@socketio.on('join_game')
def handle_join_game(data):
    """Join a game room for real-time updates.
    
    Args:
        data: Dictionary with 'game_id' key
    """
    game_id = data.get('game_id')
    if not game_id:
        emit('error', {'message': 'Game ID required'})
        return
    
    # Verify user has access to this game
    game = Game.query.get(game_id)
    if not game:
        emit('error', {'message': 'Game not found'})
        return
    
    # Join the game room
    room = f'game_{game_id}'
    join_room(room)
    emit('joined_game', {'game_id': game_id, 'room': room})


@socketio.on('leave_game')
def handle_leave_game(data):
    """Leave a game room.
    
    Args:
        data: Dictionary with 'game_id' key
    """
    game_id = data.get('game_id')
    if game_id:
        room = f'game_{game_id}'
        leave_room(room)
        emit('left_game', {'game_id': game_id})


@socketio.on('join_room')
def handle_join_room(data):
    """Join a lobby room.
    
    Args:
        data: Dictionary with 'room_code' key
    """
    room_code = data.get('room_code')
    if not room_code:
        emit('error', {'message': 'Room code required'})
        return
    
    room = Room.query.filter_by(code=room_code.upper()).first()
    if not room:
        emit('error', {'message': 'Room not found'})
        return
    
    # Join the room
    room_name = f'room_{room_code.upper()}'
    join_room(room_name)
    print(f'Client {request.sid} joined socket room: {room_name}')
    emit('joined_room', {'room_code': room_code, 'room': room.to_dict()})


@socketio.on('leave_room')
def handle_leave_room(data):
    """Leave a lobby room.
    
    Args:
        data: Dictionary with 'room_code' key
    """
    room_code = data.get('room_code')
    if room_code:
        room_name = f'room_{room_code.upper()}'
        leave_room(room_name)
        emit('left_room', {'room_code': room_code})


def broadcast_game_update(game_id: int, game_data: dict):
    """Broadcast game state update to all players in a game room.
    
    Args:
        game_id: Game ID
        game_data: Game state dictionary
    """
    room = f'game_{game_id}'
    socketio.emit('game_update', game_data, room=room)


def broadcast_room_update(room_code: str, room_data: dict):
    """Broadcast room state update to all players in a lobby room.
    
    Args:
        room_code: Room code
        room_data: Room state dictionary
    """
    room_name = f'room_{room_code.upper()}'
    print(f'Broadcasting room update to room: {room_name}, data: {room_data}')
    socketio.emit('room_update', room_data, room=room_name, namespace='/')


def broadcast_game_reset(game_id: int):
    """Broadcast game reset event to all players in a game room.
    
    Args:
        game_id: Game ID
    """
    room = f'game_{game_id}'
    print(f'Broadcasting game reset to room: {room}')
    socketio.emit('game_reset', {'game_id': game_id}, room=room, namespace='/')

