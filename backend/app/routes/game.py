"""Game blueprint."""
import json
from flask import Blueprint, request, jsonify, session
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from app.models import Game, Player
from app.services import game_logic, ai
from app.extensions import db
from app.routes.socketio_handlers import broadcast_game_update

game_bp = Blueprint('game', __name__, url_prefix='/api/game')


@game_bp.route('/local', methods=['POST'])
def create_local_game():
    """Create a new local (hot-seat) game.
    
    Returns:
        JSON response with game data
    """
    try:
        data = request.json or {}
        
        # Create empty board
        board = game_logic.create_board()
        
        # Create game
        game = Game(
            game_mode='local',
            status='playing',
            current_player=1,
            board_state=json.dumps(board)
        )
        db.session.add(game)
        db.session.commit()
        
        # Store game ID in session
        session['game_id'] = game.id
        
        return jsonify(game.to_dict()), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500
#C4f1n7f5t9


@game_bp.route('/ai', methods=['POST'])
@jwt_required(optional=True)
def create_ai_game():
    """Create a new AI game.
    
    Returns:
        JSON response with game data
    """
    try:
        # Create empty board
        board = game_logic.create_board()
        
        # Get user if authenticated
        identity = get_jwt_identity()
        if identity:
            # Convert string identity to integer for database queries
            owner_id = int(identity)
            # Get username from JWT claims if available
            jwt_data = get_jwt()
            username = jwt_data.get('username', 'Player')
        else:
            owner_id = None
            username = 'Player'
        
        # Create game
        game = Game(
            game_mode='ai',
            status='playing',
            current_player=1,
            board_state=json.dumps(board),
            owner_id=owner_id
        )
        db.session.add(game)
        db.session.flush()
        
        # Create players
        player1 = Player(
            nickname=username,
            color='red',
            is_ai=False,
            game_id=game.id,
            player_number=1,
            user_id=owner_id
        )
        player2 = Player(
            nickname='Computer',
            color='yellow',
            is_ai=True,
            game_id=game.id,
            player_number=2
        )
        db.session.add_all([player1, player2])
        db.session.commit()
        
        return jsonify(game.to_dict()), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@game_bp.route('/<int:game_id>/move', methods=['POST'])
@jwt_required(optional=True)
def make_move(game_id: int):
    """Make a move in a game.
    
    Args:
        game_id: Game ID
        
    Returns:
        JSON response with updated game state
    """
    try:
        data = request.json
        column = data.get('column')
        
        if column is None or column < 0 or column > 6:
            return jsonify({'error': 'Invalid column'}), 400
        
        # Get game
        game = Game.query.get(game_id)
        if not game:
            return jsonify({'error': 'Game not found'}), 404
        
        if game.status != 'playing':
            return jsonify({'error': 'Game is not active'}), 400
        
        # For online games, verify it's the current player's turn
        if game.game_mode == 'online':
            identity = get_jwt_identity()
            if not identity:
                return jsonify({'error': 'Authentication required'}), 401
            
            user_id = int(identity)
            
            # Find the player for this user
            player = None
            for p in game.players:
                if p.user_id == user_id:
                    player = p
                    break
            
            if not player:
                return jsonify({'error': 'You are not a player in this game'}), 403
            
            # Check if it's this player's turn
            if game.current_player != player.player_number:
                return jsonify({'error': 'It is not your turn'}), 400
        
        # Load board
        board = json.loads(game.board_state)
        
        # Make player move
        try:
            board, row = game_logic.drop_piece(board, column, game.current_player)
        except ValueError as e:
            return jsonify({'error': str(e)}), 400
        
        # Check for winner
        winner = game_logic.check_winner(board)
        if winner:
            game.status = 'finished'
            game.winner = winner
        elif game_logic.is_draw(board):
            game.status = 'draw'
        else:
            # Switch player
            game.current_player = 3 - game.current_player
        
        game.board_state = json.dumps(board)
        
        # Update room status if game finished
        if game.game_mode == 'online' and game.status in ['finished', 'draw']:
            from app.models.room import Room
            room = Room.query.filter_by(game_id=game_id).first()
            if room:
                room.status = 'finished'
        
        db.session.commit()
        
        response_data = game.to_dict()
        
        # Broadcast update for online games
        if game.game_mode == 'online':
            broadcast_game_update(game_id, response_data)
            # Also broadcast room update if game finished
            if game.status in ['finished', 'draw']:
                from app.routes.socketio_handlers import broadcast_room_update
                room = Room.query.filter_by(game_id=game_id).first()
                if room:
                    broadcast_room_update(room.code, room.to_dict())
        
        # If AI game and game is still playing, make AI move
        if game.game_mode == 'ai' and game.status == 'playing' and game.current_player == 2:
            # Get AI move using strategic AI
            ai_column = ai.get_ai_move(board, 2)
            
            # Make AI move
            board, ai_row = game_logic.drop_piece(board, ai_column, 2)
            
            # Check for winner
            winner = game_logic.check_winner(board)
            if winner:
                game.status = 'finished'
                game.winner = winner
            elif game_logic.is_draw(board):
                game.status = 'draw'
            else:
                game.current_player = 1
            
            # Update room status if game finished (for online games)
            if game.game_mode == 'online' and game.status in ['finished', 'draw']:
                from app.models.room import Room
                room = Room.query.filter_by(game_id=game_id).first()
                if room:
                    room.status = 'finished'
            
            game.board_state = json.dumps(board)
            db.session.commit()
            
            response_data = game.to_dict()
            response_data['ai_move'] = {'column': ai_column, 'row': ai_row}
            
            # Broadcast update for AI move
            if game.game_mode == 'online':
                broadcast_game_update(game_id, response_data)
        
        return jsonify(response_data), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@game_bp.route('/<int:game_id>', methods=['GET'])
def get_game(game_id: int):
    """Get game state.
    
    Args:
        game_id: Game ID
        
    Returns:
        JSON response with game data
    """
    try:
        game = Game.query.get(game_id)
        if not game:
            return jsonify({'error': 'Game not found'}), 404
        
        return jsonify(game.to_dict()), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@game_bp.route('/<int:game_id>/reset', methods=['POST'])
@jwt_required(optional=True)
def reset_game(game_id: int):
    """Reset game - broadcast to all players to return to lobby.
    
    Args:
        game_id: Game ID
        
    Returns:
        JSON response confirming reset
    """
    try:
        game = Game.query.get(game_id)
        if not game:
            return jsonify({'error': 'Game not found'}), 404
        
        # Only allow reset for online games
        if game.game_mode != 'online':
            return jsonify({'error': 'Can only reset online games'}), 400
        
        # Find the room associated with this game
        from app.models.room import Room
        room = Room.query.filter_by(game_id=game_id).first()
        
        # Broadcast game reset to all players in the game room
        from app.routes.socketio_handlers import broadcast_game_reset
        broadcast_game_reset(game_id)
        
        # Also broadcast room update to return room to waiting status
        if room:
            room.status = 'waiting'
            room.game_id = None
            db.session.commit()
            from app.routes.socketio_handlers import broadcast_room_update
            broadcast_room_update(room.code, room.to_dict())
        
        return jsonify({'message': 'Game reset, returning to lobby'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

