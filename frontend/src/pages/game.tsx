import { useEffect, useState } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { initGame, makeMove as makeMoveAction, switchPlayer, setWinner, setGameStatus, setBoard } from '@/store/slices/game-slice'
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
					response = await api.post('/api/game/local')
				}
				
				if (response) {
					const game = response.data
					setGameId(game.id)
					dispatch(initGame({ mode, id: game.id }))
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
		if (!gameId || status !== 'playing') return
		
		setLoading(true)
		
		try {
			const response = await api.post(`/api/game/${gameId}/move`, { column })
			const game = response.data
			
			// Update board from server
			dispatch(setBoard(game.board_state))
			
			// Check game status
			if (game.status === 'finished') {
				dispatch(setWinner(game.winner))
				dispatch(setGameStatus('finished'))
			} else if (game.status === 'draw') {
				dispatch(setGameStatus('draw'))
			} else {
				// For local mode, just update whose turn it is
				if (mode === 'local') {
					dispatch(switchPlayer())
				}
			}
		} catch (err: any) {
			setError(err.response?.data?.error || 'Failed to make move')
		} finally {
			setLoading(false)
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
					<Board
						board={board}
						onColumnClick={handleColumnClick}
						disabled={loading || status === 'finished' || status === 'draw'}
					/>
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

