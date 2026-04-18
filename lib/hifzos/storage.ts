import { AYAH_CATALOG } from "@/lib/hifzos/ayah-catalog"
import type { HifzProfile, ReviewQueueItem } from "@/lib/hifzos/types"

const STORAGE_KEY = "hifzos.profile.v1"

const now = (): string => new Date().toISOString()

const buildInitialReviewQueue = (): ReviewQueueItem[] => {
  return AYAH_CATALOG.map((ayah, index) => ({
    id: `queue-${ayah.ref.surahNumber}-${ayah.ref.ayahNumber}`,
    ref: ayah.ref,
    weaknessScore: index < 2 ? 25 : 15,
    similarityRisk: ayah.ref.surahNumber === 92 ? 1.4 : 1.1,
    lastReviewedAt: now(),
    recentFailureCount: 1,
    importanceWeight: ayah.ref.surahNumber === 1 ? 1.4 : 1.2,
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
      importanceWeight: 1.4,
      similarityRisk: 1.1,
      updatedAt: now(),
    },
    {
      id: "unit-2",
      surahNumber: 92,
      startAyah: 1,
      endAyah: 5,
      status: "new",
      importanceWeight: 1.2,
      similarityRisk: 1.5,
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
