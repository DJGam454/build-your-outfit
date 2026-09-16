import { useRef, type ReactNode } from "react"
import { motion } from "framer-motion"
import { useOutfitStore } from "../state/store"

export const EASE = [0.22, 1, 0.36, 1] as const

export function Kicker({ children }: { children: ReactNode }) {
	return (
		<p className="text-[10px] font-medium uppercase tracking-[0.3em] text-soft">
			{children}
		</p>
	)
}

export function Title({
	children,
	className = "",
}: {
	children: ReactNode
	className?: string
}) {
	return (
		<h1
			className={`font-display text-[clamp(29px,4vw,38px)] leading-[1.06] text-ink ${className}`}
		>
			{children}
		</h1>
	)
}

export function OptionCard({
	label,
	hint,
	selected,
	onClick,
	glyph,
	dataTour,
}: {
	label: string
	hint?: string
	selected: boolean
	onClick: () => void
	glyph?: ReactNode
	dataTour?: string
}) {
	return (
		<button
			type="button"
			onClick={onClick}
			data-tour={dataTour}
			className={`group flex w-full items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-left transition-all duration-300 ${
				selected
					? "border-ink bg-card shadow-[0_10px_30px_-18px_rgba(27,26,24,0.5)]"
					: "border-line bg-transparent hover:border-soft/50 hover:bg-card/70"
			}`}
		>
			<span className="flex min-w-0 items-center gap-3">
				{glyph ? <span className="shrink-0">{glyph}</span> : null}
				<span className="min-w-0">
					<span className="block truncate text-[13.5px] font-medium text-ink">
						{label}
					</span>
					{hint ? (
						<span className="mt-0.5 block text-[11.5px] leading-snug text-soft">
							{hint}
						</span>
					) : null}
				</span>
			</span>
			<span
				className={`h-1.5 w-1.5 shrink-0 rounded-full transition-all duration-300 ${
					selected ? "scale-100 bg-accent" : "scale-75 bg-line group-hover:bg-soft/40"
				}`}
			/>
		</button>
	)
}

export function ChipButton({
	label,
	hint,
	selected,
	onClick,
}: {
	label: string
	hint?: string
	selected: boolean
	onClick: () => void
}) {
	return (
		<button
			type="button"
			onClick={onClick}
			className={`flex flex-col items-start rounded-xl border px-3 py-2 text-left transition-all duration-300 ${
				selected
					? "border-ink bg-card"
					: "border-line hover:border-soft/50 hover:bg-card/70"
			}`}
		>
			<span className="text-[12.5px] font-medium text-ink">{label}</span>
			{hint ? <span className="text-[10.5px] text-soft">{hint}</span> : null}
		</button>
	)
}

export function PrimaryButton({
	children,
	onClick,
	disabled,
}: {
	children: ReactNode
	onClick: () => void
	disabled?: boolean
}) {
	return (
		<button
			type="button"
			onClick={onClick}
			disabled={disabled}
			className="inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3 text-[12.5px] font-medium tracking-wide text-paper transition-all duration-300 hover:bg-accent disabled:cursor-not-allowed disabled:opacity-40"
		>
			{children}
		</button>
	)
}

export function GhostButton({
	children,
	onClick,
	dataTour,
}: {
	children: ReactNode
	onClick: () => void
	dataTour?: string
}) {
	return (
		<button
			type="button"
			onClick={onClick}
			data-tour={dataTour}
			className="text-[12px] text-soft underline-offset-4 transition-colors duration-300 hover:text-ink hover:underline"
		>
			{children}
		</button>
	)
}

export function FineSlider({
	value,
	min,
	max,
	step,
	onChange,
	format,
	label,
}: {
	value: number
	min: number
	max: number
	step: number
	onChange: (value: number) => void
	format: (value: number) => string
	label: string
}) {
	return (
		<div className="rounded-2xl border border-line bg-card/60 px-4 py-3.5">
			<div className="flex items-baseline justify-between">
				<span className="text-[11px] uppercase tracking-[0.18em] text-soft">
					{label}
				</span>
				<span className="font-display text-[24px] leading-none text-ink">
					{format(value)}
				</span>
			</div>
			<input
				type="range"
				className="sleek mt-3 w-full"
				min={min}
				max={max}
				step={step}
				value={value}
				onChange={(e) => onChange(Number(e.target.value))}
			/>
		</div>
	)
}

export function SwatchRow({
	tones,
	value,
	onChange,
}: {
	tones: { id: string; name: string; hex: string }[]
	value: string
	onChange: (id: string) => void
}) {
	return (
		<div className="flex flex-wrap gap-3">
			{tones.map((tone) => (
				<button
					key={tone.id}
					type="button"
					onClick={() => onChange(tone.id)}
					className="group flex flex-col items-center gap-1.5"
					aria-label={tone.name}
				>
					<span
						className={`block h-11 w-11 rounded-full border transition-all duration-300 ${
							value === tone.id
								? "border-ink shadow-[0_0_0_3px_var(--color-paper),0_0_0_4.5px_var(--color-ink)]"
								: "border-line group-hover:scale-105"
						}`}
						style={{ backgroundColor: tone.hex }}
					/>
					<span
						className={`text-[10px] tracking-wide ${value === tone.id ? "text-ink" : "text-soft"}`}
					>
						{tone.name}
					</span>
				</button>
			))}
		</div>
	)
}

export function useChoose() {
	const next = useOutfitStore((s) => s.next)
	const lock = useRef(false)
	return (apply: () => void, delay = 280) => {
		if (lock.current) return
		lock.current = true
		apply()
		window.setTimeout(() => {
			lock.current = false
			next()
		}, delay)
	}
}

export function StepSection({
	children,
	delay = 0,
}: {
	children: ReactNode
	delay?: number
}) {
	return (
		<motion.div
			initial={{ opacity: 0, y: 12 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.5, delay, ease: EASE }}
		>
			{children}
		</motion.div>
	)
}
