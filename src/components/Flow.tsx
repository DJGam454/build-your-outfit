import { AnimatePresence, motion } from "framer-motion"
import type { ReactElement, ReactNode } from "react"
import { getRenderer } from "../lib/renderer"
import {
	BUILD_PRESETS,
	FRAME_PRESETS,
	HEIGHT_PRESETS,
	SKIN_TONES,
	WEIGHT_PRESETS,
	buildLabel,
	frameLabel,
	outfitById,
	outfitForSex,
	sexLabel,
	skinToneById,
	weightLabel,
} from "../state/catalog"
import { useOutfitStore } from "../state/store"
import { STEP_META } from "../state/steps"
import type { Sex, SkinToneId, StepId } from "../state/types"
import {
	ChipButton,
	EASE,
	FineSlider,
	GhostButton,
	Kicker,
	OptionCard,
	PrimaryButton,
	StepSection,
	SwatchRow,
	Title,
	useChoose,
} from "./ui"

export function Flow() {
	const step = useOutfitStore((s) => s.step)
	const Step = STEP_VIEWS[step]
	return (
		<div className="flex h-full min-h-0 flex-col">
			<AnimatePresence mode="wait">
				<motion.div
					key={step}
					initial={{ opacity: 0, y: 16 }}
					animate={{ opacity: 1, y: 0 }}
					exit={{ opacity: 0, y: -12 }}
					transition={{ duration: 0.42, ease: EASE }}
					className="flex min-h-0 flex-1 flex-col"
				>
					<Step />
				</motion.div>
			</AnimatePresence>
		</div>
	)
}

function StepHeader({ id }: { id: StepId }) {
	const meta = STEP_META[id]
	return (
		<header className="mb-5 shrink-0">
			<Kicker>{meta.kicker}</Kicker>
			<Title className="mt-2.5">{meta.title}</Title>
			<p className="mt-2.5 max-w-[48ch] text-[13px] leading-relaxed text-soft">
				{meta.subtitle}
			</p>
		</header>
	)
}

function StepBody({ children }: { children: ReactNode }) {
	return (
		<div className="no-scrollbar min-h-0 flex-1 overflow-y-auto pb-1 pr-0.5">
			{children}
		</div>
	)
}

function StepFooter({ children }: { children: ReactNode }) {
	return (
		<div className="mt-5 flex shrink-0 flex-wrap items-center gap-x-6 gap-y-3">
			{children}
		</div>
	)
}

function WelcomeStep() {
	const next = useOutfitStore((s) => s.next)
	const startTour = useOutfitStore((s) => s.startTour)
	return (
		<>
			<StepHeader id="welcome" />
			<StepBody>
				<StepSection delay={0.05}>
					<div className="rounded-2xl border border-line bg-card/60 p-4">
						<p className="text-[12.5px] leading-relaxed text-soft">
							Seven quiet questions: who, how tall, how built, which frame,
							what tone. Then the wardrobe - a small, considered rail to pick
							from. Every optional step has a default, so you can simply press
							through.
						</p>
					</div>
				</StepSection>
			</StepBody>
			<StepFooter>
				<PrimaryButton onClick={next}>Begin the fitting {"\u2192"}</PrimaryButton>
				<GhostButton onClick={startTour}>Take the tour</GhostButton>
				<span className="text-[11px] text-soft/80">about three minutes</span>
			</StepFooter>
		</>
	)
}

function SexStep() {
	const sex = useOutfitStore((s) => s.params.sex)
	const setParam = useOutfitStore((s) => s.setParam)
	const choose = useChoose()
	const options: { value: Sex; label: string; hint: string }[] = [
		{
			value: "male",
			label: "Male",
			hint: "Default build - broader shoulder, straighter line",
		},
		{
			value: "female",
			label: "Female",
			hint: "Default build - tapered waist, softer line",
		},
	]
	return (
		<>
			<StepHeader id="sex" />
			<StepBody>
				<StepSection delay={0.05}>
					<div className="grid grid-cols-2 gap-2.5">
						{options.map((option) => (
							<button
								key={option.value}
								type="button"
								onClick={() =>
									choose(() => setParam("sex", option.value))
								}
								className={`flex flex-col items-start gap-3 rounded-2xl border p-4 text-left transition-all duration-300 ${
									sex === option.value
										? "border-ink bg-card shadow-[0_10px_30px_-18px_rgba(27,26,24,0.5)]"
										: "border-line hover:border-soft/50 hover:bg-card/70"
								}`}
							>
								<Silhouette sex={option.value} />
								<span>
									<span className="block text-[13.5px] font-medium text-ink">
										{option.label}
									</span>
									<span className="mt-0.5 block text-[11px] leading-snug text-soft">
										{option.hint}
									</span>
								</span>
							</button>
						))}
					</div>
				</StepSection>
			</StepBody>
			<StepFooter>
				<span className="text-[11px] text-soft">
					More builds are on the way - this first pass is a binary default.
				</span>
			</StepFooter>
		</>
	)
}

