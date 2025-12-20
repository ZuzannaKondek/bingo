"""Tests for game logic."""
import pytest
from app.services import game_logic


def test_create_board():
    """Test board creation."""
    board = game_logic.create_board()
    
    assert len(board) == 6  # 6 rows
    assert len(board[0]) == 7  # 7 columns
    assert all(cell == 0 for row in board for cell in row)  # All empty


def test_drop_piece():
    """Test dropping a piece."""
    board = game_logic.create_board()
    
    board, row = game_logic.drop_piece(board, 3, 1)
    
    assert row == 5  # Bottom row
    assert board[5][3] == 1


def test_drop_piece_stacking():
    """Test pieces stack on top of each other."""
    board = game_logic.create_board()
    
    board, row1 = game_logic.drop_piece(board, 3, 1)
    board, row2 = game_logic.drop_piece(board, 3, 2)
    
    assert row1 == 5
    assert row2 == 4
    assert board[5][3] == 1
    assert board[4][3] == 2


def test_get_valid_columns():
    """Test getting valid columns."""
    board = game_logic.create_board()
    
    valid = game_logic.get_valid_columns(board)
    assert len(valid) == 7  # All columns valid
    
    # Fill one column
    for _ in range(6):
        board, _ = game_logic.drop_piece(board, 0, 1)
    
    valid = game_logic.get_valid_columns(board)
    assert len(valid) == 6  # One column full
    assert 0 not in valid


def test_check_winner_horizontal():
    """Test horizontal win detection."""
    board = game_logic.create_board()
    
    # Create horizontal win for player 1
    for col in range(4):
        board[5][col] = 1
    
    winner = game_logic.check_winner(board)
    assert winner == 1


def test_check_winner_vertical():
    """Test vertical win detection."""
    board = game_logic.create_board()
    
    # Create vertical win for player 2
    for row in range(4):
        board[row][3] = 2
    
    winner = game_logic.check_winner(board)
    assert winner == 2


def test_check_winner_diagonal():
    """Test diagonal win detection."""
    board = game_logic.create_board()
    
    # Create diagonal win for player 1
    board[5][0] = 1
    board[4][1] = 1
    board[3][2] = 1
    board[2][3] = 1
    
    winner = game_logic.check_winner(board)
    assert winner == 1


def test_is_draw():
    """Test draw detection."""
    board = game_logic.create_board()
    
    assert not game_logic.is_draw(board)
    
    # Fill entire board
    for col in range(7):
        for row in range(6):
            board[row][col] = (col + row) % 2 + 1  # Alternate players
    
    assert game_logic.is_draw(board)

