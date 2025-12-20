"""Game blueprint."""
import json
from flask import Blueprint, request, jsonify, session
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.models import Game, Player
from app.services import game_logic, ai
from app.extensions import db

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


@game_bp.route('/ai', methods=['POST'])
@jwt_required(optional=True)
def create_ai_game():
    """Create a new AI game.
    
    Returns:
        JSON response with game data
    """
    try:
        data = request.json or {}
        difficulty = data.get('difficulty', 'easy')  # 'easy' or 'hard'
        
        # Create empty board
        board = game_logic.create_board()
        
        # Get user if authenticated
        identity = get_jwt_identity()
        owner_id = identity['id'] if identity else None
        username = identity['username'] if identity else 'Player'
        
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
        
        # Store difficulty in session
        session[f'game_{game.id}_difficulty'] = difficulty
        
        return jsonify(game.to_dict()), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@game_bp.route('/<int:game_id>/move', methods=['POST'])
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
        db.session.commit()
        
        response_data = game.to_dict()
        
        # If AI game and game is still playing, make AI move
        if game.game_mode == 'ai' and game.status == 'playing' and game.current_player == 2:
            difficulty = session.get(f'game_{game_id}_difficulty', 'easy')
            
            # Get AI move
            if difficulty == 'hard':
                ai_column = ai.get_ai_move_hard(board, 2)
            else:
                ai_column = ai.get_ai_move_easy(board)
            
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
            
            game.board_state = json.dumps(board)
            db.session.commit()
            
            response_data = game.to_dict()
            response_data['ai_move'] = {'column': ai_column, 'row': ai_row}
        
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