function HeightStep() {
	const height = useOutfitStore((s) => s.params.height)
	const setParam = useOutfitStore((s) => s.setParam)
	const next = useOutfitStore((s) => s.next)
	const choose = useChoose()
	return (
		<>
			<StepHeader id="height" />
			<StepBody>
				<StepSection delay={0.05}>
					<div className="grid grid-cols-2 gap-2.5">
						{HEIGHT_PRESETS.map((preset) => (
							<ChipButton
								key={preset.label}
								label={preset.label}
								hint={preset.hint}
								selected={height === preset.value}
								onClick={() => choose(() => setParam("height", preset.value))}
							/>
						))}
					</div>
				</StepSection>
				<StepSection delay={0.12}>
					<div className="mt-3">
						<FineSlider
							label="To the centimeter"
							min={150}
							max={200}
							step={1}
							value={height}
							onChange={(v) => setParam("height", v)}
							format={(v) => `${v} cm`}
						/>
					</div>
				</StepSection>
			</StepBody>
			<StepFooter>
				<PrimaryButton onClick={next}>Continue</PrimaryButton>
				<GhostButton
					dataTour="default"
					onClick={() => {
						setParam("height", 172)
						next()
					}}
				>
					Use the average, 172 cm
				</GhostButton>
			</StepFooter>
		</>
	)
}

function WeightStep() {
	const weight = useOutfitStore((s) => s.params.weight)
	const setParam = useOutfitStore((s) => s.setParam)
	const next = useOutfitStore((s) => s.next)
	const choose = useChoose()
	return (
		<>
			<StepHeader id="weight" />
			<StepBody>
				<StepSection delay={0.05}>
					<div className="grid grid-cols-2 gap-2.5">
						{WEIGHT_PRESETS.map((preset) => (
							<ChipButton
								key={preset.label}
								label={preset.label}
								hint={preset.hint}
								selected={Math.abs(weight - preset.value) < 0.02}
								onClick={() => choose(() => setParam("weight", preset.value))}
							/>
						))}
					</div>
				</StepSection>
				<StepSection delay={0.12}>
					<div className="mt-3">
						<FineSlider
							label="Fine tune the presence"
							min={0}
							max={1}
							step={0.01}
							value={weight}
							onChange={(v) => setParam("weight", v)}
							format={(v) => weightLabel(v)}
						/>
					</div>
				</StepSection>
			</StepBody>
			<StepFooter>
				<PrimaryButton onClick={next}>Continue</PrimaryButton>
				<GhostButton
					onClick={() => {
						setParam("weight", 0.5)
						next()
					}}
				>
					Keep it balanced
				</GhostButton>
			</StepFooter>
		</>
	)
}

function BuildStep() {
	const build = useOutfitStore((s) => s.params.build)
	const setParam = useOutfitStore((s) => s.setParam)
	const next = useOutfitStore((s) => s.next)
	const choose = useChoose()
	return (
		<>
			<StepHeader id="build" />
			<StepBody>
				<StepSection delay={0.05}>
					<div className="grid gap-2.5">
						{BUILD_PRESETS.map((preset) => (
							<OptionCard
								key={preset.label}
								label={preset.label}
								hint={preset.hint}
								selected={Math.abs(build - preset.value) < 0.02}
								glyph={<BuildGlyph value={preset.value} />}
								onClick={() => choose(() => setParam("build", preset.value))}
							/>
						))}
					</div>
				</StepSection>
			</StepBody>
			<StepFooter>
				<GhostButton onClick={next}>Skip - keep it as is</GhostButton>
			</StepFooter>
		</>
	)
}

function FrameStep() {
	const frame = useOutfitStore((s) => s.params.frame)
	const setParam = useOutfitStore((s) => s.setParam)
	const next = useOutfitStore((s) => s.next)
	const choose = useChoose()
	return (
		<>
			<StepHeader id="frame" />
			<StepBody>
				<StepSection delay={0.05}>
					<div className="grid gap-2.5">
						{FRAME_PRESETS.map((preset) => (
							<OptionCard
								key={preset.label}
								label={preset.label}
								hint={preset.hint}
								selected={Math.abs(frame - preset.value) < 0.02}
								glyph={<FrameGlyph value={preset.value} />}
								onClick={() => choose(() => setParam("frame", preset.value))}
							/>
						))}
					</div>
				</StepSection>
			</StepBody>
			<StepFooter>
				<GhostButton onClick={next}>Skip - keep it classic</GhostButton>
			</StepFooter>
		</>
	)
}

