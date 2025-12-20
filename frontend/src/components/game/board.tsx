import type { CellValue } from '@/types'
import Cell from './cell'

interface BoardProps {
	board: CellValue[][]
	onColumnClick: (column: number) => void
	disabled?: boolean
}

function Board({ board, onColumnClick, disabled }: BoardProps) {
	console.log('Board rendered with board:', board, 'board length:', board?.length, 'disabled:', disabled)
	
	// Validate board structure
	if (!board || !Array.isArray(board) || board.length !== 6) {
		console.error('Invalid board structure:', board)
		return <div>Invalid board structure</div>
	}
	
	const handleCellClick = (row: number, col: number) => {
		console.log('Cell clicked - row:', row, 'col:', col, 'disabled:', disabled, 'value:', board[row]?.[col])
		if (disabled) {
			console.log('Board is disabled, ignoring click')
			return
		}
		// Clicking any cell in a column will drop a piece in that column
		// The backend will find the lowest available row
		onColumnClick(col)
	}
	
	// Render board correctly: 6 rows x 7 columns
	// Row 0 is top, Row 5 is bottom
	return (
		<div className='inline-block bg-blue-600 p-4 rounded-lg shadow-2xl'>
			<div className='flex flex-col gap-2'>
				{board.map((row, rowIndex) => (
					<div key={rowIndex} className='flex gap-2'>
						{row.map((cell, colIndex) => (
							<Cell
								key={`${rowIndex}-${colIndex}`}
								value={cell}
								onClick={() => handleCellClick(rowIndex, colIndex)}
							/>
						))}
					</div>
				))}
			</div>
		</div>
	)
}

export default Board

