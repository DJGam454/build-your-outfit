import { Suspense } from "react"
import { Canvas } from "@react-three/fiber"
import { ContactShadows, Environment, Lightformer } from "@react-three/drei"
import { Human } from "./Human"
import { CameraDirector } from "./CameraDirector"
import { setRenderer } from "../../lib/renderer"
import { useOutfitStore } from "../../state/store"

function Ground({ H }: { H: number }) {
	const radius = Math.max(2.6, H * 1.8)
	return (
		<>
			<mesh rotation-x={-Math.PI / 2} position-y={-0.002} receiveShadow>
				<circleGeometry args={[240, 64]} />
				<meshStandardMaterial color="#ebe8e1" roughness={1} metalness={0} />
			</mesh>
			<ContactShadows
				position-y={0.002}
				scale={radius * 1.35}
				opacity={0.5}
				blur={2.6}
				far={H * 0.85}
				resolution={512}
				color="#4a4238"
			/>
		</>
	)
}

export function Scene() {
	const height = useOutfitStore((s) => s.params.height)
	return (
		<Canvas
			shadows
			dpr={[1, 2]}
			gl={{ antialias: true, preserveDrawingBuffer: true }}
			camera={{ fov: 32, position: [1.6, 1.7, 6.6], near: 0.1, far: 60 }}
			onCreated={({ gl, scene }) => {
				setRenderer(gl)
				if (import.meta.env.DEV) {
					;(window as unknown as { __scene?: unknown }).__scene = scene
				}
			}}
		>
			<color attach="background" args={["#f2f0ea"]} />
			<ambientLight intensity={0.45} />
			<directionalLight
				castShadow
				position={[2.6, 4.4, 2.2]}
				intensity={1.9}
				color="#fff6ea"
				shadow-mapSize={[2048, 2048]}
				shadow-bias={-0.00025}
				shadow-camera-left={-3.4}
				shadow-camera-right={3.4}
				shadow-camera-top={3.4}
				shadow-camera-bottom={-3.4}
				shadow-camera-near={0.5}
				shadow-camera-far={14}
			/>
			<directionalLight position={[-3.4, 2.6, -1.8]} intensity={0.65} color="#e3e9f4" />
			<directionalLight position={[0, 3.6, -4.2]} intensity={0.85} color="#ffffff" />
			<Suspense fallback={null}>
				<Environment resolution={256} frames={1} environmentIntensity={0.5}>
					<Lightformer intensity={2.2} position={[0, 5, -3]} scale={[8, 6, 1]} />
					<Lightformer
						intensity={1.1}
						position={[-5, 2.5, 2]}
						scale={[4, 8, 1]}
						rotation-y={Math.PI / 2}
					/>
					<Lightformer
						intensity={1.1}
						position={[5, 2.5, 2]}
						scale={[4, 8, 1]}
						rotation-y={-Math.PI / 2}
					/>
					<Lightformer
						intensity={1.4}
						position={[0, 4, 5]}
						scale={[8, 4, 1]}
						rotation-y={Math.PI}
					/>
				</Environment>
				<Ground H={height / 100} />
				<Human />
			</Suspense>
			<CameraDirector />
		</Canvas>
	)
}
