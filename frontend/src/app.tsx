import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from '@/pages/home'
import Login from '@/pages/login'
import Register from '@/pages/register'
import Game from '@/pages/game'
import Instructions from '@/pages/instructions'

function App() {
	return (
		<BrowserRouter>
			<div className='min-h-screen bg-background'>
				<Routes>
					<Route path='/' element={<Home />} />
					<Route path='/login' element={<Login />} />
					<Route path='/register' element={<Register />} />
					<Route path='/game/:mode' element={<Game />} />
					<Route path='/instructions' element={<Instructions />} />
				</Routes>
			</div>
		</BrowserRouter>
	)
}

export default App
