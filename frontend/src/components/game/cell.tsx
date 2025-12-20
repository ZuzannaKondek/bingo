import type { CellValue } from '@/types'
import { cn } from '@/lib/utils'

interface CellProps {
	value: CellValue
	onClick?: () => void
	isWinning?: boolean
}

function Cell({ value, onClick, isWinning }: CellProps) {
	// Determine background color based on value
	let bgColor = 'bg-white'
	if (value === 1) {
		bgColor = 'bg-red-500'
	} else if (value === 2) {
		bgColor = 'bg-yellow-400'
	}
	
	return (
		<button
			type="button"
			onClick={(e) => {
				e.preventDefault()
				e.stopPropagation()
				if (onClick && value === 0) {
					onClick()
				}
			}}
			className={cn(
				'aspect-square rounded-full border-4 border-slate-300 transition-all w-12 h-12',
				'hover:scale-105',
				bgColor,
				value === 0 && 'cursor-pointer',
				value !== 0 && 'cursor-not-allowed',
				isWinning && 'ring-4 ring-green-500 animate-pulse'
			)}
			disabled={value !== 0}
			aria-label={value === 0 ? 'Empty cell' : value === 1 ? 'Red piece' : 'Yellow piece'}
			style={{
				backgroundColor: value === 0 ? 'white' : value === 1 ? '#ef4444' : '#facc15'
			}}
		/>
	)
}

export default Cell

