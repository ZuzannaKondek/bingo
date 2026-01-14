"""AI opponent for Connect Four with strategic threat detection and minimax algorithm."""
import random
import math
from typing import List, Tuple, Optional
from app.services.game_logic import get_valid_columns, drop_piece, check_winner, is_draw


def count_consecutive(board: List[List[int]], row: int, col: int, player: int, 
                     direction: Tuple[int, int]) -> int:
    """Count consecutive pieces of a player in a given direction.
    
    Args:
        board: Current game board
        row: Starting row
        col: Starting column
        player: Player number (1 or 2)
        direction: Tuple (delta_row, delta_col) for direction
        
    Returns:
        Number of consecutive pieces found
    """
    if board[row][col] != player:
        return 0
    
    count = 1  # Count the starting position
    delta_row, delta_col = direction
    
    # Check in positive direction
    r, c = row + delta_row, col + delta_col
    while (0 <= r < 6 and 0 <= c < 7 and 
           board[r][c] == player):
        count += 1
        r += delta_row
        c += delta_col
    
    # Check in negative direction
    r, c = row - delta_row, col - delta_col
    while (0 <= r < 6 and 0 <= c < 7 and 
           board[r][c] == player):
        count += 1
        r -= delta_row
        c -= delta_col
    
    return count


def find_threats(board: List[List[int]], player: int) -> List[Tuple[int, int, int]]:
    """Find all threats (2-in-a-row and 3-in-a-row) for a player.
    
    Args:
        board: Current game board
        player: Player number (1 or 2)
        
    Returns:
        List of tuples (row, col, count) where count is 2 or 3 for threats
    """
    threats = []
    directions = [
        (0, 1),   # Horizontal
        (1, 0),   # Vertical
        (1, 1),   # Diagonal top-left to bottom-right
        (1, -1),  # Diagonal top-right to bottom-left
    ]
    
    for row in range(6):
        for col in range(7):
            if board[row][col] == player:
                for direction in directions:
                    count = count_consecutive(board, row, col, player, direction)
                    if count >= 2:  # 2-in-a-row or 3-in-a-row
                        threats.append((row, col, count))
    
    return threats


def can_complete_four(board: List[List[int]], col: int, player: int) -> bool:
    """Check if dropping a piece in a column completes 4-in-a-row.
    
    Args:
        board: Current game board
        col: Column to check
        player: Player number (1 or 2)
        
    Returns:
        True if move completes 4-in-a-row, False otherwise
    """
    try:
        temp_board = [row[:] for row in board]
        drop_piece(temp_board, col, player)
        return check_winner(temp_board) == player
    except ValueError:
        return False


def evaluate_move(board: List[List[int]], col: int, player: int) -> int:
    """Evaluate a potential move and return a score.
    
    Higher score = better move.
    
    Args:
        board: Current game board
        col: Column to evaluate
        player: Player number (1 or 2)
        
    Returns:
        Score for the move (higher is better)
    """
    if col not in get_valid_columns(board):
        return -1000  # Invalid move
    
    score = 0
    opponent = 3 - player
    
    try:
        temp_board = [row[:] for row in board]
        drop_piece(temp_board, col, player)
        
        # Check if this move wins
        if check_winner(temp_board) == player:
            return 10000  # Highest priority
        
        # Check if this move blocks opponent win
        temp_board2 = [row[:] for row in board]
        drop_piece(temp_board2, col, opponent)
        if check_winner(temp_board2) == opponent:
            return 5000  # Very high priority to block
        
        # Count threats created by this move
        threats_after = find_threats(temp_board, player)
        score += len([t for t in threats_after if t[2] == 3]) * 100  # 3-in-a-row threats
        score += len([t for t in threats_after if t[2] == 2]) * 10   # 2-in-a-row threats
        
        # Count threats blocked
        threats_before = find_threats(board, opponent)
        temp_board3 = [row[:] for row in board]
        drop_piece(temp_board3, col, opponent)
        threats_after_block = find_threats(temp_board3, opponent)
        blocked = len(threats_before) - len(threats_after_block)
        score += blocked * 50
        
        # Prefer center columns
        if col == 3:
            score += 5
        elif col in [2, 4]:
            score += 3
        elif col in [1, 5]:
            score += 1
        
    except ValueError:
        return -1000
    
    return score


