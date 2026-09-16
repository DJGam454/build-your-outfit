import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react"
import { motion } from "framer-motion"
import { TOUR_SEEN_KEY, useOutfitStore } from "../state/store"
import { EASE } from "./ui"

interface TourStop {
	anchor?: string
	title: string
	body: string
}

const STOPS: TourStop[] = [
	{
		anchor: "stage",
		title: "The fitting room",
		body: "This is your model, in the round. Drag anywhere on the stage to turn them - they breathe a little, too.",
	},
	{
		anchor: "stage",
		title: "Move in, move around",
		body: "Scroll or pinch to come closer. Shift-drag, right-drag or two fingers to slide the model anywhere you like. Double-click the stage to bring it all back.",
	},
	{
		anchor: "panel",
		title: "One question at a time",
		body: "Each step asks a single thing. Press an option and the flow carries you along on its own.",
	},
	{
		anchor: "default",
		title: "There is no wrong answer",
		body: "Every optional step has a gentle default. Skip, and one is chosen for you - you can always come back.",
	},
	{
		anchor: "progress",
		title: "The thread",
		body: "The line up top keeps your place. Tap an earlier mark to change your mind.",
	},
	{
		anchor: "summary",
		title: "Your choices, kept",
		body: "Everything you pick gathers here. Tap a chip to jump straight back to it.",
	},
	{
		anchor: "panel",
		title: "Then, the wardrobe",
		body: "The last step is clothes. Choose a look, pick a palette - or let the mannequin stay bare. Your look can be saved as a picture at the end.",
	},
	{
		anchor: "guide",
		title: "That is the whole room",
		body: "Reopen this tour any time from the Guide button. Now go build someone.",
	},
]

export function Tour() {
	const tourStep = useOutfitStore((s) => s.tourStep)
	const endTour = useOutfitStore((s) => s.endTour)
	const setTourStep = useOutfitStore((s) => s.setTourStep)

	useEffect(() => {
		let seen: string | null = null
		try {
			seen = window.localStorage.getItem(TOUR_SEEN_KEY)
		} catch {
			void 0
		}
		if (seen) return
		const timer = window.setTimeout(() => {
			useOutfitStore.getState().startTour()
		}, 1200)
		return () => window.clearTimeout(timer)
	}, [])

	useEffect(() => {
		if (tourStep === null) return
		const onKey = (event: KeyboardEvent) => {
			if (event.key === "Escape") endTour()
			if (event.key === "ArrowRight")
				setTourStep(Math.min(tourStep + 1, STOPS.length - 1))
			if (event.key === "ArrowLeft") setTourStep(Math.max(tourStep - 1, 0))
		}
		window.addEventListener("keydown", onKey)
		return () => window.removeEventListener("keydown", onKey)
	}, [tourStep, endTour, setTourStep])

	if (tourStep === null) return null
	const index = Math.min(tourStep, STOPS.length - 1)
	return (
		<TourOverlay
			stop={STOPS[index]}
			index={index}
			total={STOPS.length}
			onNext={() =>
				index >= STOPS.length - 1 ? endTour() : setTourStep(index + 1)
			}
			onBack={() => setTourStep(Math.max(index - 1, 0))}
			onEnd={endTour}
		/>
	)
}

