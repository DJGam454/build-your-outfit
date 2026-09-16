import type {
	BodyParams,
	GarmentSpec,
	Outfit,
	Sex,
	SkinTone,
	SkinToneId,
} from "./types"

export const SKIN_TONES: SkinTone[] = [
	{ id: "porcelain", name: "Porcelain", hex: "#ecd9cd" },
	{ id: "sand", name: "Sand", hex: "#dfc0a2" },
	{ id: "honey", name: "Honey", hex: "#c69a70" },
	{ id: "clay", name: "Clay", hex: "#a46e48" },
	{ id: "umber", name: "Umber", hex: "#7a4d31" },
	{ id: "graphite", name: "Graphite", hex: "#57524c" },
]

const BARE: GarmentSpec = {
	top: "none",
	bottom: "none",
	dress: false,
	skirt: false,
	hood: false,
	lapel: false,
	buttons: false,
	pocket: false,
	belt: false,
	shoes: "none",
}

const spec = (patch: Partial<GarmentSpec>): GarmentSpec => ({ ...BARE, ...patch })

export const OUTFITS: Outfit[] = [
	{
		id: "none",
		name: "Nothing at all",
		tagline: "The original. You, as built.",
		sexes: "all",
		garments: spec({}),
		colorways: [
			{
				id: "natural",
				name: "Natural",
				top: "#e7e0d2",
				bottom: "#e7e0d2",
				accent: "#b4542c",
				shoe: "#e7e0d2",
			},
		],
	},
	{
		id: "tee",
		name: "Everyday tee",
		tagline: "A soft crew neck and easy shorts.",
		sexes: "all",
		garments: spec({ top: "short", bottom: "shorts", shoes: "sneakers" }),
		colorways: [
			{
				id: "ecru",
				name: "Ecru",
				top: "#e7e0d2",
				bottom: "#4e5248",
				accent: "#b4542c",
				shoe: "#f4f2ec",
			},
			{
				id: "midnight",
				name: "Midnight",
				top: "#2e3440",
				bottom: "#c9c3b6",
				accent: "#e2ddd2",
				shoe: "#f4f2ec",
			},
			{
				id: "terracotta",
				name: "Terracotta",
				top: "#b4542c",
				bottom: "#efe9dd",
				accent: "#2e3440",
				shoe: "#f4f2ec",
			},
		],
	},
	{
		id: "hoodie",
		name: "Weekend hoodie",
		tagline: "Heavy fleece, easy joggers.",
		sexes: "all",
		garments: spec({
			top: "long",
			bottom: "trousers",
			hood: true,
			pocket: true,
			shoes: "sneakers",
		}),
		colorways: [
			{
				id: "oat",
				name: "Oat",
				top: "#d9d2c2",
				bottom: "#54514a",
				accent: "#8a8f76",
				shoe: "#efe9dd",
			},
			{
				id: "forest",
				name: "Forest",
				top: "#42554a",
				bottom: "#2e3330",
				accent: "#c9c3b6",
				shoe: "#efe9dd",
			},
		],
	},
	{
		id: "tailored",
		name: "The tailored line",
		tagline: "A soft-shouldered jacket, pressed trousers.",
		sexes: "all",
		garments: spec({
			top: "long",
			bottom: "trousers",
			lapel: true,
			buttons: true,
			belt: true,
			shoes: "dress",
		}),
		colorways: [
			{
				id: "charcoal",
				name: "Charcoal",
				top: "#34363c",
				bottom: "#3d3f45",
				accent: "#f4f1ea",
				shoe: "#26262a",
			},
			{
				id: "camel",
				name: "Camel",
				top: "#a98f6b",
				bottom: "#4e4a44",
				accent: "#f4f1ea",
				shoe: "#3a342e",
			},
		],
	},
	{
		id: "denim",
		name: "Denim on denim",
		tagline: "Trucker jacket, straight jeans, boots.",
		sexes: "all",
		garments: spec({
			top: "long",
			bottom: "trousers",
			lapel: true,
			buttons: true,
			pocket: true,
			belt: true,
			shoes: "boots",
		}),
		colorways: [
			{
				id: "indigo",
				name: "Indigo",
				top: "#3a4a63",
				bottom: "#2f3b52",
				accent: "#e2ddd2",
				shoe: "#7a4e33",
			},
			{
				id: "washed",
				name: "Washed black",
				top: "#2b2c30",
				bottom: "#232427",
				accent: "#c9c3b6",
				shoe: "#232427",
			},
		],
	},
	{
		id: "sundress",
		name: "Sun dress",
		tagline: "One piece, a long afternoon.",
		sexes: ["female"],
		garments: spec({ top: "tank", dress: true, shoes: "dress" }),
		colorways: [
			{
				id: "terracotta",
				name: "Terracotta",
				top: "#b4542c",
				bottom: "#b4542c",
				accent: "#efe9dd",
				shoe: "#8a6a4f",
			},
			{
				id: "sage",
				name: "Sage",
				top: "#7c8b7a",
				bottom: "#7c8b7a",
				accent: "#f4f1ea",
				shoe: "#6f6a61",
			},
			{
				id: "ink",
				name: "Ink",
				top: "#2e3440",
				bottom: "#2e3440",
				accent: "#b4542c",
				shoe: "#26262a",
			},
		],
	},
	{
		id: "skirt-set",
		name: "Skirt set",
		tagline: "A knit top, a gentle flare.",
		sexes: ["female"],
		garments: spec({
			top: "short",
			skirt: true,
			shoes: "sneakers",
		}),
		colorways: [
			{
				id: "ink",
				name: "Ink",
				top: "#2b2c30",
				bottom: "#e9e3d5",
				accent: "#b4542c",
				shoe: "#f4f2ec",
			},
			{
				id: "blush",
				name: "Blush",
				top: "#c79a8a",
				bottom: "#6e5f55",
				accent: "#f4f1ea",
				shoe: "#efe9dd",
			},
		],
	},
]

