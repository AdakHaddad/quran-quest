export type MemorizationStatus = "new" | "memorizing" | "stable"

export interface AyahReference {
  surahNumber: number
  ayahNumber: number
}

export interface HifzUnit {
  id: string
  surahNumber: number
  startAyah: number
  endAyah: number
  status: MemorizationStatus
  importanceWeight: number
  similarityRisk: number
  updatedAt: string
}

export interface RecallAttempt {
  id: string
  ref: AyahReference
  mode: "alarm" | "blank-recall" | "night-repair"
  correct: boolean
  hesitationMs: number
  answer: string
  expectedAnswer: string
  createdAt: string
}

export interface WeaknessHistoryEntry {
  ref: AyahReference
  previousScore: number
  nextScore: number
  reason: "correct" | "incorrect" | "hesitation" | "alarm-fail"
  recordedAt: string
}

export interface ReviewQueueItem {
  id: string
  ref: AyahReference
  weaknessScore: number
  similarityRisk: number
  lastReviewedAt: string
  recentFailureCount: number
  importanceWeight: number
}

export interface StreakLogEntry {
  date: string
  completed: boolean
}

export interface SessionLog {
  id: string
  startedAt: string
  endedAt?: string
  completedReviewCount: number
  completedRepairCount: number
  repeatCycles: number
}

export interface HifzMetrics {
  recallAccuracyPercent: number
  reviewCompletionPercent: number
  weakAyahRecoveryPercent: number
  hesitationEvents: number
}

export interface HifzProfile {
  id: string
  createdAt: string
  hifzUnits: HifzUnit[]
  reviewQueue: ReviewQueueItem[]
  recallAttempts: RecallAttempt[]
  weaknessHistory: WeaknessHistoryEntry[]
  streakLog: StreakLogEntry[]
  sessionLogs: SessionLog[]
  metrics: HifzMetrics
}

export interface DailyMission {
  memorizeTarget: HifzUnit | null
  reviewTargets: ReviewQueueItem[]
  weakAyat: ReviewQueueItem[]
  nightFixes: ReviewQueueItem[]
}
