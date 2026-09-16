import { useEffect, useRef } from "react"
import { useFrame, useThree } from "@react-three/fiber"
import { MathUtils, Vector3 } from "three"
import type * as THREE from "three"
import { CAMERA } from "../../state/steps"
import { useOutfitStore } from "../../state/store"

const clamp = (v: number, min: number, max: number) =>
	Math.min(max, Math.max(min, v))

const DRIFT_STEPS = new Set(["welcome", "result"])

interface PointerState {
	yawOff: number
	pitchOff: number
	distMult: number
	panX: number
	panY: number
	auto: number
	pinchDist: number
	midX: number
	midY: number
	hasMid: boolean
	pointers: Map<number, { x: number; y: number }>
}

export function CameraDirector() {
	const step = useOutfitStore((s) => s.step)
	const height = useOutfitStore((s) => s.params.height)
	const resetTick = useOutfitStore((s) => s.cameraResetTick)
	const setCameraDirty = useOutfitStore((s) => s.setCameraDirty)
	const { camera, gl } = useThree()

	const stepRef = useRef(step)
	const heightRef = useRef(height)
	stepRef.current = step
	heightRef.current = height

	const input = useRef<PointerState>({
		yawOff: 0,
		pitchOff: 0,
		distMult: 1,
		panX: 0,
		panY: 0,
		auto: 0,
		pinchDist: 0,
		midX: 0,
		midY: 0,
		hasMid: false,
		pointers: new Map(),
	})

	const look = useRef(new Vector3(0, 1, 0))
	const right = useRef(new Vector3())
	const up = useRef(new Vector3())
	const forward = useRef(new Vector3())

	const clearInput = () => {
		const inp = input.current
		inp.yawOff = 0
		inp.pitchOff = 0
		inp.distMult = 1
		inp.panX = 0
		inp.panY = 0
		setCameraDirty(false)
	}

	useEffect(() => {
		clearInput()
	}, [resetTick]) // eslint-disable-line react-hooks/exhaustive-deps

	useEffect(() => {
		const el = gl.domElement
		const inp = input.current

		const dirty = () =>
			setCameraDirty(
				Math.abs(inp.yawOff) > 0.01 ||
					Math.abs(inp.pitchOff) > 0.01 ||
					Math.abs(inp.distMult - 1) > 0.01 ||
					Math.abs(inp.panX) > 0.005 ||
					Math.abs(inp.panY) > 0.005,
			)

		const worldPerPixel = () => {
			const preset = CAMERA[stepRef.current]
			const dist = preset.distF * (heightRef.current / 100) * inp.distMult
			const fov = (camera as THREE.PerspectiveCamera).fov ?? 32
			const spread = 2 * Math.tan((fov * Math.PI) / 360) * dist
			return spread / Math.max(el.clientHeight, 1)
		}

		const onDown = (e: PointerEvent) => {
			inp.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY })
			try {
				el.setPointerCapture(e.pointerId)
			} catch {
				void 0
			}
		}

		const onMove = (e: PointerEvent) => {
			const p = inp.pointers.get(e.pointerId)
			if (!p) return
			const dx = e.clientX - p.x
			const dy = e.clientY - p.y
			p.x = e.clientX
			p.y = e.clientY

			if (inp.pointers.size === 1) {
				const wantsPan = e.shiftKey || (e.buttons & 2) !== 0 || (e.buttons & 4) !== 0
				if (wantsPan) {
					const wpp = worldPerPixel()
					inp.panX = clamp(inp.panX - dx * wpp, -1.2, 1.2)
					inp.panY = clamp(inp.panY + dy * wpp, -0.8, 1.2)
				} else {
					inp.yawOff -= dx * 0.0045
					inp.pitchOff = clamp(inp.pitchOff + dy * 0.0028, -0.4, 0.6)
				}
			} else if (inp.pointers.size === 2) {
				const pts = [...inp.pointers.values()]
				const d = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y)
				if (inp.pinchDist > 0 && d > 0) {
					inp.distMult = clamp(inp.distMult * (inp.pinchDist / d), 0.45, 2.2)
				}
				inp.pinchDist = d
				const midX = (pts[0].x + pts[1].x) / 2
				const midY = (pts[0].y + pts[1].y) / 2
				if (inp.hasMid) {
					const wpp = worldPerPixel()
					inp.panX = clamp(inp.panX - (midX - inp.midX) * wpp, -1.2, 1.2)
					inp.panY = clamp(inp.panY + (midY - inp.midY) * wpp, -0.8, 1.2)
				}
				inp.midX = midX
				inp.midY = midY
				inp.hasMid = true
			}
			dirty()
		}

		const onUp = (e: PointerEvent) => {
			inp.pointers.delete(e.pointerId)
			if (inp.pointers.size < 2) {
				inp.pinchDist = 0
				inp.hasMid = false
			}
		}

		const onWheel = (e: WheelEvent) => {
			e.preventDefault()
			inp.distMult = clamp(inp.distMult * (1 + e.deltaY * 0.0011), 0.45, 2.2)
			dirty()
		}

		const onDouble = () => clearInput()
		const onContext = (e: Event) => e.preventDefault()

		el.addEventListener("pointerdown", onDown)
		el.addEventListener("pointermove", onMove)
		el.addEventListener("pointerup", onUp)
		el.addEventListener("pointercancel", onUp)
		el.addEventListener("wheel", onWheel, { passive: false })
		el.addEventListener("dblclick", onDouble)
		el.addEventListener("contextmenu", onContext)

		return () => {
			el.removeEventListener("pointerdown", onDown)
			el.removeEventListener("pointermove", onMove)
			el.removeEventListener("pointerup", onUp)
			el.removeEventListener("pointercancel", onUp)
			el.removeEventListener("wheel", onWheel)
			el.removeEventListener("dblclick", onDouble)
			el.removeEventListener("contextmenu", onContext)
		}
	}, [gl, camera, setCameraDirty])

	useFrame((_, delta) => {
		const dt = Math.min(delta, 0.05)
		const inp = input.current
		const preset = CAMERA[step]
		const H = height / 100

		if (DRIFT_STEPS.has(step)) inp.auto += dt * 0.07

		const yaw = preset.yaw + inp.yawOff + inp.auto
		const pitch = clamp(preset.pitch + inp.pitchOff, -0.45, 0.75)
		const dist = preset.distF * H * inp.distMult

		camera.matrixWorld.extractBasis(right.current, up.current, forward.current)

		const tx = inp.panX * right.current.x + inp.panY * up.current.x
		const tyBase = preset.targetYF * H
		const ty = tyBase + inp.panX * right.current.y + inp.panY * up.current.y
		const tz = inp.panX * right.current.z + inp.panY * up.current.z

		const px = tx + Math.cos(pitch) * Math.sin(yaw) * dist
		const py = ty + Math.sin(pitch) * dist
		const pz = tz + Math.cos(pitch) * Math.cos(yaw) * dist

		const lambda = 3.2
		camera.position.x = MathUtils.damp(camera.position.x, px, lambda, dt)
		camera.position.y = MathUtils.damp(camera.position.y, py, lambda, dt)
		camera.position.z = MathUtils.damp(camera.position.z, pz, lambda, dt)

		look.current.x = MathUtils.damp(look.current.x, tx, lambda, dt)
		look.current.y = MathUtils.damp(look.current.y, ty, lambda, dt)
		look.current.z = MathUtils.damp(look.current.z, tz, lambda, dt)
		camera.lookAt(look.current)
	})

	return null
}
