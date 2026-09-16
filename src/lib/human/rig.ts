import * as THREE from "three"
import type { BodyParams, Colorway, Outfit } from "../../state/types"

export type ClothRole = "top" | "bottom" | "accent" | "shoe"

type RegionId =
	| "torso"
	| "neck"
	| "head"
	| "upperArmL"
	| "upperArmR"
	| "foreArmL"
	| "foreArmR"
	| "handL"
	| "handR"
	| "thighL"
	| "thighR"
	| "shinL"
	| "shinR"
	| "footL"
	| "footR"

const USED_MORPHS = [
	"bodyFeminine",
	"bodyMasculine",
	"bodyHeavier",
	"bodyThinner",
	"bodyMuscular",
	"bodySofter",
	"heightTaller",
	"heightShorter",
	"shouldersWider",
	"shouldersNarrower",
	"chestWider",
	"chestNarrower",
	"chestPectorals",
	"torsoLatsWider",
	"waistNarrower",
	"hipsWider",
	"hipsNarrower",
	"gluteusBigger",
	"bellyBigger",
	"bustBigger",
	"bustSmaller",
	"armsMuscular",
	"thighsThicker",
	"thighsThinner",
	"jawWider",
	"jawNarrower",
] as const

type UsedMorph = (typeof USED_MORPHS)[number]

export interface Anchors {
	height: number
	headTopLocal: number
	chinY: number
	shoulderY: number
	hipY: number
	kneeY: number
	ankleY: number
	waistY: number
	neckY: number
	shoulderL: THREE.Vector3
	shoulderR: THREE.Vector3
	handL: THREE.Vector3
	handR: THREE.Vector3
	hipL: THREE.Vector3
	hipR: THREE.Vector3
	footL: THREE.Vector3
	footR: THREE.Vector3
	hipHalfW: number
	hipHalfD: number
	waistHalfW: number
	waistHalfD: number
	chestHalfW: number
	chestHalfD: number
}

export interface HumanRig {
	body: THREE.SkinnedMesh
	eyes: THREE.SkinnedMesh
	skeleton: THREE.Skeleton
	bindMatrix: THREE.Matrix4
	index: Uint32Array
	basePosition: Float32Array
	baseNormal: Float32Array
	regionOfVertex: Uint8Array
	regionIds: RegionId[]
	morphs: Record<string, Float32Array>
	morphNames: string[]
	morphRelative: boolean
	anchors: Anchors
	materials: {
		skin: THREE.MeshPhysicalMaterial
		hair: THREE.MeshPhysicalMaterial
		eye: THREE.MeshPhysicalMaterial
		cloth: Record<ClothRole, THREE.MeshPhysicalMaterial>
		skirt: THREE.MeshPhysicalMaterial
	}
	layers: Record<string, THREE.SkinnedMesh>
	accessories: THREE.Group
	hipsBaseY: number
	eyeMorphMap: number[]
}

const REGION_BONES: Record<RegionId, string[]> = {
	torso: ["mixamorigHips", "mixamorigSpine", "mixamorigSpine1", "mixamorigSpine2"],
	neck: ["mixamorigNeck"],
	head: ["mixamorigHead"],
	upperArmL: ["mixamorigLeftArm"],
	upperArmR: ["mixamorigRightArm"],
	foreArmL: ["mixamorigLeftForeArm"],
	foreArmR: ["mixamorigRightForeArm"],
	handL: ["mixamorigLeftHand"],
	handR: ["mixamorigRightHand"],
	thighL: ["mixamorigLeftUpLeg"],
	thighR: ["mixamorigRightUpLeg"],
	shinL: ["mixamorigLeftLeg"],
	shinR: ["mixamorigRightLeg"],
	footL: ["mixamorigLeftFoot", "mixamorigLeftToeBase"],
	footR: ["mixamorigRightFoot", "mixamorigRightToeBase"],
}

const REGION_ORDER = Object.keys(REGION_BONES) as RegionId[]

const smoothstep = (e0: number, e1: number, x: number) => {
	const t = Math.min(Math.max((x - e0) / (e1 - e0), 0), 1)
	return t * t * (3 - 2 * t)
}

const clamp01 = (v: number) => Math.min(Math.max(v, 0), 1)

type AnyAttr = THREE.BufferAttribute | THREE.InterleavedBufferAttribute

function readVec3(attr: AnyAttr, count: number): Float32Array {
	const out = new Float32Array(count * 3)
	for (let i = 0; i < count; i++) {
		out[i * 3] = attr.getX(i)
		out[i * 3 + 1] = attr.getY(i)
		out[i * 3 + 2] = attr.getZ(i)
	}
	return out
}

