export interface User {
	id: number
	username: string
	email: string
	created_at: string
}

export interface AuthState {
	user: User | null
	accessToken: string | null
	isAuthenticated: boolean
	isLoading: boolean
}

export type GameMode = 'ai' | 'local' | 'online'
export type GameStatus = 'waiting' | 'playing' | 'finished' | 'draw'
export type CellValue = 0 | 1 | 2

export interface GameState {
	id?: number
	mode: GameMode
	board: CellValue[][]
	currentPlayer: 1 | 2
	status: GameStatus
	winner: 1 | 2 | null
}

export interface Player {
	id: number
	user_id?: number
	nickname: string
	color: 'red' | 'yellow'
	is_ai: boolean
}

export interface Room {
	code: string
	host_id: number
	guest_id: number | null
	game_id: number | null
}

