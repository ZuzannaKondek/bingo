"""AI opponent for Connect Four."""
import random
from typing import List
from app.services.game_logic import get_valid_columns, drop_piece, check_winner


def get_ai_move_easy(board: List[List[int]]) -> int:
    """Get AI move for easy difficulty (random).
    
    Args:
        board: Current game board
        
    Returns:
        Column number to play
    """
    valid_columns = get_valid_columns(board)
    if not valid_columns:
        raise ValueError('No valid moves available')
    
    return random.choice(valid_columns)


def get_ai_move_hard(board: List[List[int]], ai_player: int) -> int:
    """Get AI move for hard difficulty (rule-based).
    
    Strategy:
    1. Check if AI can win - take it
    2. Check if opponent can win - block it
    3. Prefer center column
    4. Otherwise, pick randomly
    
    Args:
        board: Current game board
        ai_player: AI player number (1 or 2)
        
    Returns:
        Column number to play
    """
    valid_columns = get_valid_columns(board)
    if not valid_columns:
        raise ValueError('No valid moves available')
    
    opponent = 3 - ai_player  # If ai_player is 1, opponent is 2
    
    # 1. Check if AI can win
    for col in valid_columns:
        temp_board = [row[:] for row in board]  # Copy board
        try:
            drop_piece(temp_board, col, ai_player)
            if check_winner(temp_board) == ai_player:
                return col
        except ValueError:
            continue
    
    # 2. Check if opponent can win - block it
    for col in valid_columns:
        temp_board = [row[:] for row in board]  # Copy board
        try:
            drop_piece(temp_board, col, opponent)
            if check_winner(temp_board) == opponent:
                return col
        except ValueError:
            continue
    
    # 3. Prefer center column (column 3)
    if 3 in valid_columns:
        # 70% chance to play center
        if random.random() < 0.7:
            return 3
    
    # 4. Prefer columns near center
    center_preference = [3, 2, 4, 1, 5, 0, 6]
    for col in center_preference:
        if col in valid_columns:
            return col
    
    # Fallback to random
    return random.choice(valid_columns)