function readVec4(attr: AnyAttr, count: number): Float32Array {
	const out = new Float32Array(count * 4)
	for (let i = 0; i < count; i++) {
		out[i * 4] = attr.getX(i)
		out[i * 4 + 1] = attr.getY(i)
		out[i * 4 + 2] = attr.getZ(i)
		out[i * 4 + 3] = attr.getW(i)
	}
	return out
}

function readVec4Int(attr: AnyAttr, count: number): Uint16Array {
	const out = new Uint16Array(count * 4)
	for (let i = 0; i < count; i++) {
		out[i * 4] = attr.getX(i)
		out[i * 4 + 1] = attr.getY(i)
		out[i * 4 + 2] = attr.getZ(i)
		out[i * 4 + 3] = attr.getW(i)
	}
	return out
}

function dominantRegion(
	skinIndex: Uint16Array,
	skinWeight: Float32Array,
	bones: THREE.Bone[],
) {
	const nameToRegion = new Map<string, number>()
	REGION_ORDER.forEach((region, i) => {
		for (const boneName of REGION_BONES[region]) nameToRegion.set(boneName, i)
	})
	const count = skinIndex.length / 4
	const out = new Uint8Array(count).fill(255)
	for (let v = 0; v < count; v++) {
		let best = 0
		let bestW = -1
		for (let k = 0; k < 4; k++) {
			const w = skinWeight[v * 4 + k]
			if (w > bestW) {
				bestW = w
				best = k
			}
		}
		const bone = bones[skinIndex[v * 4 + best]]
		const region = bone ? nameToRegion.get(bone.name) : undefined
		out[v] = region === undefined ? 255 : region
	}
	return out
}

