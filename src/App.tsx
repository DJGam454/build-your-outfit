import { Flow } from "./components/Flow"
import { Header, Progress, StageOverlays, SummaryRail } from "./components/HUD"
import { Scene } from "./components/scene/Scene"
import { Tour } from "./components/Tour"

export default function App() {
	return (
		<div className="flex h-dvh w-full flex-col-reverse overflow-hidden bg-paper text-ink lg:flex-row">
			<aside className="relative z-10 flex min-h-0 w-full flex-1 flex-col bg-paper lg:h-full lg:w-[440px] lg:flex-none lg:border-r lg:border-line">
				<Header />
				<Progress />
				<section data-tour="panel" className="min-h-0 flex-1 px-6 pt-5 lg:px-8">
					<Flow />
				</section>
				<SummaryRail />
			</aside>
			<main
				data-tour="stage"
				className="stage relative h-[42dvh] flex-none lg:h-full lg:flex-1"
			>
				<Scene />
				<StageOverlays />
			</main>
			<Tour />
		</div>
	)
}
