import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Link } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { selectCurrentUser } from '@/store/slices/auth-slice'
import { api } from '@/services/api'
import { socketService } from '@/services/socket'

function Lobby() {
	const navigate = useNavigate()
	const user = useSelector(selectCurrentUser)
	const [roomCode, setRoomCode] = useState('')
	const [createdRoom, setCreatedRoom] = useState<any>(null)
	const [joinedRoom, setJoinedRoom] = useState<any>(null)
	const [error, setError] = useState('')
	const [loading, setLoading] = useState(false)

	useEffect(() => {
		// Check authentication
		const token = localStorage.getItem('accessToken')
		console.log('Lobby mounted, token check:', token ? 'Token present' : 'No token')
		
		if (!token) {
			setError('Please login first')
			setTimeout(() => {
				navigate('/login')
			}, 2000)
			return
		}
		
		// Set up room update listener (defined outside async to be accessible in cleanup)
		const handleRoomUpdate = (data: any) => {
			console.log('Room update received via socket:', data)
			// Update room state if it matches our current room
			setCreatedRoom((prev: any) => {
				if (prev && (data.code === prev.code || data.id === prev.id)) {
					console.log('Updating createdRoom from', prev, 'to', data)
					// Navigate to game if it starts
					if (data.status === 'playing' && data.game_id) {
						navigate(`/game/online?gameId=${data.game_id}`)
					}
					return data
				}
				return prev
			})
			setJoinedRoom((prev: any) => {
				if (prev && (data.code === prev.code || data.id === prev.id)) {
					console.log('Updating joinedRoom from', prev, 'to', data)
					// Navigate to game if it starts
					if (data.status === 'playing' && data.game_id) {
						navigate(`/game/online?gameId=${data.game_id}`)
					}
					return data
				}
				return prev
			})
		}
		
		// Also listen for 'joined_room' event to confirm we joined
		const handleJoinedRoom = (data: any) => {
			console.log('Joined room confirmation:', data)
		}
		
		// Connect socket and set up listeners
		const setupSocket = async () => {
			try {
				const socket = await socketService.connect(token)
				console.log('Socket connected in lobby:', socket.id)
				
				socketService.onRoomUpdate(handleRoomUpdate)
				socketService.on('joined_room', handleJoinedRoom)
			} catch (error) {
				console.error('Failed to connect socket:', error)
				setError('Failed to establish connection. Please refresh the page.')
			}
		}
		
		setupSocket()

		return () => {
			// Cleanup on unmount
			socketService.offRoomUpdate(handleRoomUpdate)
			socketService.off('joined_room', handleJoinedRoom)
		}
	}, [navigate]) // Include navigate in dependencies

	// Separate effect to handle leaving rooms when they change
	useEffect(() => {
		return () => {
			// Cleanup: leave socket rooms when component unmounts or rooms change
			if (createdRoom) {
				socketService.leaveRoom(createdRoom.code)
			}
			if (joinedRoom) {
				socketService.leaveRoom(joinedRoom.code)
			}
		}
	}, [createdRoom, joinedRoom])

	// Polling fallback to check for room updates if socket fails
	useEffect(() => {
		const currentRoom = createdRoom || joinedRoom
		if (!currentRoom || currentRoom.status === 'playing') {
			return
		}

		const pollInterval = setInterval(async () => {
			try {
				const response = await api.get(`/api/lobby/code/${currentRoom.code}`)
				const updatedRoom = response.data
				
				// Update room state if it changed
				if (updatedRoom.guest_id !== currentRoom.guest_id || 
				    updatedRoom.status !== currentRoom.status ||
				    updatedRoom.game_id !== currentRoom.game_id) {
					console.log('Room updated via polling:', updatedRoom)
					if (createdRoom && createdRoom.id === updatedRoom.id) {
						setCreatedRoom(updatedRoom)
					}
					if (joinedRoom && joinedRoom.id === updatedRoom.id) {
						setJoinedRoom(updatedRoom)
					}
					
					// Navigate if game started
					if (updatedRoom.status === 'playing' && updatedRoom.game_id) {
						navigate(`/game/online?gameId=${updatedRoom.game_id}`)
					}
				}
			} catch (err) {
				console.error('Polling error:', err)
			}
		}, 2000) // Poll every 2 seconds

		return () => clearInterval(pollInterval)
	}, [createdRoom, joinedRoom, navigate])

	const handleCreateRoom = async () => {
		// #region agent log
		fetch('http://127.0.0.1:7242/ingest/e2ffda01-3bbb-41a9-b15c-e8e9ea1a5ed0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lobby.tsx:137','message':'handleCreateRoom called','data':{createdRoom,joinedRoom},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
		// #endregion
		setLoading(true)
		setError('')

		try {
			const token = localStorage.getItem('accessToken')
			console.log('Creating room with token:', token ? 'Token present' : 'No token')
			
			const response = await api.post('/api/lobby/create', {})
			const room = response.data
			// #region agent log
			fetch('http://127.0.0.1:7242/ingest/e2ffda01-3bbb-41a9-b15c-e8e9ea1a5ed0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lobby.tsx:147','message':'Create room response','data':{room_id:room.id,room_code:room.code,room_status:room.status,room_host_id:room.host_id,room_guest_id:room.guest_id,response_status:response.status},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
			// #endregion
			setCreatedRoom(room)
			
			// Join socket room - ensure socket is connected first
			try {
				console.log('Joining socket room:', room.code)
				await socketService.joinRoom(room.code)
				console.log('Successfully joined socket room:', room.code)
			} catch (error) {
				console.error('Failed to join socket room:', error)
				// Don't show error to user, polling will handle updates
			}
		} catch (err: any) {
			console.error('Create room error:', err)
			// #region agent log
			fetch('http://127.0.0.1:7242/ingest/e2ffda01-3bbb-41a9-b15c-e8e9ea1a5ed0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lobby.tsx:161','message':'Create room error','data':{error:err.message,status:err.response?.status},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
			// #endregion
			const errorMsg = err.response?.data?.error || err.response?.data?.message || err.message || 'Failed to create room'
			setError(errorMsg)
			// If 401, redirect to login
			if (err.response?.status === 401) {
				setTimeout(() => {
					navigate('/login')
				}, 2000)
			}
		} finally {
			setLoading(false)
		}
	}

	const handleJoinRoom = async () => {
		if (!roomCode || roomCode.length !== 6) {
			setError('Please enter a valid 6-character room code')
			return
		}

		setLoading(true)
		setError('')

		try {
			const response = await api.post(`/api/lobby/join/${roomCode.toUpperCase()}`)
			const room = response.data
			setJoinedRoom(room)
			
			// Join socket room - ensure socket is connected first
			try {
				console.log('Joining socket room:', room.code)
				await socketService.joinRoom(room.code)
				console.log('Successfully joined socket room:', room.code)
			} catch (error) {
				console.error('Failed to join socket room:', error)
				// Don't show error to user, polling will handle updates
			}
		} catch (err: any) {
			setError(err.response?.data?.error || 'Failed to join room')
		} finally {
			setLoading(false)
		}
	}

	const handleStartGame = async () => {
		if (!createdRoom && !joinedRoom) return

		const roomId = createdRoom?.id || joinedRoom?.id
		setLoading(true)
		setError('')

		try {
			const response = await api.post(`/api/lobby/start/${roomId}`)
			const game = response.data
			navigate(`/game/online?gameId=${game.id}`)
		} catch (err: any) {
			setError(err.response?.data?.error || 'Failed to start game')
		} finally {
			setLoading(false)
		}
	}

	// Determine current room and if user is host
	const currentRoom = createdRoom || joinedRoom
	const isHost = currentRoom && user && currentRoom.host_id === user.id
	const canStartGame = currentRoom && 
		isHost &&
		currentRoom.guest_id &&
		currentRoom.status === 'waiting'

	return (
		<div className='container mx-auto p-8'>
			<div className='max-w-2xl mx-auto'>
				<Link to='/' className='text-muted-foreground hover:text-foreground mb-4 inline-block'>
					← Back to Home
				</Link>

				<h1 className='text-4xl font-bold mb-8 text-center'>Online Multiplayer</h1>

				{error && (
					<div className='bg-destructive/10 text-destructive border border-destructive rounded-lg p-3 mb-4'>
						{error}
					</div>
				)}

				{!createdRoom && !joinedRoom && (
					<div className='space-y-6'>
						{/* Create Room */}
						<div className='bg-card border rounded-lg p-6'>
							<h2 className='text-2xl font-semibold mb-4'>Create Room</h2>
							<p className='text-muted-foreground mb-4'>
								Create a new room and share the code with a friend
							</p>
							<button
								onClick={handleCreateRoom}
								disabled={loading}
								className='w-full bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg p-4 text-lg font-semibold transition-colors disabled:opacity-50'
							>
								{loading ? 'Creating...' : 'Create Room'}
							</button>
						</div>

						{/* Join Room */}
						<div className='bg-card border rounded-lg p-6'>
							<h2 className='text-2xl font-semibold mb-4'>Join Room</h2>
							<p className='text-muted-foreground mb-4'>
								Enter a 6-character room code to join
							</p>
							<div className='flex gap-2'>
								<input
									type='text'
									value={roomCode}
									onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
									placeholder='Enter room code'
									maxLength={6}
									className='flex-1 border rounded-lg px-4 py-2 text-lg uppercase'
								/>
								<button
									onClick={handleJoinRoom}
									disabled={loading || !roomCode}
									className='bg-secondary text-secondary-foreground hover:bg-secondary/80 rounded-lg px-6 py-2 font-semibold transition-colors disabled:opacity-50'
								>
									Join
								</button>
							</div>
						</div>
					</div>
				)}

				{currentRoom && (
					<div className='bg-card border rounded-lg p-6'>
						<h2 className='text-2xl font-semibold mb-4'>Room: {currentRoom.code}</h2>
						
						<div className='space-y-4 mb-6'>
							<div>
								<p className='text-muted-foreground'>Status:</p>
								<p className='font-semibold'>{currentRoom.status}</p>
							</div>
							<div>
								<p className='text-muted-foreground'>Players:</p>
								<p className='font-semibold'>
									{currentRoom.guest_id ? '2/2' : '1/2'}
								</p>
							</div>
							<div>
								<p className='text-muted-foreground'>Your role:</p>
								<p className='font-semibold'>
									{isHost ? 'Host' : 'Guest'}
								</p>
							</div>
						</div>

						{canStartGame && (
							<button
								onClick={handleStartGame}
								disabled={loading}
								className='w-full bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg p-4 text-lg font-semibold transition-colors disabled:opacity-50'
							>
								{loading ? 'Starting...' : 'Start Game'}
							</button>
						)}

						{!canStartGame && currentRoom.status === 'waiting' && (
							<p className='text-center text-muted-foreground'>
								{isHost 
									? (currentRoom.guest_id ? 'Ready to start!' : 'Waiting for second player...')
									: 'Waiting for host to start the game...'
								}
							</p>
						)}

						{currentRoom.status === 'playing' && currentRoom.game_id && (
							<button
								onClick={() => navigate(`/game/online?gameId=${currentRoom.game_id}`)}
								className='w-full bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg p-4 text-lg font-semibold transition-colors'
							>
								Join Game
							</button>
						)}
					</div>
				)}
			</div>
		</div>
	)
}

export default Lobby