export function prepareRig(scene: THREE.Object3D): HumanRig {
	const body = scene.getObjectByName("Body") as THREE.SkinnedMesh | undefined
	const eyes = scene.getObjectByName("Eyes") as THREE.SkinnedMesh | undefined
	if (!body || !eyes) throw new Error("human-base.glb: Body/Eyes not found")
	for (const name of ["Teeth", "Tongue"]) {
		const mesh = scene.getObjectByName(name)
		if (mesh?.parent) mesh.parent.remove(mesh)
	}

	scene.updateMatrixWorld(true)
	const skeleton = body.skeleton
	const geo = body.geometry
	const count = geo.attributes.position.count
	const basePosition = readVec3(geo.attributes.position, count)
	const baseNormal = readVec3(geo.attributes.normal, count)
	const skinIndex = readVec4Int(geo.attributes.skinIndex, count)
	const skinWeight = readVec4(geo.attributes.skinWeight, count)
	const index = new Uint32Array(geo.index ? (geo.index.array as ArrayLike<number>) : [])
	const regionOfVertex = dominantRegion(skinIndex, skinWeight, skeleton.bones)

	const parent = new Int32Array(count)
	for (let i = 0; i < count; i++) parent[i] = i
	const find = (a: number) => {
		let root = a
		while (parent[root] !== root) root = parent[root]
		while (parent[a] !== root) {
			const next = parent[a]
			parent[a] = root
			a = next
		}
		return root
	}
	for (let t = 0; t < index.length; t += 3) {
		const r0 = find(index[t])
		const r1 = find(index[t + 1])
		const r2 = find(index[t + 2])
		if (r1 !== r0) parent[r1] = r0
		if (r2 !== r0) parent[r2] = r0
	}
	const componentSize = new Map<number, number>()
	for (let v = 0; v < count; v++) {
		const root = find(v)
		componentSize.set(root, (componentSize.get(root) ?? 0) + 1)
	}
	for (let v = 0; v < count; v++) {
		if ((componentSize.get(find(v)) ?? 0) < 700) regionOfVertex[v] = 255
	}

	const morphs: Record<string, Float32Array> = {}
	const morphNames: string[] = []
	const dict = body.morphTargetDictionary ?? {}
	for (const name of USED_MORPHS) {
		const targetIndex = dict[name]
		if (targetIndex === undefined) continue
		const attr = geo.morphAttributes.position?.[targetIndex]
		if (!attr) continue
		morphs[name] = new Float32Array(attr.array)
		morphNames.push(name)
	}

	const trimmed = new THREE.BufferGeometry()
	trimmed.setAttribute("position", new THREE.BufferAttribute(basePosition, 3))
	trimmed.setAttribute("normal", new THREE.BufferAttribute(baseNormal, 3))
	trimmed.setAttribute("skinIndex", new THREE.BufferAttribute(skinIndex.slice(), 4))
	trimmed.setAttribute("skinWeight", new THREE.BufferAttribute(skinWeight.slice(), 4))
	trimmed.setIndex(new THREE.BufferAttribute(index.slice(), 1))
	trimmed.morphTargetsRelative = geo.morphTargetsRelative
	trimmed.morphAttributes.position = morphNames.map(
		(name) => new THREE.BufferAttribute(morphs[name], 3),
	)
	body.geometry = trimmed
	body.morphTargetInfluences = new Array(morphNames.length).fill(0)
	body.morphTargetDictionary = Object.fromEntries(morphNames.map((n, i) => [n, i]))
	body.frustumCulled = false

	const materials = {
		skin: new THREE.MeshPhysicalMaterial({
			color: "#dfc0a2",
			roughness: 0.58,
			clearcoat: 0.06,
			clearcoatRoughness: 0.6,
		}),
		hair: new THREE.MeshPhysicalMaterial({
			color: "#2b2420",
			roughness: 0.72,
			clearcoat: 0.12,
			sheen: 0.3,
		}),
		eye: new THREE.MeshPhysicalMaterial({
			color: "#3a2b20",
			roughness: 0.2,
			clearcoat: 0.6,
		}),
		cloth: {
			top: new THREE.MeshPhysicalMaterial({ roughness: 0.94, sheen: 0.65, sheenRoughness: 0.8 }),
			bottom: new THREE.MeshPhysicalMaterial({ roughness: 0.94, sheen: 0.65, sheenRoughness: 0.8 }),
			accent: new THREE.MeshPhysicalMaterial({ roughness: 0.86, sheen: 0.5, sheenRoughness: 0.7 }),
			shoe: new THREE.MeshPhysicalMaterial({ roughness: 0.5, clearcoat: 0.25 }),
		},
		skirt: new THREE.MeshPhysicalMaterial({
			roughness: 0.94,
			sheen: 0.6,
			sheenRoughness: 0.8,
			side: THREE.DoubleSide,
		}),
	}
	body.material = materials.skin
	body.castShadow = true
	body.receiveShadow = true
	eyes.material = materials.eye
	eyes.castShadow = false
	eyes.frustumCulled = false

	const eyePos = eyes.geometry.attributes.position as THREE.BufferAttribute
	let leftCount = 0
	let rightCount = 0
	const leftC = new THREE.Vector3()
	const rightC = new THREE.Vector3()
	for (let i = 0; i < eyePos.count; i++) {
		if (eyePos.getX(i) < 0) {
			leftC.add(new THREE.Vector3(eyePos.getX(i), eyePos.getY(i), eyePos.getZ(i)))
			leftCount++
		} else {
			rightC.add(new THREE.Vector3(eyePos.getX(i), eyePos.getY(i), eyePos.getZ(i)))
			rightCount++
		}
	}
	leftC.divideScalar(Math.max(leftCount, 1))
	rightC.divideScalar(Math.max(rightCount, 1))
	const tmp = new THREE.Vector3()
	for (let i = 0; i < eyePos.count; i++) {
		tmp.set(eyePos.getX(i), eyePos.getY(i), eyePos.getZ(i))
		const center = tmp.x < 0 ? leftC : rightC
		tmp.sub(center).multiplyScalar(0.86).add(center)
		tmp.z -= 0.004
		eyePos.setXYZ(i, tmp.x, tmp.y, tmp.z)
	}
	eyePos.needsUpdate = true

	const eyeMorphMap: number[] = []
	const eyeDict = eyes.morphTargetDictionary ?? {}
	const eyeMorphCount = eyes.geometry.morphAttributes.position?.length ?? 0
	eyes.morphTargetInfluences = new Array(eyeMorphCount).fill(0)
	for (let i = 0; i < eyeMorphCount; i++) {
		eyeMorphMap.push(-1)
	}
	morphNames.forEach((name, bodyIndex) => {
		const eyeIndex = eyeDict[name]
		if (eyeIndex !== undefined && eyeIndex < eyeMorphMap.length) {
			eyeMorphMap[eyeIndex] = bodyIndex
		}
	})

	const bones = skeleton.bones
	const bone = (name: string) => bones.find((b) => b.name === name)
	const local = (name: string) => {
		const b = bone(name)
		if (!b) return new THREE.Vector3()
		return body.worldToLocal(b.getWorldPosition(new THREE.Vector3()))
	}

	const headIndex = REGION_ORDER.indexOf("head")
	const neckIndex = REGION_ORDER.indexOf("neck")
	const torsoIndex = REGION_ORDER.indexOf("torso")
	let headTopLocal = -Infinity
	let chinY = Infinity
	let hipHalfW = 0
	let hipHalfD = 0
	let waistHalfW = 0
	let waistHalfD = 0
	let chestHalfW = 0
	let chestHalfD = 0
	const hipYApprox = local("mixamorigHips").y
	const waistYApprox = local("mixamorigSpine").y
	const chestYApprox = local("mixamorigSpine2").y
	for (let v = 0; v < regionOfVertex.length; v++) {
		const region = regionOfVertex[v]
		const x = basePosition[v * 3]
		const y = basePosition[v * 3 + 1]
		const z = basePosition[v * 3 + 2]
		if (region === headIndex || region === neckIndex) {
			if (y > headTopLocal) headTopLocal = y
			if (y < chinY) chinY = y
		}
		if (region === torsoIndex) {
			if (Math.abs(y - hipYApprox) < 0.05) {
				hipHalfW = Math.max(hipHalfW, Math.abs(x))
				hipHalfD = Math.max(hipHalfD, Math.abs(z))
			}
			if (Math.abs(y - waistYApprox) < 0.05) {
				waistHalfW = Math.max(waistHalfW, Math.abs(x))
				waistHalfD = Math.max(waistHalfD, Math.abs(z))
			}
			if (Math.abs(y - chestYApprox) < 0.06) {
				chestHalfW = Math.max(chestHalfW, Math.abs(x))
				chestHalfD = Math.max(chestHalfD, Math.abs(z))
			}
		}
	}
	if (!Number.isFinite(headTopLocal)) headTopLocal = local("mixamorigHead").y + 0.12
	if (!Number.isFinite(chinY)) chinY = local("mixamorigHead").y - 0.1
	if (hipHalfW === 0) hipHalfW = 0.16
	if (hipHalfD === 0) hipHalfD = 0.12
	if (waistHalfW === 0) waistHalfW = 0.14
	if (waistHalfD === 0) waistHalfD = 0.11
	if (chestHalfW === 0) chestHalfW = 0.17
	if (chestHalfD === 0) chestHalfD = 0.11

	const footL = local("mixamorigLeftFoot")
	const footR = local("mixamorigRightFoot")
	const anchors: Anchors = {
		height: headTopLocal - Math.min(footL.y, footR.y),
		headTopLocal,
		chinY,
		shoulderY: local("mixamorigLeftArm").y,
		hipY: hipYApprox,
		kneeY: local("mixamorigLeftLeg").y,
		ankleY: local("mixamorigLeftFoot").y,
		waistY: waistYApprox,
		neckY: local("mixamorigNeck").y,
		shoulderL: local("mixamorigLeftArm"),
		shoulderR: local("mixamorigRightArm"),
		handL: local("mixamorigLeftHand"),
		handR: local("mixamorigRightHand"),
		hipL: local("mixamorigLeftUpLeg"),
		hipR: local("mixamorigRightUpLeg"),
		footL,
		footR,
		hipHalfW,
		hipHalfD,
		waistHalfW,
		waistHalfD,
		chestHalfW,
		chestHalfD,
	}

	const rig: HumanRig = {
		body,
		eyes,
		skeleton,
		bindMatrix: body.bindMatrix.clone(),
		index,
		basePosition,
		baseNormal,
		regionOfVertex,
		regionIds: REGION_ORDER,
		morphs,
		morphNames,
		morphRelative: geo.morphTargetsRelative,
		anchors,
		materials,
		layers: {},
		accessories: new THREE.Group(),
		hipsBaseY: bone("mixamorigHips")?.position.y ?? 1,
		eyeMorphMap,
	}

	buildLayers(rig)
	return rig
}

