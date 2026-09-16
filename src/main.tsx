import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import "./index.css"
import App from "./App"
import { useOutfitStore } from "./state/store"

if (import.meta.env.DEV) {
	;(window as unknown as { __store?: unknown }).__store = useOutfitStore
}

createRoot(document.getElementById("root")!).render(
	<StrictMode>
		<App />
	</StrictMode>,
)
