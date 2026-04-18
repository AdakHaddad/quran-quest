"use client"

import { useMemo, useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { AYAH_CATALOG, getAyahSeed } from "@/lib/hifzos/ayah-catalog"
import { featureFlags } from "@/lib/hifzos/feature-flags"
import { planDailyMission } from "@/lib/hifzos/mission-planner"
import { createBlankRecallPrompt, isRecallAnswerCorrect } from "@/lib/hifzos/recall-engine"
import { buildRepeatToHearFlow } from "@/lib/hifzos/repeat-to-hear"
import { rankReviewQueue } from "@/lib/hifzos/review-priority"
import { loadProfile, saveProfile } from "@/lib/hifzos/storage"
import type { HifzProfile, RecallAttempt, ReviewQueueItem } from "@/lib/hifzos/types"
import { applyRecallAttempt } from "@/lib/hifzos/weak-ayah-tracker"

type Screen = "home" | "recall" | "weak" | "night"

const ayahLabel = (item: { surahNumber: number; ayahNumber: number }): string =>
  `Surah ${item.surahNumber}:${item.ayahNumber}`

const pickTopAyah = (queue: ReviewQueueItem[]): ReviewQueueItem | null => {
  return rankReviewQueue(queue)[0] ?? null
}

export default function HifzOSPage() {
  const [profile, setProfile] = useState<HifzProfile | null>(null)
  const [screen, setScreen] = useState<Screen>("home")
  const [alarmInput, setAlarmInput] = useState("")
  const [recallInput, setRecallInput] = useState("")
  const [nightInput, setNightInput] = useState("")
  const [alarmDismissed, setAlarmDismissed] = useState(false)
  const [feedback, setFeedback] = useState<string>("")
  const [repeatCyclesCompleted, setRepeatCyclesCompleted] = useState(0)

  useEffect(() => {
    const loaded = loadProfile()
    setProfile(loaded)
  }, [])

  useEffect(() => {
    if (!profile) return
    saveProfile(profile)
  }, [profile])

  const mission = useMemo(() => {
    if (!profile) return null
    return planDailyMission(profile)
  }, [profile])

  const focusQueueItem = useMemo(() => {
    if (!profile) return null
    return pickTopAyah(profile.reviewQueue)
  }, [profile])

  const focusAyah = useMemo(() => {
    if (!focusQueueItem) return null
    return getAyahSeed(focusQueueItem.ref) ?? AYAH_CATALOG[0]
  }, [focusQueueItem])

  const prompt = useMemo(() => {
    if (!focusAyah) return null
    return createBlankRecallPrompt(focusAyah)
  }, [focusAyah])

  const repeatFlow = useMemo(() => buildRepeatToHearFlow(2), [])

  if (!profile || !mission || !prompt || !focusQueueItem || !focusAyah) {
    return <div className="min-h-screen bg-slate-950 text-white p-6">Loading HifzOS…</div>
  }

  const applyAttemptAndUpdate = (attempt: RecallAttempt): void => {
    const updated = applyRecallAttempt(profile, attempt)

    const todayTarget = mission.reviewTargets.length
    const completedToday = updated.recallAttempts.filter((entry) => {
      const sameDay = new Date(entry.createdAt).toDateString() === new Date().toDateString()
      return sameDay && entry.correct
    }).length

    const reviewCompletionPercent = todayTarget === 0 ? 0 : Math.min(100, Math.round((completedToday / todayTarget) * 100))

    setProfile({
      ...updated,
      metrics: {
        ...updated.metrics,
        reviewCompletionPercent,
      },
    })
  }

  const handleAttempt = (mode: RecallAttempt["mode"], answer: string): void => {
    const expected = prompt.expectedWord
    const correct = isRecallAnswerCorrect(answer, expected)

    applyAttemptAndUpdate({
      id: `${mode}-${Date.now()}`,
      ref: focusQueueItem.ref,
      mode,
      correct,
      hesitationMs: answer.trim().length < expected.length ? 4200 : 1400,
      answer,
      expectedAnswer: expected,
      createdAt: new Date().toISOString(),
    })

    if (mode === "alarm") {
      setAlarmDismissed(correct)
      setFeedback(correct ? "Alarm dismissed with correct recitation." : "Alarm remains active. Try again.")
    }

    if (mode === "blank-recall") {
      setFeedback(correct ? "Recall accepted and saved." : `Incorrect. Expected: ${expected}`)
      setRecallInput("")
    }

    if (mode === "night-repair") {
      setFeedback(correct ? "Night repair completed." : "Night repair still pending.")
      setNightInput("")
    }
  }

  const topWeak = rankReviewQueue(profile.reviewQueue).filter((item) => item.weaknessScore >= 30)
  const nightMustFix = mission.nightFixes

  return (
    <main className="min-h-screen bg-slate-950 text-white p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <header className="space-y-3">
          <h1 className="text-3xl md:text-4xl font-bold">HifzOS</h1>
          <p className="text-slate-300">Daily memorization operating system for retention, not just reading.</p>
          <div className="flex flex-wrap gap-2 text-xs">
            <span className="px-2 py-1 rounded bg-emerald-800 text-emerald-200">V1 Active</span>
            <span className="px-2 py-1 rounded bg-slate-800 text-slate-200">V2 Features Flagged: {String(featureFlags.v2.similarityGrouping || featureFlags.v2.imageHintRecall)}</span>
            <span className="px-2 py-1 rounded bg-slate-800 text-slate-200">V3 Features Flagged: {String(featureFlags.v3.teacherMode || featureFlags.v3.halaqahGroups)}</span>
          </div>
        </header>

        <nav className="flex flex-wrap gap-2">
          {(["home", "recall", "weak", "night"] as Screen[]).map((item) => (
            <Button
              key={item}
              variant={screen === item ? "default" : "outline"}
              onClick={() => setScreen(item)}
              className={screen === item ? "bg-emerald-600 hover:bg-emerald-700" : "bg-slate-900 text-white border-slate-700"}
            >
              {item === "home" ? "Today’s Mission" : item === "recall" ? "Blank Recall" : item === "weak" ? "Weak Zone" : "Night Review"}
            </Button>
          ))}
        </nav>

        {feedback ? <p className="text-sm text-emerald-300">{feedback}</p> : null}

        {screen === "home" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="bg-slate-900 border-slate-800">
              <CardHeader>
                <CardTitle>Command Center</CardTitle>
                <CardDescription>
                  What to memorize, review, repair, and finish before sleep.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <p><strong>Memorize today:</strong> {mission.memorizeTarget ? `Surah ${mission.memorizeTarget.surahNumber}:${mission.memorizeTarget.startAyah}-${mission.memorizeTarget.endAyah}` : "No new unit today"}</p>
                <p><strong>Review today:</strong> {mission.reviewTargets.length} ayah targets</p>
                <p><strong>Weak right now:</strong> {mission.weakAyat.length} ayat</p>
                <p><strong>Fix before sleep:</strong> {mission.nightFixes.length} ayat</p>
              </CardContent>
            </Card>

            <Card className="bg-slate-900 border-slate-800">
              <CardHeader>
                <CardTitle>Measurement Loop</CardTitle>
                <CardDescription>Retention signals used for daily decisions.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div>
                  <p>Recall Accuracy: {profile.metrics.recallAccuracyPercent}%</p>
                  <Progress value={profile.metrics.recallAccuracyPercent} className="h-2 mt-1" />
                </div>
                <div>
                  <p>Review Completion: {profile.metrics.reviewCompletionPercent}%</p>
                  <Progress value={profile.metrics.reviewCompletionPercent} className="h-2 mt-1" />
                </div>
                <div>
                  <p>Weak Ayah Recovery: {profile.metrics.weakAyahRecoveryPercent}%</p>
                  <Progress value={profile.metrics.weakAyahRecoveryPercent} className="h-2 mt-1" />
                </div>
                <p>Hesitation events: {profile.metrics.hesitationEvents}</p>
              </CardContent>
            </Card>

            {featureFlags.v1.reciteToDismissAlarm && (
              <Card className="bg-slate-900 border-slate-800">
                <CardHeader>
                  <CardTitle>Wake System (Recite to Dismiss)</CardTitle>
                  <CardDescription>
                    Alarm only stops with correct recall.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-lg" dir="rtl">{prompt.ayahTextWithBlank}</p>
                  <Input
                    value={alarmInput}
                    onChange={(event) => setAlarmInput(event.target.value)}
                    placeholder="Type missing word"
                    className="bg-slate-950 border-slate-700"
                    dir="rtl"
                  />
                  <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={() => handleAttempt("alarm", alarmInput)}>
                    Submit Alarm Recall
                  </Button>
                  <p className="text-xs text-slate-300">Status: {alarmDismissed ? "Dismissed" : "Active"}</p>
                </CardContent>
              </Card>
            )}

            {featureFlags.v1.repeatToHear && (
              <Card className="bg-slate-900 border-slate-800">
                <CardHeader>
                  <CardTitle>Repeat-to-Hear Flow</CardTitle>
                  <CardDescription>
                    Ear before tongue: listen and repeat cycles.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <p>Focus Ayah: {ayahLabel(focusAyah.ref)}</p>
                  <p className="text-lg" dir="rtl">{focusAyah.text}</p>
                  <ul className="list-disc ml-6 space-y-1">
                    {repeatFlow.map((step) => (
                      <li key={step.order}>{step.label}</li>
                    ))}
                  </ul>
                  <Button
                    variant="outline"
                    className="border-slate-700 bg-slate-950"
                    onClick={() => setRepeatCyclesCompleted((value) => value + 1)}
                  >
                    Mark Repeat Cycle Complete
                  </Button>
                  <p className="text-xs text-slate-300">Completed cycles this session: {repeatCyclesCompleted}</p>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {screen === "recall" && (
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle>Blank Recall Engine</CardTitle>
              <CardDescription>Pure recall without multiple choice.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-slate-300">Target: {ayahLabel(focusAyah.ref)}</p>
              <p className="text-2xl" dir="rtl">{prompt.ayahTextWithBlank}</p>
              <p className="text-sm text-slate-400">Hint translation: {focusAyah.translation}</p>
              <Input
                value={recallInput}
                onChange={(event) => setRecallInput(event.target.value)}
                placeholder="Type the missing Arabic word"
                className="bg-slate-950 border-slate-700"
                dir="rtl"
              />
              <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={() => handleAttempt("blank-recall", recallInput)}>
                Validate Recall
              </Button>
            </CardContent>
          </Card>
        )}

        {screen === "weak" && (
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle>Weak Ayah Recovery Center</CardTitle>
              <CardDescription>Highest-risk ayat ranked by review priority.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {topWeak.length === 0 ? (
                <p>No weak ayat detected yet.</p>
              ) : (
                topWeak.map((item) => (
                  <div key={item.id} className="rounded border border-slate-800 p-3 bg-slate-950">
                    <p className="font-semibold">{ayahLabel(item.ref)}</p>
                    <p>Weakness score: {item.weaknessScore}</p>
                    <p>Recent failures: {item.recentFailureCount}</p>
                    <p>Similarity risk: {item.similarityRisk.toFixed(1)}</p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        )}

        {screen === "night" && (
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle>Night Repair</CardTitle>
              <CardDescription>Do not sleep with weak memorization unresolved.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <p>Must-fix list: {nightMustFix.length} ayat</p>
              <div className="space-y-2">
                {nightMustFix.map((item) => (
                  <p key={item.id} className="text-slate-300">- {ayahLabel(item.ref)} (score {item.weaknessScore})</p>
                ))}
              </div>
              <p className="text-lg" dir="rtl">{prompt.ayahTextWithBlank}</p>
              <Input
                value={nightInput}
                onChange={(event) => setNightInput(event.target.value)}
                placeholder="Repair recall before sleep"
                className="bg-slate-950 border-slate-700"
                dir="rtl"
              />
              <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={() => handleAttempt("night-repair", nightInput)}>
                Complete Night Repair
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </main>
  )
}