interface LayerDef {
	id: string
	regions: RegionId[]
	gap: number
	role: ClothRole | "hair"
	falloff: (
		x: number,
		y: number,
		z: number,
		nx: number,
		ny: number,
		nz: number,
		a: Anchors,
	) => number
}

const hemAtHip = (a: Anchors, y: number) => smoothstep(a.hipY - 0.1, a.hipY - 0.03, y)

const necklineAt = (a: Anchors, y: number) =>
	1 - smoothstep(a.shoulderY + 0.01, a.shoulderY + 0.07, y)

const waistlineAt = (a: Anchors, y: number) =>
	1 - smoothstep(a.waistY + 0.03, a.waistY + 0.1, y)

const armAlong = (shoulder: THREE.Vector3, hand: THREE.Vector3) => {
	const dir = hand.clone().sub(shoulder)
	const len = dir.length()
	dir.normalize()
	return (end: number) => (x: number, y: number, z: number) => {
		const t =
			((x - shoulder.x) * dir.x + (y - shoulder.y) * dir.y + (z - shoulder.z) * dir.z) /
			len
		return 1 - smoothstep(end - 0.05, end + 0.02, t)
	}
}

const legAlong = (hip: THREE.Vector3, foot: THREE.Vector3) => {
	const dir = foot.clone().sub(hip)
	const len = dir.length()
	dir.normalize()
	return (x: number, y: number, z: number) => {
		return (
			((x - hip.x) * dir.x + (y - hip.y) * dir.y + (z - hip.z) * dir.z) / len
		)
	}
}

