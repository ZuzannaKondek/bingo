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
			state.board = action.payload
		},
		resetGame: () => initialState,
	},
})

export const { initGame, makeMove, switchPlayer, setGameStatus, setWinner, setBoard, resetGame } = gameSlice.actions

export const selectGameMode = (state: RootState) => state.game.mode
export const selectBoard = (state: RootState) => state.game.board
export const selectCurrentPlayer = (state: RootState) => state.game.currentPlayer
export const selectGameStatus = (state: RootState) => state.game.status
export const selectWinner = (state: RootState) => state.game.winner
export const selectIsGameOver = (state: RootState) => state.game.status === 'finished' || state.game.status === 'draw'

export default gameSlice.reducer

