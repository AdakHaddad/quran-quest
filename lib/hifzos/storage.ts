import { AYAH_CATALOG } from "@/lib/hifzos/ayah-catalog"
import type { HifzProfile, ReviewQueueItem } from "@/lib/hifzos/types"

const STORAGE_KEY = "hifzos.profile.v1"

const now = (): string => new Date().toISOString()

const getInitialWeaknessScore = (index: number): number => {
  return index < 2 ? 25 : 15
}

const SIMILARITY_RISK_BY_SURAH: Record<number, number> = {
  1: 1.1,
  92: 1.4,
}

const IMPORTANCE_WEIGHT_BY_SURAH: Record<number, number> = {
  1: 1.4,
  92: 1.2,
}

const getSimilarityRisk = (surahNumber: number): number => {
  return SIMILARITY_RISK_BY_SURAH[surahNumber] ?? 1.1
}

const getImportanceWeight = (surahNumber: number): number => {
  return IMPORTANCE_WEIGHT_BY_SURAH[surahNumber] ?? 1.2
}

const buildInitialReviewQueue = (): ReviewQueueItem[] => {
  return AYAH_CATALOG.map((ayah, index) => ({
    id: `queue-${ayah.ref.surahNumber}-${ayah.ref.ayahNumber}`,
    ref: ayah.ref,
    weaknessScore: getInitialWeaknessScore(index),
    similarityRisk: getSimilarityRisk(ayah.ref.surahNumber),
    lastReviewedAt: now(),
    recentFailureCount: 1,
    importanceWeight: getImportanceWeight(ayah.ref.surahNumber),
  }))
}

const createInitialProfile = (): HifzProfile => ({
  id: "default-user",
  createdAt: now(),
  hifzUnits: [
    {
      id: "unit-1",
      surahNumber: 1,
      startAyah: 1,
      endAyah: 7,
      status: "memorizing",
      importanceWeight: getImportanceWeight(1),
      similarityRisk: getSimilarityRisk(1),
      updatedAt: now(),
    },
    {
      id: "unit-2",
      surahNumber: 92,
      startAyah: 1,
      endAyah: 5,
      status: "new",
      importanceWeight: getImportanceWeight(92),
      similarityRisk: getSimilarityRisk(92),
      updatedAt: now(),
    },
  ],
  reviewQueue: buildInitialReviewQueue(),
  recallAttempts: [],
  weaknessHistory: [],
  streakLog: [],
  sessionLogs: [
    {
      id: "session-initial",
      startedAt: now(),
      completedReviewCount: 0,
      completedRepairCount: 0,
      repeatCycles: 0,
    },
  ],
  metrics: {
    recallAccuracyPercent: 0,
    reviewCompletionPercent: 0,
    weakAyahRecoveryPercent: 0,
    hesitationEvents: 0,
  },
})

export const loadProfile = (): HifzProfile => {
  if (typeof window === "undefined") return createInitialProfile()

  const raw = window.localStorage.getItem(STORAGE_KEY)
  if (!raw) return createInitialProfile()

  try {
    const parsed = JSON.parse(raw) as HifzProfile
    if (!parsed?.id || !Array.isArray(parsed.reviewQueue)) {
      return createInitialProfile()
    }
    return parsed
  } catch {
    return createInitialProfile()
  }
}

export const saveProfile = (profile: HifzProfile): void => {
  if (typeof window === "undefined") return
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(profile))
}
