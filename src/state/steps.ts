import type { StepId } from "./types"

export interface CameraPreset {
	distF: number
	targetYF: number
	yaw: number
	pitch: number
}

export const CAMERA: Record<StepId, CameraPreset> = {
	welcome: { distF: 2.3, targetYF: 0.55, yaw: 0.45, pitch: 0.08 },
	sex: { distF: 2.3, targetYF: 0.55, yaw: 0.4, pitch: 0.07 },
	height: { distF: 2.55, targetYF: 0.55, yaw: 0.32, pitch: 0.06 },
	weight: { distF: 1.9, targetYF: 0.56, yaw: 0.3, pitch: 0.05 },
	build: { distF: 1.15, targetYF: 0.66, yaw: 0.42, pitch: 0.03 },
	frame: { distF: 1.12, targetYF: 0.68, yaw: 0.5, pitch: 0.03 },
	skin: { distF: 0.95, targetYF: 0.86, yaw: 0.42, pitch: 0.02 },
	outfit: { distF: 2.3, targetYF: 0.55, yaw: 0.38, pitch: 0.06 },
	result: { distF: 2.35, targetYF: 0.55, yaw: 0.3, pitch: 0.05 },
}

export interface StepMeta {
	kicker: string
	title: string
	subtitle: string
}

export const STEP_META: Record<StepId, StepMeta> = {
	welcome: {
		kicker: "FORME",
		title: "Build the look, then the outfit.",
		subtitle:
			"A quiet room to shape a body and dress it. Take your time, or take the defaults. Nothing here is permanent.",
	},
	sex: {
		kicker: "Step 01",
		title: "Who are we dressing?",
		subtitle: "The body every garment will be cut around.",
	},
	height: {
		kicker: "Step 02",
		title: "How tall do we stand?",
		subtitle: "Take a preset, or drag to the centimeter.",
	},
	weight: {
		kicker: "Step 03",
		title: "Where does the weight sit?",
		subtitle: "It changes how cloth falls - and where it hugs.",
	},
	build: {
		kicker: "Step 04",
		title: "How is the body built?",
		subtitle: "Muscle reads through shoulders, arms and back.",
	},
	frame: {
		kicker: "Step 05",
		title: "Broad, or finely drawn?",
		subtitle: "The frame sets the silhouette everything else rests on.",
	},
	skin: {
		kicker: "Step 06",
		title: "A tone for the mannequin.",
		subtitle: "Only the mannequin. Fabric colors come next.",
	},
	outfit: {
		kicker: "Step 07",
		title: "Now, the outfit.",
		subtitle: "Choose a look, then its palette. Or wear nothing at all.",
	},
	result: {
		kicker: "Your look",
		title: "This is you.",
		subtitle:
			"Drag to turn, scroll to move closer. Take a picture, or start again.",
	},
}