const sleeveLayer = (side: "L" | "R", long: boolean): LayerDef => ({
	id: long ? `sleeveLong${side}` : `sleeveShort${side}`,
	regions: long
		? ([side === "L" ? "upperArmL" : "upperArmR", side === "L" ? "foreArmL" : "foreArmR"] as RegionId[])
		: ([side === "L" ? "upperArmL" : "upperArmR"] as RegionId[]),
	gap: long ? 0.017 : 0.016,
	role: "top",
	falloff: (x, y, z, _nx, _ny, _nz, a) => {
		const shoulder = side === "L" ? a.shoulderL : a.shoulderR
		const hand = side === "L" ? a.handL : a.handR
		return clamp01(armAlong(shoulder, hand)(long ? 0.4 : 0.25)(x, y, z))
	},
})

const legLayer = (side: "L" | "R", shorts: boolean): LayerDef => ({
	id: shorts ? `shorts${side}` : `trouser${side}`,
	regions: shorts
		? ([side === "L" ? "thighL" : "thighR"] as RegionId[])
		: ([
				side === "L" ? "thighL" : "thighR",
				side === "L" ? "shinL" : "shinR",
			] as RegionId[]),
	gap: 0.014,
	role: "bottom",
	falloff: (x, y, z, _nx, _ny, _nz, a) => {
		const hip = side === "L" ? a.hipL : a.hipR
		const foot = side === "L" ? a.footL : a.footR
		const t = legAlong(hip, foot)(x, y, z)
		const tMask = shorts
			? 1 - smoothstep(0.44, 0.56, t)
			: 1 - smoothstep(0.93, 0.985, t)
		return clamp01(waistlineAt(a, y) * tMask)
	},
})

const shoeLayer = (side: "L" | "R"): LayerDef => ({
	id: `shoes${side}`,
	regions: [side === "L" ? "footL" : "footR"],
	gap: 0.016,
	role: "shoe",
	falloff: (_x, y, _z, _nx, _ny, _nz, a) =>
		clamp01(1 - smoothstep(a.ankleY - 0.005, a.ankleY + 0.07, y)),
})

const hairLayer: LayerDef = {
	id: "hair",
	regions: ["head"],
	gap: 0.011,
	role: "hair",
	falloff: (_x, y, _z, _nx, _ny, nz, a) => {
		const headH = Math.max(a.headTopLocal - a.chinY, 0.18)
		const eyesY = a.chinY + headH * 0.52
		const front = smoothstep(eyesY + headH * 0.2, eyesY + headH * 0.32, y)
		const back =
			smoothstep(0.45, 0.85, -nz) *
			smoothstep(eyesY - headH * 0.24, eyesY - headH * 0.1, y)
		const sides =
			(1 - smoothstep(0.35, 0.85, Math.abs(nz))) *
			smoothstep(eyesY + headH * 0.26, eyesY + headH * 0.36, y)
		return clamp01(Math.max(front, Math.max(back, sides)))
	},
}

const LAYER_DEFS: LayerDef[] = [
	{
		id: "teeTorso",
		regions: ["torso"],
		gap: 0.016,
		role: "top",
		falloff: (_x, y, _z, _nx, _ny, _nz, a) => clamp01(hemAtHip(a, y) * necklineAt(a, y)),
	},
	{
		id: "hoodieTorso",
		regions: ["torso", "neck"],
		gap: 0.024,
		role: "top",
		falloff: (_x, y, _z, _nx, _ny, _nz, a) =>
			clamp01(
				smoothstep(a.hipY - 0.18, a.hipY - 0.06, y) *
					(1 - smoothstep(a.neckY + 0.05, a.neckY + 0.11, y)),
			),
	},
	sleeveLayer("L", false),
	sleeveLayer("R", false),
	sleeveLayer("L", true),
	sleeveLayer("R", true),
	legLayer("L", true),
	legLayer("R", true),
	legLayer("L", false),
	legLayer("R", false),
	shoeLayer("L"),
	shoeLayer("R"),
	hairLayer,
]

