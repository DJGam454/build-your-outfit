import { create } from "zustand"
import { DEFAULT_PARAMS, outfitById, outfitForSex } from "./catalog"
import type { BodyParams, StepId } from "./types"

export const STEP_ORDER: StepId[] = [
	"welcome",
	"sex",
	"height",
	"weight",
	"build",
	"frame",
	"skin",
	"outfit",
	"result",
]

export const SELECTION_STEPS: StepId[] = [
	"sex",
	"height",
	"weight",
	"build",
	"frame",
	"skin",
	"outfit",
]

export const SELECTION_INDEX: Partial<Record<StepId, number>> = Object.fromEntries(
	SELECTION_STEPS.map((s, i) => [s, i]),
)

export const TOUR_SEEN_KEY = "forme.tour.v1"

interface AppState {
	step: StepId
	furthest: number
	params: BodyParams
	outfitId: string
	colorwayIndex: number
	tourStep: number | null
	cameraResetTick: number
	cameraDirty: boolean
	setParam: <K extends keyof BodyParams>(key: K, value: BodyParams[K]) => void
	setOutfit: (id: string) => void
	setColorway: (index: number) => void
	go: (step: StepId) => void
	next: () => void
	back: () => void
	reset: () => void
	startTour: () => void
	endTour: () => void
	setTourStep: (index: number) => void
	resetCamera: () => void
	setCameraDirty: (dirty: boolean) => void
}

export const useOutfitStore = create<AppState>((set, get) => ({
	step: "welcome",
	furthest: 0,
	params: { ...DEFAULT_PARAMS },
	outfitId: "none",
	colorwayIndex: 0,
	tourStep: null,
	cameraResetTick: 0,
	cameraDirty: false,

	setParam: (key, value) =>
		set((state) => {
			const params = { ...state.params, [key]: value }
			let outfitId = state.outfitId
			let colorwayIndex = state.colorwayIndex
			if (key === "sex") {
				const allowed = outfitForSex(params.sex)
				if (!allowed.some((o) => o.id === outfitId)) {
					outfitId = "none"
					colorwayIndex = 0
				}
			}
			return { params, outfitId, colorwayIndex }
		}),

	setOutfit: (id) => set({ outfitId: outfitById(id).id, colorwayIndex: 0 }),

	setColorway: (index) => set({ colorwayIndex: index }),

	go: (step) =>
		set((state) => ({
			step,
			furthest: Math.max(state.furthest, STEP_ORDER.indexOf(step)),
		})),

	next: () => {
		const index = STEP_ORDER.indexOf(get().step)
		set({
			step: STEP_ORDER[Math.min(index + 1, STEP_ORDER.length - 1)],
			furthest: Math.max(get().furthest, index + 1),
		})
	},

	back: () => {
		const index = STEP_ORDER.indexOf(get().step)
		set({ step: STEP_ORDER[Math.max(index - 1, 0)] })
	},

	reset: () =>
		set({
			step: "welcome",
			furthest: 0,
			params: { ...DEFAULT_PARAMS },
			outfitId: "none",
			colorwayIndex: 0,
			cameraResetTick: get().cameraResetTick + 1,
		}),

	startTour: () => set({ tourStep: 0 }),

	endTour: () => {
		try {
			window.localStorage.setItem(TOUR_SEEN_KEY, "1")
		} catch {
			void 0
		}
		set({ tourStep: null })
	},

	setTourStep: (index) => set({ tourStep: index }),

	resetCamera: () => set({ cameraResetTick: get().cameraResetTick + 1 }),

	setCameraDirty: (dirty) => set({ cameraDirty: dirty }),
}))
