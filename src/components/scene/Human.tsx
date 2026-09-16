import { useEffect, useMemo, useRef } from "react"
import { useFrame } from "@react-three/fiber"
import { useGLTF } from "@react-three/drei"
import { MathUtils } from "three"
import type { Object3D } from "three"
import {
	applyIdle,
	applyTone,
	morphWeights,
	prepareRig,
	setOutfitLayers,
	type HumanRig,
} from "../../lib/human/rig"
import { outfitById, skinToneById } from "../../state/catalog"
import { useOutfitStore } from "../../state/store"

const rigCache = new WeakMap<Object3D, HumanRig>()

export function Human() {
	const { scene } = useGLTF("/models/human-base.glb")
	const params = useOutfitStore((s) => s.params)
	const outfitId = useOutfitStore((s) => s.outfitId)
	const colorwayIndex = useOutfitStore((s) => s.colorwayIndex)

	const outfit = outfitById(outfitId)
	const colorway =
		outfit.colorways[Math.min(colorwayIndex, outfit.colorways.length - 1)]

	const rig = useMemo(() => {
		const cached = rigCache.get(scene)
		if (cached) return cached
		const prepared = prepareRig(scene)
		rigCache.set(scene, prepared)
		return prepared
	}, [scene])

	const target = useMemo(() => morphWeights(rig, params), [rig, params])
	const targetRef = useRef(target)
	targetRef.current = target

	useEffect(() => {
		setOutfitLayers(rig, outfit)
	}, [rig, outfit])

	useEffect(() => {
		applyTone(rig, skinToneById(params.skin).hex, colorway)
	}, [rig, params.skin, colorway])

	useFrame((state, delta) => {
		const dt = Math.min(delta, 0.05)
		const bodyInfluences = rig.body.morphTargetInfluences
		if (bodyInfluences) {
			for (let i = 0; i < bodyInfluences.length; i++) {
				bodyInfluences[i] = MathUtils.damp(
					bodyInfluences[i],
					targetRef.current[i],
					7,
					dt,
				)
			}
			for (const layer of Object.values(rig.layers)) {
				const inf = layer.morphTargetInfluences
				if (!inf) continue
				for (let i = 0; i < inf.length; i++) {
					inf[i] = bodyInfluences[i]
				}
			}
			const eyeInf = rig.eyes.morphTargetInfluences
			if (eyeInf) {
				for (let i = 0; i < eyeInf.length; i++) {
					const source = rig.eyeMorphMap[i]
					eyeInf[i] = source >= 0 ? bodyInfluences[source] : 0
				}
			}
		}
		applyIdle(rig, state.clock.elapsedTime)
	})

	return <primitive object={scene} />
}

useGLTF.preload("/models/human-base.glb")