function dropSmallComponents(indices: number[], minTris: number): number[] {
	const local = new Map<number, number>()
	const remap = (v: number) => {
		let i = local.get(v)
		if (i === undefined) {
			i = local.size
			local.set(v, i)
		}
		return i
	}
	const tri = new Int32Array(indices.length)
	for (let i = 0; i < indices.length; i++) tri[i] = remap(indices[i])
	const parent = new Int32Array(local.size)
	for (let i = 0; i < parent.length; i++) parent[i] = i
	const find = (a: number) => {
		let root = a
		while (parent[root] !== root) root = parent[root]
		while (parent[a] !== root) {
			const next = parent[a]
			parent[a] = root
			a = next
		}
		return root
	}
	for (let t = 0; t < tri.length; t += 3) {
		const r0 = find(tri[t])
		const r1 = find(tri[t + 1])
		const r2 = find(tri[t + 2])
		if (r1 !== r0) parent[r1] = r0
		if (r2 !== r0) parent[r2] = r0
	}
	const counts = new Map<number, number>()
	for (let t = 0; t < tri.length; t += 3) {
		const root = find(tri[t])
		counts.set(root, (counts.get(root) ?? 0) + 1)
	}
	const out: number[] = []
	for (let t = 0; t < tri.length; t += 3) {
		if ((counts.get(find(tri[t])) ?? 0) >= minTris) {
			out.push(indices[t], indices[t + 1], indices[t + 2])
		}
	}
	return out
}

function shellFromDef(rig: HumanRig, def: LayerDef): THREE.SkinnedMesh | null {
	const count = rig.basePosition.length / 3
	const raw = new Float32Array(count)
	const regionIndexes = def.regions.map((r) => rig.regionIds.indexOf(r))
	for (let v = 0; v < count; v++) {
		if (!regionIndexes.includes(rig.regionOfVertex[v])) continue
		const x = rig.basePosition[v * 3]
		const y = rig.basePosition[v * 3 + 1]
		const z = rig.basePosition[v * 3 + 2]
		const nx = rig.baseNormal[v * 3]
		const ny = rig.baseNormal[v * 3 + 1]
		const nz = rig.baseNormal[v * 3 + 2]
		raw[v] = clamp01(def.falloff(x, y, z, nx, ny, nz, rig.anchors))
	}
	const mask = new Float32Array(count)
	const sum = new Float32Array(count + 1)
	const weight = new Float32Array(count + 1)
	for (let iteration = 0; iteration < 3; iteration++) {
		sum.fill(0)
		weight.fill(0)
		for (let t = 0; t < rig.index.length; t += 3) {
			for (let k = 0; k < 3; k++) {
				const a = rig.index[t + k]
				const b = rig.index[t + ((k + 1) % 3)]
				const c = rig.index[t + ((k + 2) % 3)]
				sum[a] += raw[a] + raw[b] * 0.5 + raw[c] * 0.5
				weight[a] += 2
			}
		}
		for (let v = 0; v < count; v++) {
			mask[v] = weight[v] > 0 ? sum[v] / weight[v] : raw[v]
		}
		raw.set(mask)
	}
	const positions = new Float32Array(rig.basePosition)
	for (let v = 0; v < count; v++) {
		const f = mask[v]
		if (f <= 0.22) continue
		const offset = def.gap * f + 0.0015
		positions[v * 3] = rig.basePosition[v * 3] + rig.baseNormal[v * 3] * offset
		positions[v * 3 + 1] = rig.basePosition[v * 3 + 1] + rig.baseNormal[v * 3 + 1] * offset
		positions[v * 3 + 2] = rig.basePosition[v * 3 + 2] + rig.baseNormal[v * 3 + 2] * offset
	}
	const indices: number[] = []
	for (let t = 0; t < rig.index.length; t += 3) {
		const a = rig.index[t]
		const b = rig.index[t + 1]
		const c = rig.index[t + 2]
		if (mask[a] > 0.22 && mask[b] > 0.22 && mask[c] > 0.22) indices.push(a, b, c)
	}
	if (indices.length < 12) return null
	const filtered = dropSmallComponents(indices, 80)
	if (filtered.length < 12) return null

	const geo = new THREE.BufferGeometry()
	geo.setAttribute("position", new THREE.BufferAttribute(positions, 3))
	geo.setAttribute("normal", new THREE.BufferAttribute(rig.baseNormal.slice(), 3))
	geo.setAttribute(
		"skinIndex",
		new THREE.BufferAttribute(rig.body.geometry.attributes.skinIndex.array.slice(), 4),
	)
	geo.setAttribute(
		"skinWeight",
		new THREE.BufferAttribute(rig.body.geometry.attributes.skinWeight.array.slice(), 4),
	)
	geo.setIndex(indices)
	geo.morphTargetsRelative = rig.morphRelative
	geo.morphAttributes.position = rig.morphNames.map(
		(name) => new THREE.BufferAttribute(rig.morphs[name], 3),
	)
	const material = def.role === "hair" ? rig.materials.hair : rig.materials.cloth[def.role]
	const mesh = new THREE.SkinnedMesh(geo, material)
	mesh.name = def.id
	mesh.castShadow = true
	mesh.receiveShadow = true
	mesh.frustumCulled = false
	mesh.bind(rig.skeleton, rig.bindMatrix)
	mesh.morphTargetInfluences = new Array(rig.morphNames.length).fill(0)
	mesh.morphTargetDictionary = Object.fromEntries(rig.morphNames.map((n, i) => [n, i]))
	mesh.visible = false
	return mesh
}

