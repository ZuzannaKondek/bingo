import type { GameStatus } from '@/types'

interface GameStatusProps {
	currentPlayer: 1 | 2
	status: GameStatus
	winner: 1 | 2 | null
}

function GameStatus({ currentPlayer, status, winner }: GameStatusProps) {
	if (status === 'finished' && winner) {
		return (
			<div className='text-center p-6 bg-green-100 dark:bg-green-900 rounded-lg'>
				<h2 className='text-3xl font-bold'>
					🎉 Player {winner} ({winner === 1 ? 'Red' : 'Yellow'}) Wins!
				</h2>
			</div>
		)
	}
	
	if (status === 'draw') {
		return (
			<div className='text-center p-6 bg-gray-100 dark:bg-gray-800 rounded-lg'>
				<h2 className='text-3xl font-bold'>Game Draw!</h2>
			</div>
		)
	}
	
	return (
		<div className='text-center p-6'>
			<h2 className='text-2xl font-semibold'>
				Current Player: {currentPlayer === 1 ? '🔴 Red' : '🟡 Yellow'}
			</h2>
		</div>
	)
}

export default GameStatus

