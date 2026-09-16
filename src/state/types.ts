export type Sex = "male" | "female"

export type StepId =
  | "welcome"
  | "sex"
  | "height"
  | "weight"
  | "build"
  | "frame"
  | "skin"
  | "outfit"
  | "result"

export type SkinToneId =
  | "porcelain"
  | "sand"
  | "honey"
  | "clay"
  | "umber"
  | "graphite"

export interface BodyParams {
  sex: Sex
  height: number
  weight: number
  build: number
  frame: number
  skin: SkinToneId
}

export interface SkinTone {
  id: SkinToneId
  name: string
  hex: string
}

export interface Colorway {
  id: string
  name: string
  top: string
  bottom: string
  accent: string
  shoe: string
}

export interface GarmentSpec {
  top: "none" | "short" | "long" | "tank"
  bottom: "none" | "shorts" | "trousers"
  dress: boolean
  skirt: boolean
  hood: boolean
  lapel: boolean
  buttons: boolean
  pocket: boolean
  belt: boolean
  shoes: "none" | "sneakers" | "dress" | "boots"
}

export interface Outfit {
  id: string
  name: string
  tagline: string
  sexes: "all" | Sex[]
  garments: GarmentSpec
  colorways: Colorway[]
}
