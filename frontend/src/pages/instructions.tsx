import { Link } from 'react-router-dom'

function Instructions() {
	return (
		<div className='container mx-auto p-8 max-w-2xl'>
			<Link to='/' className='text-muted-foreground hover:text-foreground mb-4 inline-block'>
				← Back to Home
			</Link>
			
			<h1 className='text-4xl font-bold mb-8'>How to Play</h1>
			
			<div className='prose prose-slate dark:prose-invert max-w-none'>
				<h2 className='text-2xl font-semibold mb-4'>Objective</h2>
				<p className='mb-6'>
					Be the first player to connect four of your colored discs in a row—horizontally, 
					vertically, or diagonally.
				</p>
				
				<h2 className='text-2xl font-semibold mb-4'>Game Board</h2>
				<p className='mb-6'>
					The game is played on a vertical board with 7 columns and 6 rows, creating a grid 
					of 42 slots.
				</p>
				
				<h2 className='text-2xl font-semibold mb-4'>How to Play</h2>
				<ol className='list-decimal list-inside space-y-2 mb-6'>
					<li>Players take turns dropping one disc at a time into any column</li>
					<li>The disc falls to the lowest available space in that column</li>
					<li>Player 1 uses red discs, Player 2 uses yellow discs</li>
					<li>The first player to connect four discs in a row wins</li>
					<li>If the board fills up with no winner, the game is a draw</li>
				</ol>
				
				<h2 className='text-2xl font-semibold mb-4'>Game Modes</h2>
				<ul className='list-disc list-inside space-y-2 mb-6'>
					<li><strong>VS Computer</strong>: Play against an AI opponent (Easy or Hard)</li>
					<li><strong>Hot-Seat</strong>: Two players on the same device</li>
					<li><strong>Online</strong>: Play against someone on a different device (requires login)</li>
				</ul>
			</div>
		</div>
	)
}

export default Instructions