function TourOverlay({
	stop,
	index,
	total,
	onNext,
	onBack,
	onEnd,
}: {
	stop: TourStop
	index: number
	total: number
	onNext: () => void
	onBack: () => void
	onEnd: () => void
}) {
	const [rect, setRect] = useState<DOMRect | null>(null)
	const [viewport, setViewport] = useState(() => ({
		w: window.innerWidth,
		h: window.innerHeight,
	}))
	const [card, setCard] = useState({ w: 288, h: 190 })
	const cardRef = useRef<HTMLDivElement>(null)

	useEffect(() => {
		let raf = 0
		const tick = () => {
			const el = stop.anchor
				? document.querySelector(`[data-tour="${stop.anchor}"]`)
				: null
			const next = el ? el.getBoundingClientRect() : null
			setRect((prev) => {
				if (!next && !prev) return prev
				if (
					next &&
					prev &&
					Math.abs(next.left - prev.left) < 0.5 &&
					Math.abs(next.top - prev.top) < 0.5 &&
					Math.abs(next.width - prev.width) < 0.5 &&
					Math.abs(next.height - prev.height) < 0.5
				) {
					return prev
				}
				return next
			})
			raf = requestAnimationFrame(tick)
		}
		raf = requestAnimationFrame(tick)
		return () => cancelAnimationFrame(raf)
	}, [stop.anchor])

	useEffect(() => {
		const onResize = () =>
			setViewport({ w: window.innerWidth, h: window.innerHeight })
		window.addEventListener("resize", onResize)
		return () => window.removeEventListener("resize", onResize)
	}, [])

	useLayoutEffect(() => {
		const el = cardRef.current
		if (el) setCard({ w: el.offsetWidth, h: el.offsetHeight })
	}, [index, stop])

	const position = useMemo(() => {
		const margin = 16
		if (!rect) {
			return {
				left: viewport.w / 2 - card.w / 2,
				top: viewport.h / 2 - card.h / 2,
			}
		}
		const mobile = viewport.w < 768
		let side: "left" | "right" | "top" | "bottom"
		if (mobile) {
			side = rect.top > viewport.h * 0.5 ? "top" : "bottom"
		} else {
			side = rect.left + rect.width / 2 > viewport.w * 0.55 ? "left" : "right"
		}
		let left = 0
		let top = 0
		if (side === "left") {
			left = rect.left - card.w - margin
			top = rect.top + rect.height / 2 - card.h / 2
		} else if (side === "right") {
			left = rect.right + margin
			top = rect.top + rect.height / 2 - card.h / 2
		} else if (side === "bottom") {
			left = rect.left + rect.width / 2 - card.w / 2
			top = rect.bottom + margin
		} else {
			left = rect.left + rect.width / 2 - card.w / 2
			top = rect.top - card.h - margin
		}
		left = Math.min(Math.max(left, margin), viewport.w - card.w - margin)
		top = Math.min(Math.max(top, margin), viewport.h - card.h - margin)
		return { left, top }
	}, [rect, card, viewport])

	return (
		<div className="pointer-events-none fixed inset-0 z-[70]">
			{rect ? (
				<motion.div
					className="absolute rounded-2xl border border-paper/70"
					initial={false}
					animate={{
						left: rect.left - 8,
						top: rect.top - 8,
						width: rect.width + 16,
						height: rect.height + 16,
					}}
					transition={{ duration: 0.35, ease: EASE }}
					style={{ boxShadow: "0 0 0 9999px rgba(24, 21, 17, 0.55)" }}
				/>
			) : (
				<div className="absolute inset-0 bg-[rgba(24,21,17,0.55)]" />
			)}
			<motion.div
				ref={cardRef}
				initial={false}
				animate={{ left: position.left, top: position.top }}
				transition={{ duration: 0.35, ease: EASE }}
				className="pointer-events-auto absolute w-[288px] rounded-2xl bg-ink p-5 text-paper shadow-[0_30px_60px_-20px_rgba(15,13,11,0.6)]"
			>
				<div className="flex items-center justify-between">
					<span className="text-[9.5px] uppercase tracking-[0.28em] text-paper/50">
						Tour {"\u00b7"} {index + 1} / {total}
					</span>
					<button
						type="button"
						onClick={onEnd}
						className="text-[10px] uppercase tracking-[0.18em] text-paper/50 transition-colors hover:text-paper"
					>
						Skip
					</button>
				</div>
				<h2 className="mt-3 font-display text-[21px] leading-tight">
					{stop.title}
				</h2>
				<p className="mt-2 text-[12px] leading-relaxed text-paper/70">
					{stop.body}
				</p>
				<div className="mt-4 flex items-center justify-between">
					<button
						type="button"
						onClick={onBack}
						disabled={index === 0}
						className="text-[11px] text-paper/60 transition-colors hover:text-paper disabled:opacity-30"
					>
						{"\u2190"} Back
					</button>
					<div className="flex items-center gap-3">
						<span className="text-[10px] text-paper/40">{"\u2190"} {"\u2192"} keys</span>
						<button
							type="button"
							onClick={onNext}
							className="rounded-full bg-accent px-4 py-2 text-[11px] font-medium tracking-wide text-paper transition-all hover:brightness-110"
						>
							{index >= total - 1 ? "Done" : "Next"}
						</button>
					</div>
				</div>
			</motion.div>
		</div>
	)
}
