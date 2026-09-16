import { useEffect, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import {
	buildLabel,
	frameLabel,
	outfitById,
	sexLabel,
	skinToneById,
	weightLabel,
} from "../state/catalog"
import {
	SELECTION_INDEX,
	SELECTION_STEPS,
	STEP_ORDER,
	useOutfitStore,
} from "../state/store"
import type { StepId } from "../state/types"

export function Header() {
	const step = useOutfitStore((s) => s.step)
	const back = useOutfitStore((s) => s.back)
	const startTour = useOutfitStore((s) => s.startTour)
	const canBack = STEP_ORDER.indexOf(step) > 0
	return (
		<header className="flex shrink-0 items-center justify-between px-6 pb-3 pt-5 lg:px-8">
			<div className="flex items-baseline gap-2.5">
				<span className="font-display text-[21px] italic leading-none text-ink">
					Forme
				</span>
				<span className="text-[9px] uppercase tracking-[0.34em] text-soft">
					fitting room
				</span>
			</div>
			<div className="flex items-center gap-5">
				<AnimatePresence initial={false}>
					{canBack ? (
						<motion.button
							key="back"
							initial={{ opacity: 0, x: 6 }}
							animate={{ opacity: 1, x: 0 }}
							exit={{ opacity: 0, x: 6 }}
							transition={{ duration: 0.3 }}
							type="button"
							onClick={back}
							className="text-[11px] uppercase tracking-[0.18em] text-soft transition-colors hover:text-ink"
						>
							{"\u2190"} Back
						</motion.button>
					) : null}
				</AnimatePresence>
				<button
					type="button"
					data-tour="guide"
					onClick={startTour}
					className="rounded-full border border-line px-3 py-1.5 text-[10.5px] uppercase tracking-[0.16em] text-soft transition-all hover:border-soft/60 hover:text-ink"
				>
					Guide
				</button>
			</div>
		</header>
	)
}

export function Progress() {
	const step = useOutfitStore((s) => s.step)
	const furthest = useOutfitStore((s) => s.furthest)
	const go = useOutfitStore((s) => s.go)
	const current = SELECTION_INDEX[step] ?? -1
	const active = current >= 0 ? current : step === "result" ? SELECTION_STEPS.length - 1 : -1
	return (
		<div data-tour="progress" className="shrink-0 px-6 lg:px-8">
			<div className="flex items-center gap-1.5">
				{SELECTION_STEPS.map((s, i) => {
					const reachable = i + 1 <= furthest
					return (
						<button
							key={s}
							type="button"
							disabled={!reachable}
							onClick={() => reachable && go(s)}
							aria-label={s}
							className={`h-[2.5px] flex-1 rounded-full transition-all duration-500 ${
								i <= active
									? "bg-ink"
									: reachable
										? "bg-soft/40 hover:bg-soft/70"
										: "bg-line"
							}`}
						/>
					)
				})}
				<span className="ml-2 w-[52px] shrink-0 text-right text-[10px] uppercase tracking-[0.18em] text-soft">
					{current >= 0
						? `${String(current + 1).padStart(2, "0")} / ${SELECTION_STEPS.length}`
						: step === "result"
							? "look"
							: ""}
				</span>
			</div>
		</div>
	)
}

export function SummaryRail() {
	const step = useOutfitStore((s) => s.step)
	const furthest = useOutfitStore((s) => s.furthest)
	const params = useOutfitStore((s) => s.params)
	const outfitId = useOutfitStore((s) => s.outfitId)
	const colorwayIndex = useOutfitStore((s) => s.colorwayIndex)
	const go = useOutfitStore((s) => s.go)
	if (step === "welcome" || step === "result") return null

	const outfit = outfitById(outfitId)
	const colorway =
		outfit.colorways[Math.min(colorwayIndex, outfit.colorways.length - 1)]
	const chips: { step: StepId; label: string }[] = []
	if (furthest >= 1) chips.push({ step: "sex", label: sexLabel(params.sex) })
	if (furthest >= 2) chips.push({ step: "height", label: `${params.height} cm` })
	if (furthest >= 3) chips.push({ step: "weight", label: weightLabel(params.weight) })
	if (furthest >= 4) chips.push({ step: "build", label: buildLabel(params.build) })
	if (furthest >= 5) chips.push({ step: "frame", label: frameLabel(params.frame) })
	if (furthest >= 6) chips.push({ step: "skin", label: skinToneById(params.skin).name })
	if (furthest >= 7)
		chips.push({
			step: "outfit",
			label: outfit.id === "none" ? "Nothing at all" : `${outfit.name} \u00b7 ${colorway.name}`,
		})

	return (
		<footer data-tour="summary" className="shrink-0 px-6 pb-5 pt-2 lg:px-8">
			<div className="no-scrollbar flex gap-1.5 overflow-x-auto">
				{chips.map((chip) => (
					<button
						key={chip.step}
						type="button"
						onClick={() => go(chip.step)}
						className={`shrink-0 whitespace-nowrap rounded-full border px-2.5 py-1 text-[10.5px] transition-all duration-300 ${
							step === chip.step
								? "border-ink/60 bg-card text-ink"
								: "border-line text-soft hover:border-soft/50 hover:text-ink"
						}`}
					>
						{chip.label}
					</button>
				))}
			</div>
		</footer>
	)
}

export function StageOverlays() {
	const cameraDirty = useOutfitStore((s) => s.cameraDirty)
	const resetCamera = useOutfitStore((s) => s.resetCamera)
	const step = useOutfitStore((s) => s.step)
	const [hintVisible, setHintVisible] = useState(true)

	useEffect(() => {
		const hide = () => setHintVisible(false)
		window.addEventListener("pointerdown", hide, { once: true })
		const timer = window.setTimeout(hide, 10000)
		return () => {
			window.removeEventListener("pointerdown", hide)
			window.clearTimeout(timer)
		}
	}, [])

	return (
		<>
			<div className="vignette pointer-events-none absolute inset-0" />
			{step === "result" ? (
				<motion.div
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					transition={{ duration: 0.8, delay: 0.4 }}
					className="pointer-events-none absolute left-6 top-5 text-[10px] uppercase tracking-[0.34em] text-soft/80"
				>
					The look
				</motion.div>
			) : null}
			<div className="pointer-events-none absolute bottom-5 left-1/2 -translate-x-1/2">
				<AnimatePresence>
					{hintVisible ? (
						<motion.p
							initial={{ opacity: 0, y: 8 }}
							animate={{ opacity: 1, y: 0 }}
							exit={{ opacity: 0, y: 6 }}
							transition={{ duration: 0.7, delay: 1, ease: [0.22, 1, 0.36, 1] }}
							className="whitespace-nowrap rounded-full border border-line/80 bg-paper/70 px-4 py-1.5 text-[10.5px] tracking-wide text-soft backdrop-blur-sm"
						>
							Drag to turn {"\u00b7"} scroll to zoom {"\u00b7"} shift-drag to move
						</motion.p>
					) : null}
				</AnimatePresence>
			</div>
			<AnimatePresence>
				{cameraDirty ? (
					<motion.button
						key="reset"
						type="button"
						initial={{ opacity: 0, y: 8 }}
						animate={{ opacity: 1, y: 0 }}
						exit={{ opacity: 0, y: 8 }}
						transition={{ duration: 0.35 }}
						onClick={resetCamera}
						className="absolute bottom-5 right-5 rounded-full border border-line bg-paper/80 px-3.5 py-1.5 text-[10.5px] uppercase tracking-[0.16em] text-soft backdrop-blur-sm transition-colors hover:text-ink"
					>
						Reset view
					</motion.button>
				) : null}
			</AnimatePresence>
		</>
	)
}
