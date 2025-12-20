import { useEffect, useState } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { initGame, makeMove as makeMoveAction, switchPlayer, setWinner, setGameStatus, setBoard, setCurrentPlayer } from '@/store/slices/game-slice'
import { selectBoard, selectCurrentPlayer, selectGameStatus, selectWinner } from '@/store/slices/game-slice'
import Board from '@/components/game/board'
import GameStatus from '@/components/game/game-status'
import { api } from '@/services/api'
import type { GameMode } from '@/types'

function Game() {
	const { mode } = useParams<{ mode: GameMode }>()
	const navigate = useNavigate()
	const dispatch = useDispatch()
	
	const board = useSelector(selectBoard)
	const currentPlayer = useSelector(selectCurrentPlayer)
	const status = useSelector(selectGameStatus)
	const winner = useSelector(selectWinner)
	
	const [gameId, setGameId] = useState<number | null>(null)
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState('')
	const [isProcessingMove, setIsProcessingMove] = useState(false)
	
	// Debug: Log state changes
	useEffect(() => {
		console.log('=== REDUX STATE UPDATE ===')
		console.log('Board state:', board)
		console.log('Board JSON:', JSON.stringify(board))
		console.log('Current player:', currentPlayer)
		console.log('Game status:', status)
		console.log('Board reference check:', board === board) // This will always be true, but helps with debugging
	}, [board, currentPlayer, status])
	
	// Force re-render check
	const [renderKey, setRenderKey] = useState(0)
	useEffect(() => {
		if (board && board.length > 0) {
			setRenderKey(prev => prev + 1)
		}
	}, [board])
	
	useEffect(() => {
		if (!mode) return
		
		// Initialize game
		const startGame = async () => {
			setLoading(true)
			setError('')
			
			try {
				let response
				if (mode === 'ai') {
					response = await api.post('/api/game/ai', { difficulty: 'easy' })
				} else if (mode === 'local') {
					response = await api.post('/api/game/local', {})
				}
				
				if (response) {
					const game = response.data
					console.log('Game created:', game)
					setGameId(game.id)
					dispatch(initGame({ mode, id: game.id }))
					// Set initial board state from server
					if (game.board_state) {
						console.log('Setting initial board:', game.board_state)
						const boardState = Array.isArray(game.board_state) ? game.board_state : []
						dispatch(setBoard(boardState))
					}
					// Set initial current player
					if (game.current_player) {
						dispatch(setCurrentPlayer(game.current_player as 1 | 2))
					}
				}
			} catch (err: any) {
				setError(err.response?.data?.error || 'Failed to create game')
			} finally {
				setLoading(false)
			}
		}
		
		startGame()
	}, [mode, dispatch])
	
	const handleColumnClick = async (column: number) => {
		console.log('Column clicked:', column, 'gameId:', gameId, 'status:', status, 'loading:', loading, 'isProcessingMove:', isProcessingMove)
		
		// Prevent multiple simultaneous clicks
		if (!gameId || status !== 'playing' || loading || isProcessingMove) {
			console.log('Early return - gameId:', gameId, 'status:', status, 'loading:', loading, 'isProcessingMove:', isProcessingMove)
			return
		}
		
		setIsProcessingMove(true)
		setLoading(true)
		
		try {
			console.log('Making move request to:', `/api/game/${gameId}/move`, 'column:', column)
			
			// First, optimistically show the player's move
			dispatch(makeMoveAction({ column, player: 1 }))
			
			const response = await api.post(`/api/game/${gameId}/move`, { column })
			const game = response.data
			console.log('Move response:', game)
			console.log('Board state from response:', game.board_state)
			console.log('Current player from response:', game.current_player)
			console.log('Game status:', game.status)
			console.log('AI move:', game.ai_move)
			
			// If there's an AI move, show "Yellow's turn" and add a random delay to simulate thinking
			if (game.ai_move && mode === 'ai' && game.status === 'playing') {
				// Update current player to show it's AI's turn (yellow)
				dispatch(setCurrentPlayer(2))
				
				// Random delay between 800ms and 2000ms to simulate AI "thinking"
				const minDelay = 800
				const maxDelay = 2000
				const randomDelay = Math.floor(Math.random() * (maxDelay - minDelay + 1)) + minDelay
				console.log(`AI thinking for ${randomDelay}ms...`)
				await new Promise(resolve => setTimeout(resolve, randomDelay))
			}
			
			// Update board from server - this includes both player and AI moves
			if (game.board_state) {
				console.log('Updating board with state:', game.board_state)
				console.log('Board state type:', typeof game.board_state, 'Is array:', Array.isArray(game.board_state))
				// Ensure we have a proper 2D array
				const boardState = Array.isArray(game.board_state) ? game.board_state : []
				console.log('Board state before dispatch:', JSON.stringify(boardState))
				console.log('Dispatching setBoard with:', boardState)
				dispatch(setBoard(boardState))
				console.log('setBoard dispatched')
			} else {
				console.warn('No board_state in response!', game)
			}
			
			// Update current player from server
			if (game.current_player !== undefined) {
				console.log('Updating current player to:', game.current_player)
				dispatch(setCurrentPlayer(game.current_player as 1 | 2))
			}
			
			// Check game status
			if (game.status === 'finished') {
				console.log('Game finished, winner:', game.winner)
				dispatch(setWinner(game.winner))
				dispatch(setGameStatus('finished'))
			} else if (game.status === 'draw') {
				console.log('Game is a draw')
				dispatch(setGameStatus('draw'))
			}
		} catch (err: any) {
			console.error('Move error:', err)
			setError(err.response?.data?.error || 'Failed to make move')
		} finally {
			setLoading(false)
			setIsProcessingMove(false)
		}
	}
	
	const handleNewGame = () => {
		window.location.reload()
	}
	
	if (!mode) {
		return <div>Invalid game mode</div>
	}
	
	if (loading && !gameId) {
		return (
			<div className='container mx-auto p-8 text-center'>
				<p>Loading game...</p>
			</div>
		)
	}
	
	return (
		<div className='container mx-auto p-8'>
			<div className='max-w-4xl mx-auto'>
				<div className='flex justify-between items-center mb-8'>
					<Link to='/' className='text-muted-foreground hover:text-foreground'>
						← Back to Home
					</Link>
					<h1 className='text-3xl font-bold'>
						{mode === 'ai' && 'VS Computer'}
						{mode === 'local' && 'Local 2-Player'}
						{mode === 'online' && 'Online Multiplayer'}
					</h1>
					<div className='w-32' />
				</div>
				
				{error && (
					<div className='bg-destructive/10 text-destructive border border-destructive rounded-lg p-3 mb-4'>
						{error}
					</div>
				)}
				
				<GameStatus currentPlayer={currentPlayer} status={status} winner={winner} />
				
				<div className='flex justify-center my-8'>
					{board && board.length > 0 ? (
						<Board
							key={`board-${renderKey}`}
							board={board}
							onColumnClick={handleColumnClick}
							disabled={loading || isProcessingMove || status === 'finished' || status === 'draw'}
						/>
					) : (
						<div>Loading board...</div>
					)}
				</div>
				
				{(status === 'finished' || status === 'draw') && (
					<div className='flex justify-center gap-4'>
						<button
							onClick={handleNewGame}
							className='bg-primary text-primary-foreground hover:bg-primary/90 rounded-md px-6 py-2 font-semibold'
						>
							New Game
						</button>
						<Link
							to='/'
							className='bg-secondary text-secondary-foreground hover:bg-secondary/80 rounded-md px-6 py-2 font-semibold'
						>
							Exit to Menu
						</Link>
					</div>
				)}
			</div>
		</div>
	)
}

export default Game

