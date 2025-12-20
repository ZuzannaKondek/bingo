import type { CellValue } from '@/types'
import Cell from './cell'

interface BoardProps {
	board: CellValue[][]
	onColumnClick: (column: number) => void
	disabled?: boolean
}

function Board({ board, onColumnClick, disabled }: BoardProps) {
	const handleCellClick = (row: number, col: number) => {
		if (disabled) return
		// Only allow clicks on the top row to indicate column
		if (row === 0 || board[row - 1][col] !== 0) {
			onColumnClick(col)
		}
	}
	
	return (
		<div className='inline-block bg-blue-600 p-4 rounded-lg shadow-2xl'>
			<div className='grid grid-cols-7 gap-2'>
				{board.map((row, rowIndex) =>
					row.map((cell, colIndex) => (
						<Cell
							key={`${rowIndex}-${colIndex}`}
							value={cell}
							onClick={() => handleCellClick(rowIndex, colIndex)}
						/>
					))
				)}
			</div>
		</div>
	)
}

export default Board