export const outfitForSex = (sex: Sex) =>
	OUTFITS.filter((o) => o.sexes === "all" || o.sexes.includes(sex))

export const outfitById = (id: string) =>
	OUTFITS.find((o) => o.id === id) ?? OUTFITS[0]

export const skinToneById = (id: SkinToneId) =>
	SKIN_TONES.find((t) => t.id === id) ?? SKIN_TONES[1]

export const sexLabel = (sex: Sex) => (sex === "male" ? "Male" : "Female")

export const weightLabel = (w: number) =>
	w < 0.35 ? "Slim" : w < 0.62 ? "Balanced" : w < 0.85 ? "Solid" : "Full"

export const buildLabel = (b: number) =>
	b < 0.3 ? "Lean" : b < 0.6 ? "Athletic" : b < 0.82 ? "Trained" : "Sculpted"

export const frameLabel = (f: number) =>
	f < -0.35 ? "Slim" : f < 0.35 ? "Classic" : "Broad"

export interface Preset {
	label: string
	hint: string
	value: number
}

export const HEIGHT_PRESETS: Preset[] = [
	{ label: "Petite", hint: "158 cm, a soft light frame", value: 158 },
	{ label: "Average", hint: "172 cm, the everyday middle", value: 172 },
	{ label: "Tall", hint: "181 cm, a long clean line", value: 181 },
	{ label: "Statement", hint: "190 cm, editorial height", value: 190 },
]

export const WEIGHT_PRESETS: Preset[] = [
	{ label: "Slim", hint: "A lean fall of cloth", value: 0.22 },
	{ label: "Balanced", hint: "Classic and grounded", value: 0.5 },
	{ label: "Solid", hint: "More weight to drape", value: 0.74 },
	{ label: "Full", hint: "Generous volume", value: 0.95 },
]

export const BUILD_PRESETS: Preset[] = [
	{ label: "Lean", hint: "Quiet lines, easy angles", value: 0.15 },
	{ label: "Athletic", hint: "Balanced muscle, natural ease", value: 0.45 },
	{ label: "Trained", hint: "Defined shoulders and arms", value: 0.72 },
	{ label: "Sculpted", hint: "Strong through and through", value: 0.95 },
]

export const FRAME_PRESETS: Preset[] = [
	{ label: "Slim", hint: "Narrow shoulder, fine stance", value: -0.7 },
	{ label: "Classic", hint: "The balanced line", value: 0 },
	{ label: "Broad", hint: "Wide shoulder, easy presence", value: 0.7 },
]

export const DEFAULT_PARAMS: BodyParams = {
	sex: "male",
	height: 172,
	weight: 0.5,
	build: 0.45,
	frame: 0,
	skin: "sand",
}
