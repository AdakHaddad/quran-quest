export interface FeatureFlags {
  v1: {
    reciteToDismissAlarm: boolean
    blankRecall: boolean
    weakAyahTracker: boolean
    repeatToHear: boolean
    dailyReviewPlanner: boolean
  }
  v2: {
    similarityGrouping: boolean
    imageHintRecall: boolean
    meaningLayer: boolean
    mushafPositionHint: boolean
  }
  v3: {
    teacherMode: boolean
    parentMode: boolean
    halaqahGroups: boolean
    advancedDashboard: boolean
  }
}

export const featureFlags: FeatureFlags = {
  v1: {
    reciteToDismissAlarm: true,
    blankRecall: true,
    weakAyahTracker: true,
    repeatToHear: true,
    dailyReviewPlanner: true,
  },
  v2: {
    similarityGrouping: false,
    imageHintRecall: false,
    meaningLayer: false,
    mushafPositionHint: false,
  },
  v3: {
    teacherMode: false,
    parentMode: false,
    halaqahGroups: false,
    advancedDashboard: false,
  },
}
