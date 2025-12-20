import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { Link } from 'react-router-dom'
import { logout, selectCurrentUser } from '@/store/slices/auth-slice'
import { api } from '@/services/api'
import { socketService } from '@/services/socket'

function Header() {
	const dispatch = useDispatch()
	const navigate = useNavigate()
	const user = useSelector(selectCurrentUser)
	const token = localStorage.getItem('accessToken')

	const handleLogout = async () => {
		try {
			// Call logout API if we have a token
			if (token) {
				await api.post('/api/auth/logout')
			}
		} catch (error) {
			// Even if API call fails, clear local state
			console.error('Logout error:', error)
		} finally {
			// Disconnect socket
			socketService.disconnect()
			
			// Clear Redux state and localStorage
			dispatch(logout())
			
			// Navigate to home
			navigate('/')
		}
	}

	// Only show header if user is logged in
	if (!user && !token) {
		return null
	}

	return (
		<header className='border-b border-border bg-background'>
			<div className='container mx-auto px-4 py-3'>
				<div className='flex items-center justify-between'>
					<Link to='/' className='text-xl font-bold'>
						Bingo
					</Link>
					
					<div className='flex items-center gap-4'>
						{user ? (
							<>
								<span className='text-sm text-muted-foreground'>
									Logged in as: <span className='font-semibold text-foreground'>{user.username}</span>
								</span>
								<button
									onClick={handleLogout}
									className='bg-secondary text-secondary-foreground hover:bg-secondary/80 rounded-md px-4 py-2 text-sm font-medium transition-colors'
								>
									Logout
								</button>
							</>
						) : (
							<>
								<span className='text-sm text-muted-foreground'>Loading user...</span>
								<button
									onClick={handleLogout}
									className='bg-secondary text-secondary-foreground hover:bg-secondary/80 rounded-md px-4 py-2 text-sm font-medium transition-colors'
								>
									Clear Session
								</button>
							</>
						)}
					</div>
				</div>
			</div>
		</header>
	)
}

export default Header

