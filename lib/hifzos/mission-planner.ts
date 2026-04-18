import { rankReviewQueue } from "@/lib/hifzos/review-priority"
import type { DailyMission, HifzProfile } from "@/lib/hifzos/types"

export const planDailyMission = (profile: HifzProfile): DailyMission => {
  const ranked = rankReviewQueue(profile.reviewQueue)
  const weakAyat = ranked.filter((item) => item.weaknessScore >= 35).slice(0, 5)
  const nightFixes = ranked.filter((item) => item.weaknessScore >= 45 || item.recentFailureCount > 2).slice(0, 5)

  const memorizeTarget =
    profile.hifzUnits.find((unit) => unit.status === "new") ||
    profile.hifzUnits.find((unit) => unit.status === "memorizing") ||
    null

  return {
    memorizeTarget,
    reviewTargets: ranked.slice(0, 7),
    weakAyat,
    nightFixes,
  }
}
