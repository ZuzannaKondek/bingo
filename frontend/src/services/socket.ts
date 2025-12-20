import { io, Socket } from 'socket.io-client'

// Use empty string to leverage Vite proxy for Socket.IO
const SOCKET_URL = ''

class SocketService {
	private socket: Socket | null = null
	private token: string | null = null

	connect(token?: string) {
		if (this.socket?.connected) {
			return this.socket
		}

		this.token = token || localStorage.getItem('accessToken') || ''

		this.socket = io(SOCKET_URL, {
			auth: {
				token: this.token,
			},
			transports: ['websocket', 'polling'],
			path: '/socket.io/',
		})

		this.socket.on('connect', () => {
			console.log('Socket connected:', this.socket?.id)
		})

		this.socket.on('disconnect', () => {
			console.log('Socket disconnected')
		})

		this.socket.on('error', (error) => {
			console.error('Socket error:', error)
		})

		return this.socket
	}

	disconnect() {
		if (this.socket) {
			this.socket.disconnect()
			this.socket = null
		}
	}

	getSocket(): Socket | null {
		return this.socket
	}

	joinGame(gameId: number) {
		if (this.socket) {
			this.socket.emit('join_game', { game_id: gameId })
		}
	}

	leaveGame(gameId: number) {
		if (this.socket) {
			this.socket.emit('leave_game', { game_id: gameId })
		}
	}

	joinRoom(roomCode: string) {
		if (this.socket) {
			this.socket.emit('join_room', { room_code: roomCode })
		}
	}

	leaveRoom(roomCode: string) {
		if (this.socket) {
			this.socket.emit('leave_room', { room_code: roomCode })
		}
	}

	onGameUpdate(callback: (data: any) => void) {
		if (this.socket) {
			this.socket.on('game_update', callback)
		}
	}

	offGameUpdate(callback: (data: any) => void) {
		if (this.socket) {
			this.socket.off('game_update', callback)
		}
	}

	onRoomUpdate(callback: (data: any) => void) {
		if (this.socket) {
			this.socket.on('room_update', callback)
		}
	}

	offRoomUpdate(callback: (data: any) => void) {
		if (this.socket) {
			this.socket.off('room_update', callback)
		}
	}

	on(event: string, callback: (...args: any[]) => void) {
		if (this.socket) {
			this.socket.on(event, callback)
		}
	}

	off(event: string, callback?: (...args: any[]) => void) {
		if (this.socket) {
			this.socket.off(event, callback)
		}
	}
}

export const socketService = new SocketService()

