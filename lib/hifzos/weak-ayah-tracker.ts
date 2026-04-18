import type { HifzProfile, RecallAttempt, ReviewQueueItem } from "@/lib/hifzos/types"

const ayahKey = (surahNumber: number, ayahNumber: number): string => `${surahNumber}:${ayahNumber}`

const clamp = (value: number, min: number, max: number): number =>
  Math.max(min, Math.min(max, value))

const getScoreDelta = (attempt: RecallAttempt): number => {
  if (!attempt.correct) {
    return attempt.mode === "alarm" ? 14 : 10
  }

  if (attempt.hesitationMs > 3500) {
    return 2
  }

  return -4
}

const updateQueueItem = (item: ReviewQueueItem, attempt: RecallAttempt): ReviewQueueItem => {
  const delta = getScoreDelta(attempt)
  return {
    ...item,
    weaknessScore: clamp(item.weaknessScore + delta, 1, 100),
    recentFailureCount: attempt.correct ? Math.max(0, item.recentFailureCount - 1) : item.recentFailureCount + 1,
    lastReviewedAt: attempt.createdAt,
  }
}

export const applyRecallAttempt = (profile: HifzProfile, attempt: RecallAttempt): HifzProfile => {
  const key = ayahKey(attempt.ref.surahNumber, attempt.ref.ayahNumber)

  const updatedQueue = profile.reviewQueue.map((item) => {
    const itemKey = ayahKey(item.ref.surahNumber, item.ref.ayahNumber)
    if (itemKey !== key) return item
    return updateQueueItem(item, attempt)
  })

  const matchedItem = updatedQueue.find(
    (item) => ayahKey(item.ref.surahNumber, item.ref.ayahNumber) === key,
  )

  const previousScore =
    profile.reviewQueue.find((item) => ayahKey(item.ref.surahNumber, item.ref.ayahNumber) === key)
      ?.weaknessScore ?? 1

  const nextScore = matchedItem?.weaknessScore ?? previousScore

  const totalAttempts = profile.recallAttempts.length + 1
  const correctAttempts = [...profile.recallAttempts, attempt].filter((entry) => entry.correct).length
  const hesitationEvents = [...profile.recallAttempts, attempt].filter((entry) => entry.hesitationMs > 3500).length
  const averageWeaknessScore =
    updatedQueue.length > 0
      ? updatedQueue.reduce((sum, item) => sum + item.weaknessScore, 0) / updatedQueue.length
      : 0

  return {
    ...profile,
    reviewQueue: updatedQueue,
    recallAttempts: [...profile.recallAttempts, attempt],
    weaknessHistory: [
      ...profile.weaknessHistory,
      {
        ref: attempt.ref,
        previousScore,
        nextScore,
        reason: !attempt.correct
          ? attempt.mode === "alarm"
            ? "alarm-fail"
            : "incorrect"
          : attempt.hesitationMs > 3500
            ? "hesitation"
            : "correct",
        recordedAt: attempt.createdAt,
      },
    ],
    metrics: {
      ...profile.metrics,
      recallAccuracyPercent: Math.round((correctAttempts / totalAttempts) * 100),
      hesitationEvents,
      weakAyahRecoveryPercent: Math.min(100, Math.max(0, 100 - Math.round(averageWeaknessScore))),
    },
  }
}
