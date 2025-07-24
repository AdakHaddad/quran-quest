"use client"

import type React from "react"
import { useState, useRef, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { Card } from "@/components/ui/card"
import { Play, Flame, Lightbulb, Volume2, RotateCcw, ChevronDown, BookOpen, Search } from "lucide-react"
import { SimpleDropdownMenu } from "@/components/ui/dropdown-menu"
import { quranAPI, type QuizData } from "@/lib/quran-api"
import { SURAHS, getPopularSurahs, type SurahInfo } from "@/lib/surah-data"

type QuizMode = "fill-blank" | "tap-hear" | "what-next" | "reorder" | "full-surah"

export default function QuranMemorizationApp() {

  // App state
  const [currentMode, setCurrentMode] = useState<QuizMode>("fill-blank")
  const [selectedSurah, setSelectedSurah] = useState<SurahInfo>(SURAHS[0]) // Default to Al-Fatiha
  const [currentQuizIndex, setCurrentQuizIndex] = useState(0)
  const [quizData, setQuizData] = useState<QuizData[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fullSurahMode, setFullSurahMode] = useState(false) // Toggle for full surah vs 10 questions
  
  // Quiz state
  const [streak, setStreak] = useState(7)
  const [progress, setProgress] = useState(65)
  const [selectedAnswers, setSelectedAnswers] = useState<string[]>([])
  const [userInput, setUserInput] = useState("")
  const [draggedWords, setDraggedWords] = useState<string[]>([])
  const [showHint, setShowHint] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [showAnswer, setShowAnswer] = useState(false)
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null)
  
  // Full Surah mode state
  const [memorizedVerses, setMemorizedVerses] = useState<Set<number>>(new Set())
  const [currentVerseIndex, setCurrentVerseIndex] = useState(0)
  const [showTranslation, setShowTranslation] = useState(true)
  const [memorizationMode, setMemorizationMode] = useState<'learn' | 'test' | 'review'>('learn')
  
  // UI state
  const [showSurahList, setShowSurahList] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  
  const audioRef = useRef<HTMLAudioElement>(null)

  const currentQuiz = quizData[currentQuizIndex]

  // Define loadQuizData function first
  const loadQuizData = useCallback(async () => {
    if (!selectedSurah) return
    
    setLoading(true)
    setError(null)
    
    try {
      const data = await quranAPI.generateQuizData(selectedSurah.number, currentMode, fullSurahMode)
      setQuizData(data)
      setCurrentQuizIndex(0)
    } catch (err) {
      setError("Failed to load quiz data. Please try again.")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [selectedSurah, currentMode, fullSurahMode])

  // Load quiz data when surah, mode, or full surah mode changes
  useEffect(() => {
    loadQuizData()
  }, [loadQuizData])

  // Reset quiz state when changing quiz
  useEffect(() => {
    resetQuizState()
  }, [currentQuizIndex])

  // Initialize drag and drop for reorder mode
  useEffect(() => {
    if (currentMode === "reorder" && currentQuiz?.words) {
      setDraggedWords([...currentQuiz.words].sort(() => Math.random() - 0.5))
    }
  }, [currentMode, currentQuiz])

  // Update page title dynamically based on selected surah and mode
  useEffect(() => {
    const updatePageTitle = () => {
      let title = 'Quran Memorization App'
      
      if (selectedSurah) {
        title = `${selectedSurah.englishName} (${selectedSurah.name}) - ${title}`
      }
      
      if (currentMode === 'full-surah') {
        title = `Full Surah Mode - ${title}`
      } else if (fullSurahMode) {
        title = `Full Surah Quiz - ${title}`
      }
      
      document.title = title
      
      // Update meta description
      const metaDescription = document.querySelector('meta[name="description"]')
      if (metaDescription && selectedSurah) {
        const description = `Learn and memorize Surah ${selectedSurah.englishName} (${selectedSurah.englishNameTranslation}) - ${selectedSurah.numberOfAyahs} verses. Interactive Quran memorization with audio and multiple quiz modes.`
        metaDescription.setAttribute('content', description)
      }
      
      // Update canonical URL
      const canonicalLink = document.querySelector('link[rel="canonical"]')
      if (canonicalLink && selectedSurah) {
        const url = `https://quran-memorization.vercel.app/?surah=${selectedSurah.number}&mode=${currentMode}`
        canonicalLink.setAttribute('href', url)
      }
    }
    
    updatePageTitle()
  }, [selectedSurah, currentMode, fullSurahMode])

  const resetQuizState = () => {
    setSelectedAnswers([])
    setUserInput("")
    setDraggedWords([])
    setShowHint(false)
    setShowAnswer(false)
    setIsCorrect(null)
  }

  const playAudio = () => {
    if (!currentQuiz?.audio) return
    
    setIsPlaying(true)
    if (audioRef.current) {
      audioRef.current.src = currentQuiz.audio
      audioRef.current.play()
        .then(() => {
          setTimeout(() => setIsPlaying(false), 3000) // Approximate duration
        })
        .catch(() => setIsPlaying(false))
    }
  }

  const handleWordSelect = (word: string) => {
    if (currentMode === "tap-hear") {
      setSelectedAnswers((prev) => [...prev, word])
    }
  }

  const handleDragStart = (e: React.DragEvent, word: string, index: number) => {
    e.dataTransfer.setData("text/plain", word)
    e.dataTransfer.setData("index", index.toString())
  }

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault()
    const draggedWord = e.dataTransfer.getData("text/plain")
    const draggedIndex = Number.parseInt(e.dataTransfer.getData("index"))

    const newWords = [...draggedWords]
    newWords.splice(draggedIndex, 1)
    newWords.splice(targetIndex, 0, draggedWord)
    setDraggedWords(newWords)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const checkAnswer = () => {
    if (!currentQuiz) return

    let correct = false

    switch (currentMode) {
      case "fill-blank":
        correct = selectedAnswers[0] === currentQuiz.correctAnswer
        break
      case "tap-hear":
        const correctOrder = currentQuiz.arabic.split(' ')
        correct = selectedAnswers.length === correctOrder.length && 
          selectedAnswers.every((word, index) => word === correctOrder[index])
        break
      case "what-next":
        correct = selectedAnswers[0] === currentQuiz.correctAnswer
        break
      case "reorder":
        const originalOrder = currentQuiz.words?.join(' ')
        const userOrder = draggedWords.join(' ')
        correct = originalOrder === userOrder
        break
      case "full-surah":
        if (memorizationMode === 'test') {
          // Simple text comparison for full surah test mode
          const normalizedInput = userInput.trim().replace(/\s+/g, ' ')
          const normalizedCorrect = currentQuiz.arabic.trim().replace(/\s+/g, ' ')
          correct = normalizedInput === normalizedCorrect
        }
        break
    }

    setIsCorrect(correct)
    setShowAnswer(true)
    
    if (correct) {
      setStreak(streak + 1)
      // Calculate progress based on current position in quiz
      const newProgress = ((currentQuizIndex + 1) / quizData.length) * 100
      setProgress(Math.min(newProgress, 100))
    } else {
      setStreak(Math.max(streak - 1, 0))
    }
  }

  const nextQuestion = () => {
    if (currentQuizIndex < quizData.length - 1) {
      setCurrentQuizIndex(currentQuizIndex + 1)
    } else {
      // Load more data or start over
      loadQuizData()
    }
  }

  const filteredSurahs = SURAHS.filter((surah: SurahInfo) => 
    surah.name.includes(searchTerm) || 
    surah.englishName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    surah.englishNameTranslation.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const quizModeNames: Record<QuizMode, string> = {
    "fill-blank": "Fill in the Blank",
    "tap-hear": "Tap What You Hear",
    "what-next": "What Comes Next?",
    "reorder": "Reorder the Words",
    "full-surah": "Full Surah Memorization",
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-emerald-500 mx-auto mb-4"></div>
          <p className="text-xl">Loading {selectedSurah.englishName}...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-red-400 mb-4">{error}</p>
          <Button onClick={loadQuizData} className="bg-emerald-600 hover:bg-emerald-700">
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  const renderQuizContent = () => {
    if (!currentQuiz) return null

    switch (currentMode) {
      case "fill-blank":
        return (
          <div className="space-y-6 sm:space-y-8">
            <div className="text-center">
              <p className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-3 sm:mb-4 leading-relaxed px-2" dir="rtl">
                {currentQuiz.arabic}
              </p>
              <p className="text-gray-300 text-base sm:text-lg px-2">{currentQuiz.translation}</p>
              <p className="text-emerald-400 text-xs sm:text-sm mt-2">
                {selectedSurah.englishName} - Ayah {currentQuiz.ayahNumber}
              </p>
            </div>
            {showAnswer && (
              <div className="text-center p-3 sm:p-4 rounded-lg bg-slate-700 mx-2 sm:mx-0">
                <p className={`text-base sm:text-lg font-semibold ${isCorrect ? 'text-green-400' : 'text-red-400'}`}>
                  {isCorrect ? '✓ Correct!' : '✗ Incorrect'}
                </p>
                {!isCorrect && (
                  <p className="text-gray-300 mt-2 text-sm sm:text-base" dir="rtl">{currentQuiz.correctAnswer}</p>
                )}
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 px-2 sm:px-0">
              {currentQuiz.options?.map((option, index) => (
                <Button
                  key={index}
                  variant={selectedAnswers.includes(option) ? "default" : "outline"}
                  className={`h-12 sm:h-16 text-lg sm:text-2xl font-bold border-slate-600 rounded-xl sm:rounded-2xl transition-all duration-200 ${
                    selectedAnswers.includes(option)
                      ? 'bg-blue-600 hover:bg-blue-700 text-white border-blue-500'
                      : 'bg-slate-700 hover:bg-slate-600 text-white'
                  }`}
                  onClick={() => setSelectedAnswers([option])}
                  dir="rtl"
                  disabled={showAnswer}
                >
                  {option}
                </Button>
              ))}
            </div>
          </div>
        )

      case "tap-hear":
        return (
          <div className="space-y-6 sm:space-y-8">
            <div className="text-center">
              <Button
                onClick={playAudio}
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-emerald-600 hover:bg-emerald-700 mb-4 sm:mb-6"
                disabled={isPlaying}
              >
                {isPlaying ? <Volume2 className="w-6 h-6 sm:w-8 sm:h-8 animate-pulse" /> : <Play className="w-6 h-6 sm:w-8 sm:h-8 ml-1" />}
              </Button>
              <p className="text-gray-300 text-base sm:text-lg px-2">Tap the words you hear in order</p>
              <p className="text-emerald-400 text-xs sm:text-sm mt-2">
                {selectedSurah.englishName} - Ayah {currentQuiz.ayahNumber}
              </p>
            </div>

            <div className="bg-slate-800 rounded-xl sm:rounded-2xl p-3 sm:p-4 min-h-[60px] sm:min-h-[80px] flex flex-wrap gap-2 items-center justify-center mx-2 sm:mx-0">
              {selectedAnswers.map((word, index) => (
                <span
                  key={index}
                  className="bg-blue-600 text-white px-3 py-2 sm:px-4 sm:py-2 rounded-lg sm:rounded-xl text-lg sm:text-xl font-bold shadow-lg"
                  dir="rtl"
                >
                  {word}
                </span>
              ))}
            </div>

            {showAnswer && (
              <div className="text-center p-3 sm:p-4 rounded-lg bg-slate-700 mx-2 sm:mx-0">
                <p className={`text-base sm:text-lg font-semibold ${isCorrect ? 'text-green-400' : 'text-red-400'}`}>
                  {isCorrect ? '✓ Correct!' : '✗ Incorrect'}
                </p>
                <p className="text-gray-300 mt-2 text-base sm:text-lg" dir="rtl">{currentQuiz.arabic}</p>
                <p className="text-gray-400 text-sm mt-1">{currentQuiz.translation}</p>
              </div>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3 px-2 sm:px-0">
              {currentQuiz.options?.map((option, index) => {
                const isSelected = selectedAnswers.includes(option)
                return (
                  <Button
                    key={index}
                    variant="outline"
                    className={`h-12 sm:h-14 text-base sm:text-xl font-bold border-slate-600 rounded-xl sm:rounded-2xl transition-all duration-200 ${
                      isSelected
                        ? 'bg-blue-600 hover:bg-blue-700 text-white border-blue-500'
                        : 'bg-slate-700 hover:bg-slate-600 text-white'
                    }`}
                    onClick={() => handleWordSelect(option)}
                    dir="rtl"
                    disabled={showAnswer}
                  >
                    {option}
                  </Button>
                )
              })}
            </div>
          </div>
        )

      case "what-next":
        return (
          <div className="space-y-6 sm:space-y-8">
            <div className="text-center">
              <p className="text-2xl sm:text-3xl font-bold text-white mb-3 sm:mb-4 leading-relaxed px-2" dir="rtl">
                {currentQuiz.arabic}
              </p>
              <p className="text-gray-300 text-base sm:text-lg mb-4 sm:mb-6 px-2">{currentQuiz.translation}</p>
              <p className="text-emerald-400 text-lg sm:text-xl font-semibold">What comes next?</p>
              <p className="text-emerald-400 text-xs sm:text-sm mt-2">
                {selectedSurah.englishName} - Ayah {currentQuiz.ayahNumber}
              </p>
            </div>

            {showAnswer && (
              <div className="text-center p-3 sm:p-4 rounded-lg bg-slate-700 mx-2 sm:mx-0">
                <p className={`text-base sm:text-lg font-semibold ${isCorrect ? 'text-green-400' : 'text-red-400'}`}>
                  {isCorrect ? '✓ Correct!' : '✗ Incorrect'}
                </p>
                {!isCorrect && (
                  <p className="text-gray-300 mt-2 text-sm sm:text-base" dir="rtl">{currentQuiz.correctAnswer}</p>
                )}
              </div>
            )}

            <div className="space-y-3 sm:space-y-4 px-2 sm:px-0">
              {currentQuiz.nextOptions?.map((option, index) => (
                <Button
                  key={index}
                  variant={selectedAnswers.includes(option) ? "default" : "outline"}
                  className={`w-full h-12 sm:h-16 text-base sm:text-xl font-bold border-slate-600 rounded-xl sm:rounded-2xl transition-all duration-200 justify-center ${
                    selectedAnswers.includes(option)
                      ? 'bg-blue-600 hover:bg-blue-700 text-white border-blue-500'
                      : 'bg-slate-700 hover:bg-slate-600 text-white'
                  }`}
                  onClick={() => setSelectedAnswers([option])}
                  dir="rtl"
                  disabled={showAnswer}
                >
                  {option}
                </Button>
              ))}
            </div>
          </div>
        )

      case "reorder":
        return (
          <div className="space-y-6 sm:space-y-8">
            <div className="text-center">
              <p className="text-gray-300 text-base sm:text-lg mb-4 sm:mb-6 px-2">{currentQuiz.translation}</p>
              <p className="text-emerald-400 text-lg sm:text-xl font-semibold">Reorder the words</p>
              <p className="text-emerald-400 text-xs sm:text-sm mt-2">
                {selectedSurah.englishName} - Ayah {currentQuiz.ayahNumber}
              </p>
            </div>

            <div className="bg-slate-800 rounded-xl sm:rounded-2xl p-3 sm:p-4 min-h-[80px] sm:min-h-[100px] flex flex-wrap gap-2 sm:gap-3 items-center justify-center mx-2 sm:mx-0">
              {draggedWords.map((word, index) => (
                <div
                  key={index}
                  draggable={!showAnswer}
                  onDragStart={(e) => handleDragStart(e, word, index)}
                  onDrop={(e) => handleDrop(e, index)}
                  onDragOver={handleDragOver}
                  className={`bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 sm:px-4 sm:py-3 rounded-lg sm:rounded-xl text-base sm:text-xl font-bold transition-all duration-200 select-none shadow-lg ${
                    !showAnswer ? 'cursor-move hover:shadow-xl' : 'cursor-default'
                  }`}
                  dir="rtl"
                >
                  {word}
                </div>
              ))}
            </div>

            {showAnswer && (
              <div className="text-center p-3 sm:p-4 rounded-lg bg-slate-700 mx-2 sm:mx-0">
                <p className={`text-base sm:text-lg font-semibold ${isCorrect ? 'text-green-400' : 'text-red-400'}`}>
                  {isCorrect ? '✓ Correct!' : '✗ Incorrect'}
                </p>
                <p className="text-gray-300 mt-2 text-sm sm:text-base" dir="rtl">{currentQuiz.words?.join(' ')}</p>
              </div>
            )}

            <div className="text-center">
              <Button
                onClick={() => setDraggedWords([...currentQuiz.words!].sort(() => Math.random() - 0.5))}
                variant="outline"
                className="bg-slate-700 hover:bg-slate-600 border-slate-600 text-white rounded-xl text-sm sm:text-base px-4 py-2"
                disabled={showAnswer}
              >
                <RotateCcw className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                Shuffle Again
              </Button>
            </div>
          </div>
        )

      case "full-surah":
        if (!quizData || quizData.length === 0) return null
        
        const currentVerse = quizData[currentVerseIndex]
        const totalVerses = quizData.length
        const memorizedCount = memorizedVerses.size
        
        return (
          <div className="space-y-6 sm:space-y-8">
            {/* Surah Header */}
            <div className="text-center border-b border-slate-700 pb-4 sm:pb-6">
              <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
                {selectedSurah.englishName} ({selectedSurah.name})
              </h1>
              <p className="text-gray-300 text-sm sm:text-base">{selectedSurah.englishNameTranslation}</p>
              <p className="text-emerald-400 text-xs sm:text-sm mt-2">
                {totalVerses} verses • {selectedSurah.revelationType}
              </p>
            </div>

            {/* Progress Overview */}
            <div className="bg-slate-700 rounded-lg p-3 sm:p-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-white font-semibold text-sm sm:text-base">Memorization Progress</span>
                <span className="text-emerald-400 text-sm sm:text-base">{memorizedCount}/{totalVerses} verses</span>
              </div>
              <Progress value={(memorizedCount / totalVerses) * 100} className="h-2" />
            </div>

            {/* Mode Selection */}
            <div className="flex justify-center space-x-1 sm:space-x-2">
              {(['learn', 'test', 'review'] as const).map((mode) => (
                <Button
                  key={mode}
                  variant={memorizationMode === mode ? "default" : "outline"}
                  onClick={() => setMemorizationMode(mode)}
                  className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600 text-sm sm:text-base px-3 sm:px-4"
                >
                  {mode.charAt(0).toUpperCase() + mode.slice(1)}
                </Button>
              ))}
            </div>

            {/* Current Verse Display */}
            <div className="bg-slate-800 rounded-lg p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2 sm:gap-0">
                <span className="text-xs sm:text-sm text-gray-400">
                  Verse {currentVerseIndex + 1} of {totalVerses}
                </span>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowTranslation(!showTranslation)}
                    className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600 text-xs sm:text-sm"
                  >
                    {showTranslation ? 'Hide' : 'Show'} Translation
                  </Button>
                  <Button
                    onClick={playAudio}
                    size="sm"
                    className="bg-emerald-600 hover:bg-emerald-700 text-xs sm:text-sm"
                    disabled={isPlaying}
                  >
                    {isPlaying ? <Volume2 className="w-3 h-3 sm:w-4 sm:h-4" /> : <Play className="w-3 h-3 sm:w-4 sm:h-4" />}
                  </Button>
                </div>
              </div>

              {/* Arabic Text */}
              <div className="text-center mb-4 sm:mb-6">
                <p className="text-2xl sm:text-3xl font-bold text-white mb-3 sm:mb-4 leading-relaxed px-2" dir="rtl">
                  {memorizationMode === 'test' && !showAnswer ? '...' : currentVerse.arabic}
                </p>
                
                {showTranslation && (
                  <p className="text-gray-300 text-base sm:text-lg px-2">
                    {currentVerse.translation}
                  </p>
                )}
              </div>

              {/* Test Mode Input */}
              {memorizationMode === 'test' && !showAnswer && (
                <div className="space-y-3 sm:space-y-4">
                  <textarea
                    value={userInput}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setUserInput(e.target.value)}
                    placeholder="Type the verse in Arabic..."
                    className="w-full h-20 sm:h-24 p-3 bg-slate-700 border border-slate-600 rounded-lg text-white text-right text-sm sm:text-base"
                    dir="rtl"
                  />
                  <div className="text-center">
                    <Button
                      onClick={checkAnswer}
                      disabled={!userInput.trim()}
                      className="bg-emerald-600 hover:bg-emerald-700 text-sm sm:text-base px-4 sm:px-6"
                    >
                      Check My Answer
                    </Button>
                  </div>
                </div>
              )}

              {/* Answer feedback for test mode */}
              {memorizationMode === 'test' && showAnswer && (
                <div className="text-center p-3 sm:p-4 rounded-lg bg-slate-700">
                  <p className={`text-base sm:text-lg font-semibold ${isCorrect ? 'text-green-400' : 'text-red-400'}`}>
                    {isCorrect ? '✓ Excellent!' : '✗ Keep practicing'}
                  </p>
                  {!isCorrect && (
                    <p className="text-gray-300 mt-2 text-sm sm:text-base" dir="rtl">{currentVerse.arabic}</p>
                  )}
                </div>
              )}
            </div>

            {/* Verse Navigation */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-0">
              <Button
                variant="outline"
                onClick={() => setCurrentVerseIndex(Math.max(0, currentVerseIndex - 1))}
                disabled={currentVerseIndex === 0}
                className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600 text-sm sm:text-base w-full sm:w-auto"
              >
                Previous Verse
              </Button>

              <div className="flex space-x-2">
                <Button
                  variant={memorizedVerses.has(currentVerseIndex) ? "default" : "outline"}
                  onClick={() => {
                    const newMemorized = new Set(memorizedVerses)
                    if (memorizedVerses.has(currentVerseIndex)) {
                      newMemorized.delete(currentVerseIndex)
                    } else {
                      newMemorized.add(currentVerseIndex)
                    }
                    setMemorizedVerses(newMemorized)
                  }}
                  className="bg-emerald-600 hover:bg-emerald-700 text-xs sm:text-sm px-3 sm:px-4"
                >
                  {memorizedVerses.has(currentVerseIndex) ? '✓ Memorized' : 'Mark as Memorized'}
                </Button>
              </div>

              <Button
                variant="outline"
                onClick={() => setCurrentVerseIndex(Math.min(totalVerses - 1, currentVerseIndex + 1))}
                disabled={currentVerseIndex === totalVerses - 1}
                className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600 text-sm sm:text-base w-full sm:w-auto"
              >
                Next Verse
              </Button>
            </div>

            {/* Quick Verse Navigator */}
            <div className="bg-slate-800 rounded-lg p-3 sm:p-4">
              <h3 className="text-white font-semibold mb-3 text-sm sm:text-base">Quick Navigation</h3>
              <div className="grid grid-cols-8 sm:grid-cols-10 gap-1 sm:gap-2 max-h-32 overflow-y-auto">
                {quizData.map((_, index) => (
                  <Button
                    key={index}
                    variant={currentVerseIndex === index ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentVerseIndex(index)}
                    className={`h-7 w-7 sm:h-8 sm:w-8 p-0 text-xs ${
                      memorizedVerses.has(index) 
                        ? 'bg-green-600 border-green-500 text-white hover:bg-green-700' 
                        : 'bg-slate-700 border-slate-600 text-white hover:bg-slate-600'
                    }`}
                  >
                    {index + 1}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      <audio ref={audioRef} />
      
            {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 sm:p-4 gap-3 sm:gap-4">
        <div className="flex flex-wrap items-center gap-2 sm:gap-4 w-full sm:w-auto">
          {/* Surah Selection */}
          <SimpleDropdownMenu 
            trigger={
              <Button variant="outline" className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600 text-sm sm:text-base px-2 sm:px-4">
                <BookOpen className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                <span className="truncate max-w-[100px] sm:max-w-none">{selectedSurah.englishName}</span>
                <ChevronDown className="w-3 h-3 sm:w-4 sm:h-4 ml-1 sm:ml-2" />
              </Button>
            }
            items={[
              { label: "Browse All Surahs", onClick: () => setShowSurahList(true) },
              ...getPopularSurahs().slice(0, 10).map((surah: SurahInfo) => ({
                label: `${surah.number}. ${surah.englishName}`,
                onClick: () => setSelectedSurah(surah)
              }))
            ]}
          />
          
          {/* Quiz Mode Selection */}
          <SimpleDropdownMenu
            trigger={
              <Button variant="outline" className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600 text-sm sm:text-base px-2 sm:px-4">
                <span className="truncate max-w-[120px] sm:max-w-none">{quizModeNames[currentMode]}</span>
                <ChevronDown className="w-3 h-3 sm:w-4 sm:h-4 ml-1 sm:ml-2" />
              </Button>
            }
            items={Object.entries(quizModeNames).map(([mode, name]) => ({
              label: name,
              onClick: () => setCurrentMode(mode as QuizMode)
            }))}
          />

          {/* Full Surah Toggle - Only show for non-full-surah modes */}
          {currentMode !== 'full-surah' && (
            <Button
              variant={fullSurahMode ? "default" : "outline"}
              onClick={() => setFullSurahMode(!fullSurahMode)}
              className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600 text-xs sm:text-sm px-2 sm:px-4"
            >
              <span className="hidden sm:inline">
                {fullSurahMode ? `Full Surah (${selectedSurah.numberOfAyahs} verses)` : '10 Questions'}
              </span>
              <span className="sm:hidden">
                {fullSurahMode ? 'Full' : '10Q'}
              </span>
            </Button>
          )}
        </div>

        <div className="flex items-center space-x-2 sm:space-x-4">
          <div className="flex items-center space-x-1 sm:space-x-2">
            <Flame className="w-5 h-5 sm:w-6 sm:h-6 text-orange-500" />
            <span className="text-lg sm:text-xl font-bold">{streak}</span>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="px-3 sm:px-4 mb-6 sm:mb-8">
        <Progress value={progress} className="h-2 sm:h-3 bg-slate-700" />
        <div className="flex justify-between items-center mt-2 text-xs sm:text-sm text-gray-400">
          <span>Question {currentQuizIndex + 1} of {quizData.length}</span>
          <span>
            {fullSurahMode && currentMode !== 'full-surah' 
              ? `${selectedSurah.englishName} - Full Surah Mode`
              : `${progress}% Complete`
            }
          </span>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-3 sm:px-4 pb-20 sm:pb-24">
        <Card className="bg-slate-800/50 border-slate-700 p-4 sm:p-6 md:p-8">
          {renderQuizContent()}
        </Card>
      </div>

      {/* Bottom Actions */}
      <div className="fixed bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur-sm p-3 sm:p-4">
        <div className="flex items-center justify-between max-w-md mx-auto">
          <Button
            variant="outline"
            onClick={() => setShowHint(!showHint)}
            className="bg-slate-700 hover:bg-slate-600 border-slate-600 text-white rounded-lg sm:rounded-xl px-3 sm:px-6 text-sm sm:text-base"
            disabled={showAnswer}
          >
            <Lightbulb className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
            Hint
          </Button>

          {currentMode === "full-surah" ? (
            // Full Surah mode has its own navigation
            <div className="text-center">
              <span className="text-gray-400 text-xs sm:text-sm">
                Use the navigation above to move between verses
              </span>
            </div>
          ) : !showAnswer ? (
            <Button
              className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg sm:rounded-xl px-6 sm:px-8 py-2 sm:py-3 text-base sm:text-lg font-semibold"
              onClick={checkAnswer}
              disabled={
                (currentMode === "fill-blank" && selectedAnswers.length === 0) ||
                (currentMode === "tap-hear" && selectedAnswers.length === 0) ||
                (currentMode === "what-next" && selectedAnswers.length === 0) ||
                (currentMode === "reorder" && draggedWords.length === 0)
              }
            >
              Check
            </Button>
          ) : (
            <Button
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg sm:rounded-xl px-6 sm:px-8 py-2 sm:py-3 text-base sm:text-lg font-semibold"
              onClick={nextQuestion}
            >
              Next
            </Button>
          )}
        </div>
      </div>

      {/* Surah Selection Modal */}
      {showSurahList && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-3 sm:p-4 z-50">
          <div className="bg-slate-800 rounded-lg w-full max-w-2xl max-h-[85vh] sm:max-h-[80vh] flex flex-col">
            <div className="p-4 sm:p-6 border-b border-slate-700">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <h2 className="text-xl sm:text-2xl font-bold">Select Surah</h2>
                <Button
                  variant="outline"
                  onClick={() => setShowSurahList(false)}
                  className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600 p-2"
                >
                  ✕
                </Button>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  type="text"
                  placeholder="Search surahs..."
                  value={searchTerm}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-slate-700 border-slate-600 text-white text-sm sm:text-base"
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-3 sm:p-6">
              <div className="grid gap-2">
                {filteredSurahs.map((surah: SurahInfo) => (
                  <Button
                    key={surah.number}
                    variant="outline"
                    className="justify-start h-auto p-3 sm:p-4 bg-slate-700 border-slate-600 text-white hover:bg-slate-600"
                    onClick={() => {
                      setSelectedSurah(surah)
                      setShowSurahList(false)
                      setSearchTerm("")
                    }}
                  >
                    <div className="text-left w-full">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm sm:text-base">{surah.number}.</span>
                        <span className="font-semibold text-sm sm:text-base">{surah.englishName}</span>
                        <span className="text-xs sm:text-sm text-gray-400">({surah.numberOfAyahs} ayahs)</span>
                      </div>
                      <div className="text-xs sm:text-sm text-gray-400 mt-1">
                        {surah.englishNameTranslation} • {surah.revelationType}
                      </div>
                    </div>
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Hint Modal */}
      {showHint && currentQuiz && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-3 sm:p-4 z-50">
          <div className="bg-slate-800 rounded-lg w-full max-w-md p-4 sm:p-6 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <h3 className="text-lg sm:text-xl font-bold">Hint</h3>
              <Button
                variant="outline"
                onClick={() => setShowHint(false)}
                className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600 p-2"
              >
                ✕
              </Button>
            </div>
            <div className="space-y-3 sm:space-y-4">
              {currentMode === "fill-blank" && currentQuiz.correctAnswer ? (
                <>
                  <p className="text-gray-300 text-sm sm:text-base">Hint for the missing word:</p>
                  <p className="text-white text-sm sm:text-base">
                    The correct word is: <span className="text-emerald-400 font-bold text-base sm:text-lg" dir="rtl">{currentQuiz.correctAnswer}</span>
                  </p>
                  <p className="text-gray-300 text-xs sm:text-sm mt-2">Full verse translation:</p>
                  <p className="text-gray-400 text-xs sm:text-sm">{currentQuiz.translation}</p>
                </>
              ) : currentMode === "what-next" && currentQuiz.correctAnswer ? (
                <>
                  <p className="text-gray-300 text-sm sm:text-base">What comes next:</p>
                  <p className="text-white text-sm sm:text-base" dir="rtl">{currentQuiz.correctAnswer}</p>
                  <p className="text-gray-300 text-xs sm:text-sm mt-2">Current verse translation:</p>
                  <p className="text-gray-400 text-xs sm:text-sm">{currentQuiz.translation}</p>
                </>
              ) : currentMode === "tap-hear" ? (
                <>
                  <p className="text-gray-300 text-sm sm:text-base">Correct order:</p>
                  <p className="text-white text-sm sm:text-base" dir="rtl">{currentQuiz.arabic}</p>
                  <p className="text-gray-300 text-xs sm:text-sm mt-2">Translation:</p>
                  <p className="text-gray-400 text-xs sm:text-sm">{currentQuiz.translation}</p>
                </>
              ) : currentMode === "reorder" && currentQuiz.words ? (
                <>
                  <p className="text-gray-300 text-sm sm:text-base">Correct word order:</p>
                  <p className="text-white text-sm sm:text-base" dir="rtl">{currentQuiz.words.join(' ')}</p>
                  <p className="text-gray-300 text-xs sm:text-sm mt-2">Translation:</p>
                  <p className="text-gray-400 text-xs sm:text-sm">{currentQuiz.translation}</p>
                </>
              ) : (
                <>
                  <p className="text-gray-300 text-sm sm:text-base">Translation:</p>
                  <p className="text-white text-sm sm:text-base">{currentQuiz.translation}</p>
                </>
              )}
              <p className="text-xs sm:text-sm text-gray-400">
                From {selectedSurah.englishName}, Ayah {currentQuiz.ayahNumber}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