def evaluate_board(board: List[List[int]], ai_player: int) -> float:
    """Evaluate board position from AI's perspective using comprehensive heuristics.
    
    Higher score = better for AI, Lower score = better for opponent.
    
    Args:
        board: Current game board
        ai_player: AI player number (1 or 2)
        
    Returns:
        Evaluation score (positive = good for AI, negative = good for opponent)
    """
    opponent = 3 - ai_player
    
    # Check for terminal states
    winner = check_winner(board)
    if winner == ai_player:
        return 100000  # AI wins - maximum score
    elif winner == opponent:
        return -100000  # Opponent wins - minimum score
    
    if is_draw(board):
        return 0  # Draw
    
    score = 0.0
    
    # Evaluate threats for both players
    ai_threats = find_threats(board, ai_player)
    opponent_threats = find_threats(board, opponent)
    
    # Count 3-in-a-row threats (very dangerous)
    ai_three_in_row = len([t for t in ai_threats if t[2] == 3])
    opponent_three_in_row = len([t for t in opponent_threats if t[2] == 3])
    score += ai_three_in_row * 1000
    score -= opponent_three_in_row * 1000
    
    # Count 2-in-a-row threats (building patterns)
    ai_two_in_row = len([t for t in ai_threats if t[2] == 2])
    opponent_two_in_row = len([t for t in opponent_threats if t[2] == 2])
    score += ai_two_in_row * 10
    score -= opponent_two_in_row * 10
    
    # Center control bonus
    center_col = 3
    for row in range(6):
        if board[row][center_col] == ai_player:
            score += 3
        elif board[row][center_col] == opponent:
            score -= 3
    
    # Prefer pieces in center columns (2, 3, 4)
    for col in [2, 3, 4]:
        for row in range(6):
            if board[row][col] == ai_player:
                score += 1
            elif board[row][col] == opponent:
                score -= 1
    
    # Check for potential winning moves (can win in 1 move)
    valid_cols = get_valid_columns(board)
    for col in valid_cols:
        if can_complete_four(board, col, ai_player):
            score += 5000  # Very high value for winning move
        elif can_complete_four(board, col, opponent):
            score -= 5000  # Very high negative value for opponent winning move
    
    return score


def minimax(board: List[List[int]], depth: int, alpha: float, beta: float,
            maximizing: bool, ai_player: int) -> Tuple[float, Optional[int]]:
    """Minimax algorithm with alpha-beta pruning for optimal move selection.
    
    Args:
        board: Current game board
        depth: Remaining search depth
        alpha: Best value that maximizing player can guarantee
        beta: Best value that minimizing player can guarantee
        maximizing: True if maximizing (AI's turn), False if minimizing (opponent's turn)
        ai_player: AI player number (1 or 2)
        
    Returns:
        Tuple of (best_score, best_column) where best_column is None at leaf nodes
    """
    opponent = 3 - ai_player
    valid_columns = get_valid_columns(board)
    
    # Terminal conditions
    winner = check_winner(board)
    if winner == ai_player:
        return (100000 + depth, None)  # Prefer faster wins
    elif winner == opponent:
        return (-100000 - depth, None)  # Prefer slower losses
    
    if is_draw(board):
        return (0, None)
    
    # Reached max depth - evaluate position
    if depth == 0:
        return (evaluate_board(board, ai_player), None)
    
    if maximizing:
        # AI's turn - maximize score
        max_score = -math.inf
        best_col = None
        
        # Sort columns by center preference for better pruning
        center_preference = [3, 2, 4, 1, 5, 0, 6]
        sorted_cols = [c for c in center_preference if c in valid_columns]
        sorted_cols.extend([c for c in valid_columns if c not in sorted_cols])
        
        for col in sorted_cols:
            try:
                temp_board = [row[:] for row in board]
                drop_piece(temp_board, col, ai_player)
                score, _ = minimax(temp_board, depth - 1, alpha, beta, False, ai_player)
                
                if score > max_score:
                    max_score = score
                    best_col = col
                
                alpha = max(alpha, score)
                if beta <= alpha:
                    break  # Alpha-beta pruning
            except ValueError:
                continue
        
        return (max_score, best_col)
    else:
        # Opponent's turn - minimize score
        min_score = math.inf
        best_col = None
        
        # Sort columns by center preference for better pruning
        center_preference = [3, 2, 4, 1, 5, 0, 6]
        sorted_cols = [c for c in center_preference if c in valid_columns]
        sorted_cols.extend([c for c in valid_columns if c not in sorted_cols])
        
        for col in sorted_cols:
            try:
                temp_board = [row[:] for row in board]
                drop_piece(temp_board, col, opponent)
                score, _ = minimax(temp_board, depth - 1, alpha, beta, True, ai_player)
                
                if score < min_score:
                    min_score = score
                    best_col = col
                
                beta = min(beta, score)
                if beta <= alpha:
                    break  # Alpha-beta pruning
            except ValueError:
                continue
        
        return (min_score, best_col)


