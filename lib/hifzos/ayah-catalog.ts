import type { AyahReference } from "@/lib/hifzos/types"

export interface AyahSeed {
  ref: AyahReference
  text: string
  translation: string
}

export const AYAH_CATALOG: AyahSeed[] = [
  {
    ref: { surahNumber: 1, ayahNumber: 1 },
    text: "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ",
    translation: "In the name of Allah, the Entirely Merciful, the Especially Merciful.",
  },
  {
    ref: { surahNumber: 1, ayahNumber: 2 },
    text: "الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ",
    translation: "All praise is due to Allah, Lord of the worlds.",
  },
  {
    ref: { surahNumber: 1, ayahNumber: 3 },
    text: "الرَّحْمَٰنِ الرَّحِيمِ",
    translation: "The Entirely Merciful, the Especially Merciful.",
  },
  {
    ref: { surahNumber: 1, ayahNumber: 4 },
    text: "مَالِكِ يَوْمِ الدِّينِ",
    translation: "Sovereign of the Day of Recompense.",
  },
  {
    ref: { surahNumber: 92, ayahNumber: 1 },
    text: "وَاللَّيْلِ إِذَا يَغْشَىٰ",
    translation: "By the night when it covers.",
  },
  {
    ref: { surahNumber: 92, ayahNumber: 2 },
    text: "وَالنَّهَارِ إِذَا تَجَلَّىٰ",
    translation: "And by the day when it appears.",
  },
  {
    ref: { surahNumber: 92, ayahNumber: 3 },
    text: "وَمَا خَلَقَ الذَّكَرَ وَالْأُنثَىٰ",
    translation: "And by He who created the male and female.",
  },
]

export const getAyahSeed = (ref: AyahReference): AyahSeed | undefined =>
  AYAH_CATALOG.find(
    (item) => item.ref.surahNumber === ref.surahNumber && item.ref.ayahNumber === ref.ayahNumber,
  )
