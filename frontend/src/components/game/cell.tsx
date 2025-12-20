import type { CellValue } from '@/types'
import { cn } from '@/lib/utils'

interface CellProps {
	value: CellValue
	onClick?: () => void
	isWinning?: boolean
}

function Cell({ value, onClick, isWinning }: CellProps) {
	return (
		<button
			onClick={onClick}
			className={cn(
				'aspect-square rounded-full border-4 border-slate-300 transition-all',
				'hover:scale-105',
				value === 0 && 'bg-white',
				value === 1 && 'bg-red-500',
				value === 2 && 'bg-yellow-400',
				isWinning && 'ring-4 ring-green-500 animate-pulse'
			)}
			disabled={value !== 0}
		/>
	)
}

export default Cell