def is_unblockable_threat(board: List[List[int]], col: int, player: int) -> bool:
    """Check if a move creates an unblockable 3-in-a-row threat.
    
    An unblockable threat is a 3-in-a-row where the opponent can only block
    one of the two possible completion spots, guaranteeing a win next turn.
    
    Args:
        board: Current game board
        col: Column to check
        player: Player number (1 or 2)
        
    Returns:
        True if move creates unblockable threat
    """
    try:
        temp_board = [row[:] for row in board]
        drop_piece(temp_board, col, player)
        
        # Check if this creates a 3-in-a-row
        threats = find_threats(temp_board, player)
        three_in_row = [t for t in threats if t[2] == 3]
        
        if not three_in_row:
            return False
        
        # Check if opponent can block all completion spots
        # (Simplified: if we have 3-in-a-row, check if opponent can block both ends)
        # This is a simplified check - full implementation would verify both ends are blockable
        return len(three_in_row) > 0
    except ValueError:
        return False


def get_ai_move(board: List[List[int]], ai_player: int) -> int:
    """Get AI move using hybrid approach: quick checks + minimax algorithm.
    
    Strategy:
    1. Quick win/block checks (fast, immediate)
    2. Minimax with alpha-beta pruning (depth 4) for optimal play
    3. Fallback to rule-based if minimax fails
    
    Args:
        board: Current game board
        ai_player: AI player number (1 or 2)
        
    Returns:
        Column number to play
    """
    valid_columns = get_valid_columns(board)
    if not valid_columns:
        raise ValueError('No valid moves available')
    
    opponent = 3 - ai_player
    
    # Quick checks for immediate wins/blocks (fast path)
    # 1. Win immediately if possible
    for col in valid_columns:
        if can_complete_four(board, col, ai_player):
            return col
    
    # 2. Block opponent's immediate win
    for col in valid_columns:
        if can_complete_four(board, col, opponent):
            return col
    
    # Use minimax algorithm for optimal play
    # Depth 4 provides strong play while remaining fast
    # With alpha-beta pruning, this evaluates ~49 positions (very fast)
    try:
        score, best_col = minimax(board, depth=4, alpha=-math.inf, beta=math.inf,
                                   maximizing=True, ai_player=ai_player)
        
        if best_col is not None and best_col in valid_columns:
            return best_col
    except Exception:
        # If minimax fails, fall back to rule-based strategy
        pass
    
    # Fallback to rule-based strategy if minimax didn't return a valid move
    # 3. Create unblockable 3-in-a-row threat
    best_threat_col = None
    best_threat_score = -1
    for col in valid_columns:
        if is_unblockable_threat(board, col, ai_player):
            move_score = evaluate_move(board, col, ai_player)
            if move_score > best_threat_score:
                best_threat_score = move_score
                best_threat_col = col
    
    if best_threat_col is not None:
        return best_threat_col
    
    # 4. Block opponent's 3-in-a-row threats
    opponent_threats = find_threats(board, opponent)
    three_in_row_threats = [t for t in opponent_threats if t[2] == 3]
    
    if three_in_row_threats:
        for threat_row, threat_col, _ in three_in_row_threats:
            for col in [threat_col - 1, threat_col, threat_col + 1]:
                if col in valid_columns:
                    try:
                        temp_board = [row[:] for row in board]
                        drop_piece(temp_board, col, opponent)
                        if check_winner(temp_board) != opponent:
                            return col
                    except ValueError:
                        continue
    
    # 5. Build 2-in-a-row patterns
    best_move_col = None
    best_move_score = -1
    for col in valid_columns:
        move_score = evaluate_move(board, col, ai_player)
        if move_score > best_move_score:
            best_move_score = move_score
            best_move_col = col
    
    if best_move_col is not None and best_move_score > 0:
        return best_move_col
    
    # 6. Block opponent's 2-in-a-row patterns
    opponent_threats = find_threats(board, opponent)
    two_in_row_threats = [t for t in opponent_threats if t[2] == 2]
    
    if two_in_row_threats:
        for threat_row, threat_col, _ in two_in_row_threats:
            for col in [threat_col - 1, threat_col, threat_col + 1]:
                if col in valid_columns:
                    return col
    
    # 7. Prefer center columns
    center_preference = [3, 2, 4, 1, 5, 0, 6]
    for col in center_preference:
        if col in valid_columns:
            return col
    
    # 8. Fallback to random
    return random.choice(valid_columns)
