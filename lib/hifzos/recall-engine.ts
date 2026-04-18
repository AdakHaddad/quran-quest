import type { AyahSeed } from "@/lib/hifzos/ayah-catalog"

export interface BlankRecallPrompt {
  ayahTextWithBlank: string
  expectedWord: string
}

const normalizeArabic = (text: string): string =>
  text
    .replace(/[\u064B-\u065F\u0670]/g, "")
    .replace(/[\u06D6-\u06ED]/g, "")
    .replace(/[ـ]/g, "")
    .trim()

export const createBlankRecallPrompt = (ayah: AyahSeed): BlankRecallPrompt => {
  const words = ayah.text.split(" ").filter(Boolean)
  const blankIndex = words.length > 2 ? 1 : 0
  const expectedWord = words[blankIndex] ?? words[0] ?? ""
  const withBlank = [...words]
  withBlank[blankIndex] = "_____"

  return {
    ayahTextWithBlank: withBlank.join(" "),
    expectedWord,
  }
}

export const isRecallAnswerCorrect = (answer: string, expected: string): boolean => {
  return normalizeArabic(answer) === normalizeArabic(expected)
}