function buildLayers(rig: HumanRig) {
	const parent = rig.body.parent ?? rig.body
	for (const def of LAYER_DEFS) {
		const mesh = shellFromDef(rig, def)
		if (!mesh) continue
		parent.add(mesh)
		rig.layers[def.id] = mesh
	}
	parent.add(rig.accessories)
}

export function morphWeights(rig: HumanRig, params: BodyParams): Float32Array {
	const w = params.weight
	const b = params.build
	const f = params.frame
	const female = params.sex === "female"
	const t = (params.height - 175) / 25

	const weights: Partial<Record<UsedMorph, number>> = {
		bodyFeminine: female ? 1 : 0,
		bodyMasculine: female ? 0 : 1,
		bodyHeavier: w > 0.5 ? (w - 0.5) * 2 : 0,
		bodyThinner: w < 0.5 ? (0.5 - w) * 1.7 : 0,
		bellyBigger: female ? w * 0.3 : w * 0.45,
		gluteusBigger: female ? 0.4 + w * 0.35 : w * 0.25,
		bodyMuscular: b * (female ? 0.75 : 1),
		bodySofter: (1 - b) * 0.4,
		chestPectorals: b * 0.55,
		armsMuscular: b * 0.65,
		shouldersWider: f > 0 ? f : 0,
		shouldersNarrower: f < 0 ? -f : 0,
		chestWider: f > 0 ? f * 0.7 : 0,
		chestNarrower: f < 0 ? -f * 0.7 : 0,
		torsoLatsWider: f > 0 ? f * 0.45 : 0,
		waistNarrower: female ? 0.45 + w * 0.2 : 0.15,
		hipsWider: female ? 0.35 + w * 0.35 : 0,
		hipsNarrower: !female && f > 0.3 ? (f - 0.3) * 0.5 : 0,
		thighsThicker: w > 0.55 ? (w - 0.55) * 1.1 : 0,
		thighsThinner: w < 0.4 ? (0.4 - w) * 0.7 : 0,
		bustBigger: female ? 0.35 + w * 0.45 : 0,
		bustSmaller: 0,
		heightTaller: t > 0 ? t : 0,
		heightShorter: t < 0 ? -t : 0,
		jawWider: female ? 0 : b * 0.25,
		jawNarrower: female ? 0.35 : 0,
	}

	const out = new Float32Array(rig.morphNames.length)
	rig.morphNames.forEach((name, i) => {
		out[i] = weights[name as UsedMorph] ?? 0
	})
	return out
}

export function setOutfitLayers(rig: HumanRig, outfit: Outfit) {
	const g = outfit.garments
	const top = g.top
	const bottom = g.bottom
	const on = (id: string, visible: boolean) => {
		const layer = rig.layers[id]
		if (layer) layer.visible = visible
	}
	on("teeTorso", top === "short" || top === "tank")
	on("hoodieTorso", top === "long")
	const sleevesShort = (top === "short" || top === "tank") && !g.dress
	on("sleeveShortL", sleevesShort)
	on("sleeveShortR", sleevesShort)
	on("sleeveLongL", top === "long")
	on("sleeveLongR", top === "long")
	on("shortsL", bottom === "shorts")
	on("shortsR", bottom === "shorts")
	on("trouserL", bottom === "trousers")
	on("trouserR", bottom === "trousers")
	const shoes = g.shoes !== "none"
	on("shoesL", shoes)
	on("shoesR", shoes)
	on("hair", true)
	buildAccessories(rig, outfit)
}

