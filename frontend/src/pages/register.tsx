import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { setCredentials } from '@/store/slices/auth-slice'
import { api } from '@/services/api'

function Register() {
	const [username, setUsername] = useState('')
	const [email, setEmail] = useState('')
	const [password, setPassword] = useState('')
	const [error, setError] = useState('')
	const [loading, setLoading] = useState(false)
	
	const navigate = useNavigate()
	const dispatch = useDispatch()
	
	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		setError('')
		setLoading(true)
		
		try {
			const response = await api.post('/api/auth/register', { username, email, password })
			console.log('Registration response:', response.data)
			const { user, access_token } = response.data
			
			if (!access_token) {
				setError('No access token received from server')
				return
			}
			
			console.log('Storing token:', access_token.substring(0, 30) + '...')
			dispatch(setCredentials({ user, accessToken: access_token }))
			navigate('/')
		} catch (err: any) {
			const errors = err.response?.data?.errors
			if (errors) {
				const errorMessages = Object.values(errors).flat().join(', ')
				setError(errorMessages as string)
			} else {
				setError(err.response?.data?.error || 'Registration failed')
			}
		} finally {
			setLoading(false)
		}
	}
	
	return (
		<div className='container mx-auto p-8 max-w-md'>
			<Link to='/' className='text-muted-foreground hover:text-foreground mb-4 inline-block'>
				← Back to Home
			</Link>
			
			<h1 className='text-4xl font-bold mb-8'>Register</h1>
			
			<form onSubmit={handleSubmit} className='space-y-4'>
				{error && (
					<div className='bg-destructive/10 text-destructive border border-destructive rounded-lg p-3'>
						{error}
					</div>
				)}
				
				<div>
					<label htmlFor='username' className='block text-sm font-medium mb-2'>
						Username
					</label>
					<input
						type='text'
						id='username'
						value={username}
						onChange={(e) => setUsername(e.target.value)}
						className='w-full rounded-md border border-input bg-background px-3 py-2'
						required
						minLength={3}
					/>
				</div>
				
				<div>
					<label htmlFor='email' className='block text-sm font-medium mb-2'>
						Email
					</label>
					<input
						type='email'
						id='email'
						value={email}
						onChange={(e) => setEmail(e.target.value)}
						className='w-full rounded-md border border-input bg-background px-3 py-2'
						required
					/>
				</div>
				
				<div>
					<label htmlFor='password' className='block text-sm font-medium mb-2'>
						Password
					</label>
					<input
						type='password'
						id='password'
						value={password}
						onChange={(e) => setPassword(e.target.value)}
						className='w-full rounded-md border border-input bg-background px-3 py-2'
						required
						minLength={6}
					/>
				</div>
				
				<button
					type='submit'
					disabled={loading}
					className='w-full bg-primary text-primary-foreground hover:bg-primary/90 rounded-md py-2 font-semibold disabled:opacity-50'
				>
					{loading ? 'Registering...' : 'Register'}
				</button>
			</form>
			
			<p className='mt-4 text-center text-sm text-muted-foreground'>
				Already have an account?{' '}
				<Link to='/login' className='text-primary hover:underline'>
					Login
				</Link>
			</p>
		</div>
	)
}

export default Register

