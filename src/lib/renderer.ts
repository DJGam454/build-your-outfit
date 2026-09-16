import type * as THREE from "three"

let renderer: THREE.WebGLRenderer | null = null

export const setRenderer = (gl: THREE.WebGLRenderer) => {
	renderer = gl
}

export const getRenderer = () => renderer