export function applyTone(rig: HumanRig, skinHex: string, colorway: Colorway) {
	rig.materials.skin.color.set(skinHex)
	rig.materials.cloth.top.color.set(colorway.top)
	rig.materials.cloth.bottom.color.set(colorway.bottom)
	rig.materials.cloth.accent.color.set(colorway.accent)
	rig.materials.cloth.shoe.color.set(colorway.shoe)
	rig.materials.skirt.color.set(colorway.bottom)
}

export function buildAccessories(rig: HumanRig, outfit: Outfit) {
	const group = rig.accessories
	group.clear()
	const g = outfit.garments
	const a = rig.anchors
	const h = a.height

	const add = (mesh: THREE.Mesh, role: ClothRole) => {
		mesh.castShadow = true
		mesh.material = rig.materials.cloth[role]
		group.add(mesh)
	}

	if (g.hood) {
		const hood = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 18), rig.materials.cloth.top)
		hood.scale.set(a.chestHalfW * 0.62, 0.055, a.chestHalfD * 0.5)
		hood.position.set(0, a.neckY - 0.02, -a.chestHalfD * 0.75)
		add(hood, "top")
	}

	if (g.lapel) {
		const collar = new THREE.Mesh(new THREE.TorusGeometry(1, 0.32, 10, 28), rig.materials.cloth.accent)
		collar.rotation.x = Math.PI / 2
		collar.scale.set(0.072, 0.072, 0.05)
		collar.position.set(0, a.neckY - 0.012, -0.005)
		add(collar, "accent")
		for (const sx of [-1, 1]) {
			const lapel = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), rig.materials.cloth.accent)
			lapel.scale.set(0.032, 0.15 * h, 0.016)
			lapel.position.set(sx * 0.07, a.shoulderY - 0.085 * h, a.chestHalfD * 0.82)
			lapel.rotation.z = sx * 0.26
			add(lapel, "accent")
		}
	}

	if (g.buttons) {
		for (let i = 0; i < 3; i++) {
			const button = new THREE.Mesh(new THREE.SphereGeometry(1, 12, 10), rig.materials.cloth.accent)
			const r = 0.01
			button.scale.set(r, r, r)
			button.position.set(
				0,
				a.shoulderY - (0.1 + i * 0.065) * h,
				a.chestHalfD * (0.94 - i * 0.14) + 0.02,
			)
			add(button, "accent")
		}
	}

	if (g.skirt || g.dress) {
		const hemY = a.kneeY + (g.dress ? 0.02 : 0.07) * h
		const topY = a.hipY + 0.05 * h
		const topR = a.waistHalfW + 0.008
		const flare = g.dress ? 1.45 : 1.22
		const skirt = new THREE.Mesh(
			new THREE.CylinderGeometry(topR, topR * flare, topY - hemY, 48, 1, true),
			rig.materials.skirt,
		)
		skirt.position.set(0, (topY + hemY) / 2, 0)
		skirt.scale.z = (a.waistHalfD + 0.01) / topR
		skirt.castShadow = true
		group.add(skirt)
		const band = new THREE.Mesh(
			new THREE.CylinderGeometry(1, 1, 1, 40, 1, true),
			rig.materials.skirt,
		)
		band.scale.set(a.waistHalfW + 0.01, (topY - (a.hipY - 0.06)) * 1.04, a.waistHalfD + 0.01)
		band.position.set(0, (topY + a.hipY - 0.06) / 2, 0)
		band.castShadow = true
		group.add(band)
	}
}

export function applyIdle(rig: HumanRig, t: number) {
	const bones = rig.skeleton.bones
	const get = (name: string) => bones.find((b) => b.name === name)
	const spine1 = get("mixamorigSpine1")
	const head = get("mixamorigHead")
	const hips = get("mixamorigHips")
	const e = 0.004 * Math.sin(t * 1.5)
	if (spine1) {
		spine1.scale.set(1 + e * 0.6, 1 + e * 0.3, 1 + e)
	}
	if (head) {
		head.rotation.z = 0.02 * Math.sin(t * 0.45)
		head.rotation.y = 0.03 * Math.sin(t * 0.3)
	}
	if (hips) {
		hips.rotation.y = 0.02 * Math.sin(t * 0.35)
		hips.position.y = rig.hipsBaseY + 0.0015 * Math.sin(t * 1.5)
	}
}

export type { RegionId, UsedMorph }
