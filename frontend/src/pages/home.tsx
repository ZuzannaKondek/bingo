import { Link } from 'react-router-dom'

function Home() {
	return (
		<div className='container mx-auto p-8'>
			<div className='max-w-2xl mx-auto text-center'>
				<h1 className='text-5xl font-bold mb-4'>Bingo</h1>
				<p className='text-xl text-muted-foreground mb-12'>Connect Four Game</p>
				
				<div className='grid gap-4 mb-8'>
					<Link
						to='/game/ai'
						className='bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg p-6 text-xl font-semibold transition-colors'
					>
						Play vs Computer
					</Link>
					
					<Link
						to='/game/local'
						className='bg-secondary text-secondary-foreground hover:bg-secondary/80 rounded-lg p-6 text-xl font-semibold transition-colors'
					>
						Local 2-Player (Hot-Seat)
					</Link>
					
					<Link
						to='/lobby'
						className='bg-secondary text-secondary-foreground hover:bg-secondary/80 rounded-lg p-6 text-xl font-semibold transition-colors'
					>
						Online Multiplayer
					</Link>
				</div>
				
				<div className='flex justify-center gap-4'>
					<Link
						to='/instructions'
						className='text-muted-foreground hover:text-foreground underline'
					>
						How to Play
					</Link>
					<Link
						to='/login'
						className='text-muted-foreground hover:text-foreground underline'
					>
						Login
					</Link>
				</div>
			</div>
		</div>
	)
}

export default Home

