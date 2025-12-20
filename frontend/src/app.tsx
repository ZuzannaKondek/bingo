import { useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { AppDispatch } from '@/store'
import { fetchCurrentUser } from '@/store/slices/auth-slice'
import Header from '@/components/header'
import Home from '@/pages/home'
import Login from '@/pages/login'
import Register from '@/pages/register'
import Game from '@/pages/game'
import Instructions from '@/pages/instructions'
import Lobby from '@/pages/lobby'

function App() {
	const dispatch = useDispatch<AppDispatch>()

	useEffect(() => {
		// Fetch current user if token exists
		const token = localStorage.getItem('accessToken')
		if (token) {
			dispatch(fetchCurrentUser())
		}
	}, [dispatch])

	return (
		<BrowserRouter>
			<div className='min-h-screen bg-background'>
				<Header />
				<Routes>
					<Route path='/' element={<Home />} />
					<Route path='/login' element={<Login />} />
					<Route path='/register' element={<Register />} />
					<Route path='/game/:mode' element={<Game />} />
					<Route path='/lobby' element={<Lobby />} />
					<Route path='/instructions' element={<Instructions />} />
				</Routes>
			</div>
		</BrowserRouter>
	)
}

export default App
