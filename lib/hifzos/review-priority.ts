import type { ReviewQueueItem } from "@/lib/hifzos/types"

const daysSince = (isoDate: string, now = new Date()): number => {
  const date = new Date(isoDate)
  const ms = Math.max(now.getTime() - date.getTime(), 0)
  const days = ms / (1000 * 60 * 60 * 24)
  return Math.max(1, Number.isFinite(days) ? days : 1)
}

export const calculateReviewPriority = (item: ReviewQueueItem, now = new Date()): number => {
  return (
    item.weaknessScore *
    item.similarityRisk *
    daysSince(item.lastReviewedAt, now) *
    Math.max(1, item.recentFailureCount) *
    item.importanceWeight
  )
}

export const rankReviewQueue = (queue: ReviewQueueItem[], now = new Date()): ReviewQueueItem[] => {
  return [...queue].sort(
    (a, b) => calculateReviewPriority(b, now) - calculateReviewPriority(a, now),
  )
}