function SkinStep() {
	const skin = useOutfitStore((s) => s.params.skin)
	const setParam = useOutfitStore((s) => s.setParam)
	const next = useOutfitStore((s) => s.next)
	return (
		<>
			<StepHeader id="skin" />
			<StepBody>
				<StepSection delay={0.05}>
					<SwatchRow
						tones={SKIN_TONES}
						value={skin}
						onChange={(id) => setParam("skin", id as SkinToneId)}
					/>
				</StepSection>
			</StepBody>
			<StepFooter>
				<PrimaryButton onClick={next}>Continue</PrimaryButton>
				<GhostButton
					dataTour="default"
					onClick={() => {
						setParam("skin", "sand")
						next()
					}}
				>
					Keep Sand
				</GhostButton>
			</StepFooter>
		</>
	)
}

function OutfitStep() {
	const sex = useOutfitStore((s) => s.params.sex)
	const outfitId = useOutfitStore((s) => s.outfitId)
	const colorwayIndex = useOutfitStore((s) => s.colorwayIndex)
	const setOutfit = useOutfitStore((s) => s.setOutfit)
	const setColorway = useOutfitStore((s) => s.setColorway)
	const next = useOutfitStore((s) => s.next)
	const outfit = outfitById(outfitId)
	const options = outfitForSex(sex)
	return (
		<>
			<StepHeader id="outfit" />
			<StepBody>
				<StepSection delay={0.05}>
					<div className="grid gap-2.5">
						{options.map((option) => (
							<OutfitCard
								key={option.id}
								name={option.name}
								tagline={option.tagline}
								colors={[option.colorways[0].top, option.colorways[0].bottom]}
								bare={option.id === "none"}
								selected={option.id === outfitId}
								onClick={() => setOutfit(option.id)}
							/>
						))}
					</div>
				</StepSection>
				<AnimatePresence initial={false}>
					{outfit.colorways.length > 1 ? (
						<motion.div
							key="palette"
							initial={{ opacity: 0, height: 0 }}
							animate={{ opacity: 1, height: "auto" }}
							exit={{ opacity: 0, height: 0 }}
							transition={{ duration: 0.4, ease: EASE }}
							className="overflow-hidden"
						>
							<div className="mt-4 rounded-2xl border border-line bg-card/60 p-4">
								<p className="text-[10px] uppercase tracking-[0.22em] text-soft">
									Palette
								</p>
								<div className="mt-3 flex flex-wrap gap-2">
									{outfit.colorways.map((colorway, index) => (
										<ColorwayChip
											key={colorway.id}
											name={colorway.name}
											colors={[colorway.top, colorway.bottom]}
											selected={index === colorwayIndex}
											onClick={() => setColorway(index)}
										/>
									))}
								</div>
							</div>
						</motion.div>
					) : null}
				</AnimatePresence>
			</StepBody>
			<StepFooter>
				<PrimaryButton onClick={next}>Continue</PrimaryButton>
				<GhostButton
					onClick={() => {
						setOutfit("none")
						next()
					}}
				>
					Wear nothing at all
				</GhostButton>
			</StepFooter>
		</>
	)
}

function ResultStep() {
	const params = useOutfitStore((s) => s.params)
	const outfitId = useOutfitStore((s) => s.outfitId)
	const colorwayIndex = useOutfitStore((s) => s.colorwayIndex)
	const reset = useOutfitStore((s) => s.reset)
	const go = useOutfitStore((s) => s.go)
	const outfit = outfitById(outfitId)
	const colorway = outfit.colorways[Math.min(colorwayIndex, outfit.colorways.length - 1)]
	const rows: [string, string][] = [
		["Body", sexLabel(params.sex)],
		["Height", `${params.height} cm`],
		["Weight", weightLabel(params.weight)],
		["Build", buildLabel(params.build)],
		["Frame", frameLabel(params.frame)],
		["Tone", skinToneById(params.skin).name],
		[
			"Outfit",
			outfit.id === "none" ? "Nothing at all" : `${outfit.name} \u00b7 ${colorway.name}`,
		],
	]
	return (
		<>
			<StepHeader id="result" />
			<StepBody>
				<StepSection delay={0.05}>
					<dl className="divide-y divide-line rounded-2xl border border-line bg-card/60">
						{rows.map(([key, value]) => (
							<div
								key={key}
								className="flex items-baseline justify-between gap-4 px-4 py-3"
							>
								<dt className="shrink-0 text-[10.5px] uppercase tracking-[0.2em] text-soft">
									{key}
								</dt>
								<dd className="text-right text-[13px] text-ink">{value}</dd>
							</div>
						))}
					</dl>
				</StepSection>
			</StepBody>
			<StepFooter>
				<PrimaryButton onClick={downloadLook}>Download the look</PrimaryButton>
				<GhostButton onClick={() => go("outfit")}>Change the outfit</GhostButton>
				<GhostButton onClick={reset}>Start over</GhostButton>
			</StepFooter>
		</>
	)
}

