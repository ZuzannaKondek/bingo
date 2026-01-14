import { useEffect, useState, useRef } from 'react'
import { Link, useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { initGame, makeMove as makeMoveAction, setWinner, setGameStatus, setBoard, setCurrentPlayer, resetGame } from '@/store/slices/game-slice'
import { selectBoard, selectCurrentPlayer, selectGameStatus, selectWinner } from '@/store/slices/game-slice'
import { selectCurrentUser } from '@/store/slices/auth-slice'
import Board from '@/components/game/board'
import GameStatus from '@/components/game/game-status'
import { api } from '@/services/api'
import { socketService } from '@/services/socket'
import type { GameMode, Player as PlayerType } from '@/types'

function Game() {
	const { mode } = useParams<{ mode: GameMode }>()
	const navigate = useNavigate()
	const dispatch = useDispatch()
	const [searchParams] = useSearchParams()
	const gameIdFromUrl = searchParams.get('gameId')
	
	const board = useSelector(selectBoard)
	const currentPlayer = useSelector(selectCurrentPlayer)
	const status = useSelector(selectGameStatus)
	const winner = useSelector(selectWinner)
	const currentUser = useSelector(selectCurrentUser)
	
	const [gameId, setGameId] = useState<number | null>(null)
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState('')
	const [isProcessingMove, setIsProcessingMove] = useState(false)
	const [players, setPlayers] = useState<{ [key: number]: PlayerType }>({})
	const [myPlayerNumber, setMyPlayerNumber] = useState<number | null>(null)
	const gameHandlersRef = useRef<{ handleGameUpdate?: (data: any) => void; handleGameReset?: (data: any) => void }>({})
	
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
					response = await api.post('/api/game/ai', {})
				} else if (mode === 'local') {
					response = await api.post('/api/game/local', {})
				} else if (mode === 'online' && gameIdFromUrl) {
					// For online mode, fetch existing game
					response = await api.get(`/api/game/${gameIdFromUrl}`)
				}
				
				if (response) {
					const game = response.data
					console.log('Game created/loaded:', game)
					const gameId = game.id || parseInt(gameIdFromUrl || '0')
					setGameId(gameId)
					dispatch(initGame({ mode, id: gameId }))
					
					// Set players information
					if (game.players) {
						setPlayers(game.players)
						// Determine which player the current user is
						if (currentUser && mode === 'online') {
							for (const [playerNum, player] of Object.entries(game.players)) {
								if ((player as PlayerType).user_id === currentUser.id) {
									setMyPlayerNumber(parseInt(playerNum))
									break
								}
							}
						} else if (mode === 'ai' || mode === 'local') {
							// For AI/local games, player 1 is always the current user
							setMyPlayerNumber(1)
						}
					}
					
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
					
					// For online mode, connect to Socket.IO
					if (mode === 'online' && gameId) {
						const token = localStorage.getItem('accessToken')
						if (token) {
							// Connect and join game
							socketService.connect(token)
								.then(() => socketService.joinGame(gameId))
								.then(() => {
									console.log('Successfully connected and joined game:', gameId)
								})
								.catch((error) => {
									console.error('Failed to connect to game socket:', error)
									setError('Failed to establish game connection. Please refresh.')
								})
							
							// Set up game update handler
							const handleGameUpdate = (gameData: any) => {
								console.log('Game update received:', gameData)
								if (gameData.players) {
									setPlayers(gameData.players)
								}
								if (gameData.board_state) {
									const boardState = Array.isArray(gameData.board_state) ? gameData.board_state : []
									dispatch(setBoard(boardState))
								}
								if (gameData.current_player !== undefined) {
									dispatch(setCurrentPlayer(gameData.current_player as 1 | 2))
								}
								if (gameData.status === 'finished') {
									dispatch(setWinner(gameData.winner))
									dispatch(setGameStatus('finished'))
								} else if (gameData.status === 'draw') {
									dispatch(setGameStatus('draw'))
								}
							}
							
							// Set up game reset handler
							const handleGameReset = (data: any) => {
								console.log('Game reset received:', data)
								// Navigate both players back to lobby
								navigate('/lobby')
							}
							
							socketService.onGameUpdate(handleGameUpdate)
							socketService.on('game_reset', handleGameReset)
							
							// Store handlers for cleanup
							gameHandlersRef.current = { handleGameUpdate, handleGameReset }
						}
					}
				}
			} catch (err: any) {
				setError(err.response?.data?.error || 'Failed to create/load game')
			} finally {
				setLoading(false)
			}
		}
		
		startGame()
		
		// Cleanup for online mode
		return () => {
			if (mode === 'online' && gameId) {
				socketService.leaveGame(gameId)
				// Clean up socket listeners
				const handlers = gameHandlersRef.current
				if (handlers.handleGameUpdate) {
					socketService.offGameUpdate(handlers.handleGameUpdate)
				}
				if (handlers.handleGameReset) {
					socketService.off('game_reset', handlers.handleGameReset)
				}
				gameHandlersRef.current = {}
			}
		}
	}, [mode, dispatch, gameIdFromUrl, currentUser, navigate])
	
	const handleColumnClick = async (column: number) => {
		console.log('Column clicked:', column, 'gameId:', gameId, 'status:', status, 'loading:', loading, 'isProcessingMove:', isProcessingMove)
		
		// Prevent multiple simultaneous clicks
		if (!gameId || status !== 'playing' || loading || isProcessingMove) {
			console.log('Early return - gameId:', gameId, 'status:', status, 'loading:', loading, 'isProcessingMove:', isProcessingMove)
			return
		}
		
		// For online games, check if it's the current user's turn
		if (mode === 'online' && myPlayerNumber !== null) {
			if (currentPlayer !== myPlayerNumber) {
				setError('It is not your turn')
				return
			}
		}
		
		// For local games, check if it's the current player's turn
		if (mode === 'local') {
			// In local mode, currentPlayer already indicates whose turn it is
			// No additional check needed as both players are the same user
		}
		
		// For AI games, player 1 is always the user
		if (mode === 'ai' && currentPlayer !== 1) {
			setError('Wait for the computer to make its move')
			return
		}
		
		setIsProcessingMove(true)
		setLoading(true)
		setError('') // Clear any previous errors
		
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
			
			// Update players if provided
			if (game.players) {
				setPlayers(game.players)
			}
			
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
	
	const handleNewGame = async () => {
		// #region agent log
		fetch('http://127.0.0.1:7242/ingest/e2ffda01-3bbb-41a9-b15c-e8e9ea1a5ed0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'game.tsx:286','message':'handleNewGame called','data':{mode,gameId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
		// #endregion
		setLoading(true)
		setError('')
		
		// Reset Redux state
		dispatch(resetGame())
		
		// Clear local state
		setGameId(null)
		setPlayers({})
		setMyPlayerNumber(null)
		setIsProcessingMove(false)
		
		// Leave socket room if in online mode
		if (mode === 'online' && gameId) {
			// #region agent log
			fetch('http://127.0.0.1:7242/ingest/e2ffda01-3bbb-41a9-b15c-e8e9ea1a5ed0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'game.tsx:300','message':'Leaving socket game room','data':{gameId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
			// #endregion
			socketService.leaveGame(gameId)
		}
		
		try {
			// Create a new game based on mode
			if (mode === 'ai') {
				const response = await api.post('/api/game/ai', {})
				const game = response.data
				const newGameId = game.id
				setGameId(newGameId)
				dispatch(initGame({ mode, id: newGameId }))
				
				// Set players information
				if (game.players) {
					setPlayers(game.players)
					setMyPlayerNumber(1) // Player 1 is always the user in AI mode
				}
				
				// Set initial board state
				if (game.board_state) {
					const boardState = Array.isArray(game.board_state) ? game.board_state : []
					dispatch(setBoard(boardState))
				}
				
				// Set initial current player
				if (game.current_player) {
					dispatch(setCurrentPlayer(game.current_player as 1 | 2))
				}
			} else if (mode === 'local') {
				const response = await api.post('/api/game/local', {})
				const game = response.data
				const newGameId = game.id
				setGameId(newGameId)
				dispatch(initGame({ mode, id: newGameId }))
				
				// Set initial board state
				if (game.board_state) {
					const boardState = Array.isArray(game.board_state) ? game.board_state : []
					dispatch(setBoard(boardState))
				}
				
				// Set initial current player
				if (game.current_player) {
					dispatch(setCurrentPlayer(game.current_player as 1 | 2))
				}
			} else if (mode === 'online') {
				// #region agent log
				fetch('http://127.0.0.1:7242/ingest/e2ffda01-3bbb-41a9-b15c-e8e9ea1a5ed0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'game.tsx:346','message':'Online mode: calling reset endpoint','data':{gameId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
				// #endregion
				// For online games, call reset endpoint to notify both players
				if (gameId) {
					try {
						const resetResponse = await api.post(`/api/game/${gameId}/reset`)
						// #region agent log
						fetch('http://127.0.0.1:7242/ingest/e2ffda01-3bbb-41a9-b15c-e8e9ea1a5ed0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'game.tsx:351','message':'Reset endpoint response','data':{status:resetResponse.status},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
						// #endregion
					} catch (err: any) {
						console.error('Reset game error:', err)
						// #region agent log
						fetch('http://127.0.0.1:7242/ingest/e2ffda01-3bbb-41a9-b15c-e8e9ea1a5ed0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'game.tsx:354','message':'Reset endpoint error','data':{error:err.message},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
						// #endregion
						// Continue to navigate even if API call fails
					}
				}
				// #region agent log
				fetch('http://127.0.0.1:7242/ingest/e2ffda01-3bbb-41a9-b15c-e8e9ea1a5ed0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'game.tsx:360','message':'Navigating to lobby','data':{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
				// #endregion
				// Navigate back to lobby - both players will receive the reset event
				navigate('/lobby')
				return
			}
		} catch (err: any) {
			console.error('New game error:', err)
			setError(err.response?.data?.error || 'Failed to create new game')
		} finally {
			setLoading(false)
		}
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
				
				<GameStatus 
					currentPlayer={currentPlayer} 
					status={status} 
					winner={winner}
					players={players}
					mode={mode}
				/>
				
				<div className='flex justify-center my-8'>
					{board && board.length > 0 ? (
						<Board
							key={`board-${renderKey}`}
							board={board}
							onColumnClick={handleColumnClick}
							disabled={
								loading || 
								isProcessingMove || 
								status === 'finished' || 
								status === 'draw' ||
								(mode === 'online' && myPlayerNumber !== null && currentPlayer !== myPlayerNumber) ||
								(mode === 'ai' && currentPlayer !== 1)
							}
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

