"""Core game logic for Connect Four."""
from typing import List, Tuple, Optional


def create_board() -> List[List[int]]:
    """Create an empty 6x7 game board.
    
    Returns:
        6x7 matrix initialized with zeros
    """
    return [[0 for _ in range(7)] for _ in range(6)]


def drop_piece(board: List[List[int]], column: int, player: int) -> Tuple[List[List[int]], int]:
    """Drop a piece in the specified column.
    
    Args:
        board: Current game board
        column: Column number (0-6)
        player: Player number (1 or 2)
        
    Returns:
        Tuple of (updated board, row where piece landed)
        
    Raises:
        ValueError: If column is full or invalid
    """
    if column < 0 or column > 6:
        raise ValueError('Invalid column number')
    
    # Find the lowest empty row in the column
    for row in range(5, -1, -1):
        if board[row][column] == 0:
            board[row][column] = player
            return board, row
    
    raise ValueError('Column is full')


def get_valid_columns(board: List[List[int]]) -> List[int]:
    """Get list of columns that aren't full.
    
    Args:
        board: Current game board
        
    Returns:
        List of valid column numbers
    """
    valid_columns = []
    for col in range(7):
        if board[0][col] == 0:  # Top row is empty
            valid_columns.append(col)
    return valid_columns


def check_winner(board: List[List[int]]) -> Optional[int]:
    """Check if there's a winner.
    
    Args:
        board: Current game board
        
    Returns:
        Player number (1 or 2) if winner found, None otherwise
    """
    # Check horizontal
    for row in range(6):
        for col in range(4):  # 0-3 for 4-in-a-row
            if board[row][col] != 0:
                if (board[row][col] == board[row][col + 1] == 
                    board[row][col + 2] == board[row][col + 3]):
                    return board[row][col]
    
    # Check vertical
    for row in range(3):  # 0-2 for 4-in-a-row
        for col in range(7):
            if board[row][col] != 0:
                if (board[row][col] == board[row + 1][col] == 
                    board[row + 2][col] == board[row + 3][col]):
                    return board[row][col]
    
    # Check diagonal (top-left to bottom-right)
    for row in range(3):
        for col in range(4):
            if board[row][col] != 0:
                if (board[row][col] == board[row + 1][col + 1] == 
                    board[row + 2][col + 2] == board[row + 3][col + 3]):
                    return board[row][col]
    
    # Check diagonal (bottom-left to top-right)
    for row in range(3, 6):
        for col in range(4):
            if board[row][col] != 0:
                if (board[row][col] == board[row - 1][col + 1] == 
                    board[row - 2][col + 2] == board[row - 3][col + 3]):
                    return board[row][col]
    
    return None


def is_draw(board: List[List[int]]) -> bool:
    """Check if the board is full (draw).
    
    Args:
        board: Current game board
        
    Returns:
        True if board is full, False otherwise
    """
    return all(board[0][col] != 0 for col in range(7))


def evaluate_position(board: List[List[int]], player: int) -> int:
    """Evaluate board position for AI (simple heuristic).
    
    Args:
        board: Current game board
        player: Player number to evaluate for
        
    Returns:
        Score for the position (higher is better)
    """
    score = 0
    opponent = 3 - player  # If player is 1, opponent is 2, and vice versa
    
    # Check if player can win
    for col in get_valid_columns(board):
        temp_board = [row[:] for row in board]  # Copy board
        try:
            drop_piece(temp_board, col, player)
            if check_winner(temp_board) == player:
                score += 100
        except ValueError:
            pass
    
    # Check if opponent can win (need to block)
    for col in get_valid_columns(board):
        temp_board = [row[:] for row in board]  # Copy board
        try:
            drop_piece(temp_board, col, opponent)
            if check_winner(temp_board) == opponent:
                score += 80
        except ValueError:
            pass
    
    # Prefer center column
    if len(board) > 0 and len(board[0]) > 3:
        center_col = board[0][3]
        if center_col == player:
            score += 3
    
    return score

