import { io, Socket } from 'socket.io-client'

// Use empty string for same-origin Socket.IO connection
// In development, Vite proxy handles /socket.io requests
// In production, Flask serves Socket.IO from the same origin
const SOCKET_URL = ''

class SocketService {
	private socket: Socket | null = null
	private token: string | null = null
	private connectionPromise: Promise<Socket> | null = null

	async connect(token?: string): Promise<Socket> {
		// If already connected with the same token, return existing socket
		const newToken = token || localStorage.getItem('accessToken') || ''
		if (this.socket?.connected && this.token === newToken) {
			return this.socket
		}

		// If there's a connection in progress, wait for it
		if (this.connectionPromise) {
			return this.connectionPromise
		}

		// Disconnect existing socket if token changed
		if (this.socket && this.token !== newToken) {
			this.socket.disconnect()
			this.socket = null
		}

		this.token = newToken

		// Create connection promise
		this.connectionPromise = new Promise((resolve, reject) => {
			if (!this.token) {
				reject(new Error('No token available'))
				return
			}

			this.socket = io(SOCKET_URL, {
				auth: {
					token: this.token,
				},
				transports: ['websocket', 'polling'],
				path: '/socket.io/',
				reconnection: true,
				reconnectionAttempts: 5,
				reconnectionDelay: 1000,
			})

			const onConnect = () => {
				console.log('Socket connected:', this.socket?.id)
				this.connectionPromise = null
				resolve(this.socket!)
			}

			const onConnectError = (error: Error) => {
				console.error('Socket connection error:', error)
				this.connectionPromise = null
				reject(error)
			}

			const onError = (error: any) => {
				console.error('Socket error:', error)
			}

			const onDisconnect = (reason: string) => {
				console.log('Socket disconnected:', reason)
				if (reason === 'io server disconnect') {
					// Server disconnected, reconnect manually
					this.socket?.connect()
				}
			}

			this.socket.once('connect', onConnect)
			this.socket.once('connect_error', onConnectError)
			this.socket.on('error', onError)
			this.socket.on('disconnect', onDisconnect)

			// If already connected, resolve immediately
			if (this.socket.connected) {
				this.connectionPromise = null
				resolve(this.socket)
			}
		})

		return this.connectionPromise
	}

	async ensureConnected(): Promise<Socket> {
		if (this.socket?.connected) {
			return this.socket
		}
		return this.connect()
	}

	disconnect() {
		if (this.socket) {
			this.socket.disconnect()
			this.socket = null
			this.connectionPromise = null
		}
	}

	getSocket(): Socket | null {
		return this.socket
	}

	async joinGame(gameId: number): Promise<void> {
		const socket = await this.ensureConnected()
		return new Promise((resolve, reject) => {
			if (!socket.connected) {
				reject(new Error('Socket not connected'))
				return
			}

			const timeout = setTimeout(() => {
				reject(new Error('Join game timeout'))
			}, 5000)

			const onJoined = (data: any) => {
				clearTimeout(timeout)
				socket.off('error', onError)
				console.log('Joined game:', data)
				resolve()
			}

			const onError = (error: any) => {
				clearTimeout(timeout)
				socket.off('joined_game', onJoined)
				console.error('Join game error:', error)
				reject(error)
			}

			socket.once('joined_game', onJoined)
			socket.once('error', onError)
			socket.emit('join_game', { game_id: gameId })
		})
	}

	leaveGame(gameId: number) {
		if (this.socket?.connected) {
			this.socket.emit('leave_game', { game_id: gameId })
		}
	}

	async joinRoom(roomCode: string): Promise<void> {
		const socket = await this.ensureConnected()
		return new Promise((resolve, reject) => {
			if (!socket.connected) {
				reject(new Error('Socket not connected'))
				return
			}

			const timeout = setTimeout(() => {
				reject(new Error('Join room timeout'))
			}, 5000)

			const onJoined = (data: any) => {
				clearTimeout(timeout)
				socket.off('error', onError)
				console.log('Joined room:', data)
				resolve()
			}

			const onError = (error: any) => {
				clearTimeout(timeout)
				socket.off('joined_room', onJoined)
				console.error('Join room error:', error)
				reject(error)
			}

			socket.once('joined_room', onJoined)
			socket.once('error', onError)
			socket.emit('join_room', { room_code: roomCode })
		})
	}

	leaveRoom(roomCode: string) {
		if (this.socket?.connected) {
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

