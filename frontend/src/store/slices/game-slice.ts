import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import type { GameState, CellValue, GameMode, GameStatus } from '@/types'
import type { RootState } from '../index'

const createEmptyBoard = (): CellValue[][] => {
	return Array(6).fill(null).map(() => Array(7).fill(0) as CellValue[])
}

const initialState: GameState = {
	mode: 'local',
	board: createEmptyBoard(),
	currentPlayer: 1,
	status: 'waiting',
	winner: null,
}

const gameSlice = createSlice({
	name: 'game',
	initialState,
	reducers: {
		initGame: (state, action: PayloadAction<{ mode: GameMode; id?: number }>) => {
			state.mode = action.payload.mode
			state.id = action.payload.id
			state.board = createEmptyBoard()
			state.currentPlayer = 1
			state.status = 'playing'
			state.winner = null
		},
		makeMove: (state, action: PayloadAction<{ column: number; player: 1 | 2 }>) => {
			const { column, player } = action.payload
			// Find the lowest empty row in the column
			for (let row = 5; row >= 0; row--) {
				if (state.board[row][column] === 0) {
					state.board[row][column] = player
					break
				}
			}
		},
		switchPlayer: (state) => {
			state.currentPlayer = state.currentPlayer === 1 ? 2 : 1
		},
		setGameStatus: (state, action: PayloadAction<GameStatus>) => {
			state.status = action.payload
		},
		setWinner: (state, action: PayloadAction<1 | 2 | null>) => {
			state.winner = action.payload
			if (action.payload) {
				state.status = 'finished'
			}
		},
		setBoard: (state, action: PayloadAction<CellValue[][]>) => {
			// Create a deep copy to ensure React detects the change
			// Validate and ensure we have a 6x7 board
			console.log('setBoard reducer called with:', action.payload)
			console.log('Current board in state:', state.board)
			
			if (Array.isArray(action.payload) && action.payload.length === 6) {
				// Create a completely new array structure
				const newBoard: CellValue[][] = []
				for (let i = 0; i < 6; i++) {
					const row = action.payload[i]
					if (Array.isArray(row) && row.length === 7) {
						newBoard.push([...row] as CellValue[])
					} else {
						newBoard.push(Array(7).fill(0) as CellValue[])
					}
				}
				console.log('Setting new board:', newBoard)
				console.log('New board sample:', newBoard[0])
				// Use Immer's mutation - assign the new array
				state.board = newBoard
				console.log('Board after assignment:', state.board)
			} else {
				console.warn('Invalid board structure, creating empty board. Payload:', action.payload)
				// If invalid, create empty board
				state.board = createEmptyBoard()
			}
		},
		setCurrentPlayer: (state, action: PayloadAction<1 | 2>) => {
			state.currentPlayer = action.payload
		},
		resetGame: () => initialState,
	},
})

export const { initGame, makeMove, switchPlayer, setGameStatus, setWinner, setBoard, setCurrentPlayer, resetGame } = gameSlice.actions

export const selectGameMode = (state: RootState) => state.game.mode
export const selectBoard = (state: RootState) => state.game.board
export const selectCurrentPlayer = (state: RootState) => state.game.currentPlayer
export const selectGameStatus = (state: RootState) => state.game.status
export const selectWinner = (state: RootState) => state.game.winner
export const selectIsGameOver = (state: RootState) => state.game.status === 'finished' || state.game.status === 'draw'

export default gameSlice.reducer

