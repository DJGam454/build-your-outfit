import { expect, test, type Page } from "@playwright/test"

type Store = {
	getState: () => {
		step: string
		params: { sex: string; height: number; skin: string }
		outfitId: string
		tourStep: number | null
		cameraDirty: boolean
	}
}

const store = (page: Page) =>
	page.evaluate(() => (window as unknown as { __store?: Store }).__store !== undefined)

async function gotoFresh(page: Page) {
	await page.goto("/")
	await expect(page.getByRole("heading", { level: 1 })).toBeVisible()
	await expect
		.poll(() => store(page), { timeout: 30_000 })
		.toBe(true)
}

async function skipTour(page: Page) {
	const tourTitle = page.getByRole("heading", { name: "The fitting room" })
	await expect(tourTitle).toBeVisible({ timeout: 15_000 })
	await page.keyboard.press("Escape")
	await expect(tourTitle).toBeHidden()
}

const panel = (page: Page) => page.locator('section[data-tour="panel"]')

async function walkToOutfit(page: Page) {
	const view = panel(page)
	await view.getByRole("button", { name: /begin the fitting/i }).click()
	await view.getByRole("button", { name: /^female/i }).click()
	await expect(page.getByText("Step 02")).toBeVisible()
	await view.getByRole("button", { name: /^tall/i }).click()
	await expect(page.getByText("Step 03")).toBeVisible()
	await view.getByRole("button", { name: /^balanced/i }).click()
	await expect(page.getByText("Step 04")).toBeVisible()
	await view.getByRole("button", { name: /^athletic/i }).click()
	await expect(page.getByText("Step 05")).toBeVisible()
	await view.getByRole("button", { name: /^classic/i }).click()
	await expect(page.getByText("Step 06")).toBeVisible()
	await view.getByRole("button", { name: "Clay" }).click()
	await view.getByRole("button", { name: /^continue/i }).click()
	await expect(page.getByText("Step 07")).toBeVisible()
}

test.describe("onboarding", () => {
	test("the tour explains the room on first visit and stays dismissed", async ({
		page,
	}) => {
		await gotoFresh(page)
		const title = page.getByRole("heading", { name: "The fitting room" })
		await expect(title).toBeVisible({ timeout: 15_000 })
		await expect(page.getByText(/tour · 1 \/ 8/i)).toBeVisible()
		await page.getByRole("button", { name: "Next" }).click()
		await expect(
			page.getByRole("heading", { name: "Move in, move around" }),
		).toBeVisible()
		await page.getByRole("button", { name: "Skip" }).click()
		await expect(title).toBeHidden()
		const seen = await page.evaluate(() =>
			window.localStorage.getItem("forme.tour.v1"),
		)
		expect(seen).toBe("1")
		await page.reload()
		await expect(page.getByRole("heading", { level: 1 })).toBeVisible()
		await expect(title).toBeHidden()
	})

	test("the guide button reopens the tour", async ({ page }) => {
		await gotoFresh(page)
		await skipTour(page)
		await page.getByRole("button", { name: "Guide" }).click()
		await expect(
			page.getByRole("heading", { name: "The fitting room" }),
		).toBeVisible()
	})
})

test.describe("selection flow", () => {
	test("a whole look can be built and summarized", async ({ page }) => {
		await gotoFresh(page)
		await skipTour(page)
		await walkToOutfit(page)

		const view = panel(page)
		await view.getByRole("button", { name: /weekend hoodie/i }).click()
		await view.getByRole("button", { name: "Forest" }).click()
		await view.getByRole("button", { name: /^continue/i }).click()

		await expect(page.getByRole("heading", { name: "This is you." })).toBeVisible()
		const summary = page.locator("dl")
		await expect(summary).toContainText("Female")
		await expect(summary).toContainText("181 cm")
		await expect(summary).toContainText("Clay")
		await expect(summary).toContainText("Weekend hoodie · Forest")

		const state = await page.evaluate(
			() =>
				(
					window as unknown as { __store: { getState: () => unknown } }
				).__store.getState() as { outfitId: string },
		)
		expect(state.outfitId).toBe("hoodie")
	})

	test("defaults let a visitor press straight through", async ({ page }) => {
		await gotoFresh(page)
		await skipTour(page)
		const view = panel(page)
		await view.getByRole("button", { name: /begin the fitting/i }).click()
		await view.getByRole("button", { name: /^male/i }).click()

		await view.getByRole("button", { name: /use the average/i }).click()
		await expect(page.getByText("Step 03")).toBeVisible()
		await view.getByRole("button", { name: /keep it balanced/i }).click()
		await expect(page.getByText("Step 04")).toBeVisible()
		await view.getByRole("button", { name: /skip - keep it as is/i }).click()
		await expect(page.getByText("Step 05")).toBeVisible()
		await view.getByRole("button", { name: /skip - keep it classic/i }).click()
		await expect(page.getByText("Step 06")).toBeVisible()
		await view.getByRole("button", { name: /keep sand/i }).click()
		await expect(page.getByText("Step 07")).toBeVisible()
		await view.getByRole("button", { name: /wear nothing at all/i }).click()
		await expect(page.getByRole("heading", { name: "This is you." })).toBeVisible()
		await expect(page.locator("dl")).toContainText("Nothing at all")
	})

	test("choices can be revisited from the summary rail", async ({ page }) => {
		await gotoFresh(page)
		await skipTour(page)
		await walkToOutfit(page)
		await page
			.locator('footer[data-tour="summary"]')
			.getByRole("button", { name: "181 cm" })
			.click()
		await expect(page.getByText("Step 02")).toBeVisible()
		await expect(page.getByText("181 cm", { exact: true }).first()).toBeVisible()
	})
})

test.describe("the stage", () => {
	test("dragging the model offers a reset, and reset clears it", async ({
		page,
	}) => {
		await gotoFresh(page)
		await skipTour(page)
		const stage = page.locator("main.stage")
		const box = await stage.boundingBox()
		expect(box).not.toBeNull()
		if (!box) return
		const cx = box.x + box.width / 2
		const cy = box.y + box.height / 2
		await page.mouse.move(cx, cy)
		await page.mouse.down()
		await page.mouse.move(cx - 220, cy + 40, { steps: 12 })
		await page.mouse.up()

		const reset = page.getByRole("button", { name: /reset view/i })
		await expect(reset).toBeVisible()
		await reset.click()
		await expect(reset).toBeHidden()
	})

	test("the look can be downloaded as an image", async ({ page }) => {
		await gotoFresh(page)
		await skipTour(page)
		const view = panel(page)
		await view.getByRole("button", { name: /begin the fitting/i }).click()
		await view.getByRole("button", { name: /^female/i }).click()
		await expect(page.getByText("Step 02")).toBeVisible()
		await view.getByRole("button", { name: /use the average/i }).click()
		await view.getByRole("button", { name: /keep it balanced/i }).click()
		await view.getByRole("button", { name: /skip - keep it as is/i }).click()
		await view.getByRole("button", { name: /skip - keep it classic/i }).click()
		await view.getByRole("button", { name: /keep sand/i }).click()
		await view.getByRole("button", { name: /wear nothing at all/i }).click()
		await expect(page.getByRole("heading", { name: "This is you." })).toBeVisible()

		const downloadPromise = page.waitForEvent("download")
		await view.getByRole("button", { name: /download the look/i }).click()
		const download = await downloadPromise
		expect(download.suggestedFilename()).toBe("forme-look.png")
	})
})