const STEP_VIEWS: Record<StepId, () => ReactElement> = {
	welcome: WelcomeStep,
	sex: SexStep,
	height: HeightStep,
	weight: WeightStep,
	build: BuildStep,
	frame: FrameStep,
	skin: SkinStep,
	outfit: OutfitStep,
	result: ResultStep,
}

function OutfitCard({
	name,
	tagline,
	colors,
	bare,
	selected,
	onClick,
}: {
	name: string
	tagline: string
	colors: [string, string]
	bare: boolean
	selected: boolean
	onClick: () => void
}) {
	return (
		<button
			type="button"
			onClick={onClick}
			className={`group flex w-full items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-left transition-all duration-300 ${
				selected
					? "border-ink bg-card shadow-[0_10px_30px_-18px_rgba(27,26,24,0.5)]"
					: "border-line hover:border-soft/50 hover:bg-card/70"
			}`}
		>
			<span className="flex min-w-0 items-center gap-3">
				<span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-line bg-paper">
					{bare ? (
						<span className="block h-4 w-4 rounded-full border border-dashed border-soft/60" />
					) : (
						<>
							<span className="h-full w-1/2" style={{ background: colors[0] }} />
							<span className="h-full w-1/2" style={{ background: colors[1] }} />
						</>
					)}
				</span>
				<span className="min-w-0">
					<span className="block truncate text-[13.5px] font-medium text-ink">
						{name}
					</span>
					<span className="mt-0.5 block truncate text-[11.5px] text-soft">
						{tagline}
					</span>
				</span>
			</span>
			<span
				className={`h-1.5 w-1.5 shrink-0 rounded-full transition-all duration-300 ${
					selected ? "bg-accent" : "bg-line group-hover:bg-soft/40"
				}`}
			/>
		</button>
	)
}

function ColorwayChip({
	name,
	colors,
	selected,
	onClick,
}: {
	name: string
	colors: [string, string]
	selected: boolean
	onClick: () => void
}) {
	return (
		<button
			type="button"
			onClick={onClick}
			className={`flex items-center gap-2 rounded-full border py-1 pl-1 pr-3 transition-all duration-300 ${
				selected ? "border-ink bg-card" : "border-line hover:border-soft/50"
			}`}
		>
			<span className="flex h-5 w-5 overflow-hidden rounded-full border border-line/70">
				<span className="h-full w-1/2" style={{ background: colors[0] }} />
				<span className="h-full w-1/2" style={{ background: colors[1] }} />
			</span>
			<span className={`text-[11.5px] ${selected ? "text-ink" : "text-soft"}`}>
				{name}
			</span>
		</button>
	)
}

function Silhouette({ sex }: { sex: Sex }) {
	return (
		<svg
			viewBox="0 0 40 48"
			className="h-10 w-8 text-ink/75"
			fill="none"
			stroke="currentColor"
			strokeWidth="1.5"
			strokeLinejoin="round"
			strokeLinecap="round"
			aria-hidden
		>
			<circle cx="20" cy="8.5" r="5" />
			{sex === "male" ? (
				<path d="M10.5 21.5c0-4.4 3.8-7 9.5-7s9.5 2.6 9.5 7v8.5h-4.2V43h-10.6V30h-4.2z" />
			) : (
				<path d="M12.5 21c0-4 3.4-6.5 7.5-6.5s7.5 2.5 7.5 6.5c0 3.3-1.5 4.9-1.5 7.3V43h-4.4l-.6-8.6h-2L18.6 43h-4.4V28.3c0-2.4-1.7-4-1.7-7.3z" />
			)}
		</svg>
	)
}

function BuildGlyph({ value }: { value: number }) {
	return (
		<span className="flex h-8 w-8 items-end justify-center gap-[3px]">
			{[0.55, 1, 0.8].map((k, i) => (
				<span
					key={i}
					className="rounded-full bg-ink/70"
					style={{ width: 2 + value * 3.4, height: 8 + k * 16 }}
				/>
			))}
		</span>
	)
}

function FrameGlyph({ value }: { value: number }) {
	const shoulders = 9 + ((value + 1) / 2) * 17
	return (
		<span className="flex h-8 w-8 flex-col items-center justify-center gap-[4px]">
			<span
				className="h-[3px] rounded-full bg-ink/70"
				style={{ width: shoulders }}
			/>
			<span className="h-[3px] w-[14px] rounded-full bg-ink/30" />
		</span>
	)
}

function downloadLook() {
	const gl = getRenderer()
	if (!gl) return
	const url = gl.domElement.toDataURL("image/png")
	const link = document.createElement("a")
	link.href = url
	link.download = "forme-look.png"
	link.click()
}
