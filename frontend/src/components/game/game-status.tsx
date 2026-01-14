import type { GameStatus, GameMode, Player } from '@/types'

interface GameStatusProps {
	currentPlayer: 1 | 2
	status: GameStatus
	winner: 1 | 2 | null
	players?: { [key: number]: Player }
	mode?: GameMode
}

function GameStatus({ currentPlayer, status, winner, players, mode: _mode }: GameStatusProps) {
	// Get player name and icon
	const getPlayerInfo = (playerNum: 1 | 2) => {
		if (players && players[playerNum]) {
			const player = players[playerNum]
			const icon = player.color === 'red' ? '🔴' : '🟡'
			return { name: player.nickname, icon, color: player.color }
		}
		// Fallback for games without player info
		return {
			name: playerNum === 1 ? 'Red' : 'Yellow',
			icon: playerNum === 1 ? '🔴' : '🟡',
			color: playerNum === 1 ? 'red' : 'yellow'
		}
	}
	
	if (status === 'finished' && winner) {
		const winnerInfo = getPlayerInfo(winner as 1 | 2)
		return (
			<div className='text-center p-6 bg-green-100 dark:bg-green-900 rounded-lg'>
				<h2 className='text-3xl font-bold'>
					🎉 {winnerInfo.icon} {winnerInfo.name} Wins!
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
	
	const currentPlayerInfo = getPlayerInfo(currentPlayer)
	
	return (
		<div className='text-center p-6'>
			<h2 className='text-2xl font-semibold'>
				Current Player: {currentPlayerInfo.icon} {currentPlayerInfo.name}
			</h2>
		</div>
	)
}

export default GameStatus

