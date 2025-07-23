export interface Ayah {
  number: number
  text: string
  numberInSurah: number
  juz: number
  manzil: number
  page: number
  ruku: number
  hizbQuarter: number
  sajda: boolean | { id: number; recommended: boolean; obligatory: boolean }
}

export interface Surah {
  number: number
  name: string
  englishName: string
  englishNameTranslation: string
  numberOfAyahs: number
  revelationType: "Meccan" | "Medinan"
  ayahs: Ayah[]
}

export interface Edition {
  identifier: string
  language: string
  name: string
  englishName: string
  format: "text" | "audio"
  type: "quran" | "translation" | "transliteration" | "tafsir" | "versebyverse"
}

export interface QuizData {
  arabic: string
  translation: string
  audio?: string
  options?: string[]
  correctAnswer?: string
  nextOptions?: string[]
  words?: string[]
  surahNumber: number
  ayahNumber: number
  surahName: string
}

class QuranAPI {
  private baseURL = 'https://api.alquran.cloud/v1'
  
  // Cache for surahs to avoid repeated API calls
  private surahCache = new Map<string, Surah>()
  private surahListCache: Array<{
    number: number
    name: string
    englishName: string
    englishNameTranslation: string
    numberOfAyahs: number
    revelationType: "Meccan" | "Medinan"
  }> | null = null

  // Get list of all surahs
  async getSurahList() {
    if (this.surahListCache) {
      return this.surahListCache
    }

    try {
      const response = await fetch(`${this.baseURL}/surah`)
      const data = await response.json()
      
      if (data.code === 200) {
        this.surahListCache = data.data
        return data.data
      }
      throw new Error('Failed to fetch surah list')
    } catch (error) {
      console.error('Error fetching surah list:', error)
      throw error
    }
  }

  // Get a specific surah with Arabic text and English translation
  async getSurah(surahNumber: number): Promise<{ arabic: Surah; translation: Surah }> {
    const cacheKey = `surah-${surahNumber}`
    
    if (this.surahCache.has(cacheKey)) {
      const cached = this.surahCache.get(cacheKey)!
      return { arabic: cached, translation: cached }
    }

    try {
      // Fetch Arabic text and English translation in parallel
      const [arabicResponse, translationResponse] = await Promise.all([
        fetch(`${this.baseURL}/surah/${surahNumber}/quran-uthmani`),
        fetch(`${this.baseURL}/surah/${surahNumber}/en.asad`)
      ])

      const [arabicData, translationData] = await Promise.all([
        arabicResponse.json(),
        translationResponse.json()
      ])

      if (arabicData.code === 200 && translationData.code === 200) {
        const arabic = arabicData.data
        const translation = translationData.data
        
        // Cache the result
        this.surahCache.set(cacheKey, arabic)
        
        return { arabic, translation }
      }
      throw new Error('Failed to fetch surah data')
    } catch (error) {
      console.error(`Error fetching surah ${surahNumber}:`, error)
      throw error
    }
  }

  // Get audio URL for a specific ayah
  getAudioURL(surahNumber: number, ayahNumber: number, reciter: string = 'ar.alafasy'): string {
    // Format: https://cdn.islamic.network/quran/audio/{reciter}/{surahNumber}.mp3
    // For individual ayahs, we'll use the surah audio and let the frontend handle timing
    const paddedSurah = surahNumber.toString().padStart(3, '0')
    return `https://cdn.islamic.network/quran/audio-surah/${reciter}/${paddedSurah}.mp3`
  }

  // Generate quiz data from a surah
  async generateQuizData(surahNumber: number, mode: 'fill-blank' | 'tap-hear' | 'what-next' | 'reorder' | 'full-surah', fullSurah: boolean = false): Promise<QuizData[]> {
    try {
      const { arabic, translation } = await this.getSurah(surahNumber)
      const quizItems: QuizData[] = []
      
      // Use all verses if fullSurah is true, or if it's full-surah mode, otherwise limit to 10
      const maxItems = (fullSurah || mode === 'full-surah') ? arabic.ayahs.length : Math.min(arabic.ayahs.length, 10)
      for (let i = 0; i < maxItems; i++) { // Include all verses when requested
        const ayah = arabic.ayahs[i]
        const translationAyah = translation.ayahs[i]
        
        let quizItem: QuizData = {
          arabic: ayah.text,
          translation: translationAyah.text,
          audio: this.getAudioURL(surahNumber, ayah.numberInSurah),
          surahNumber,
          ayahNumber: ayah.numberInSurah,
          surahName: arabic.englishName,
        }

        // Generate different quiz types based on mode
        switch (mode) {
          case 'fill-blank':
            quizItem = await this.generateFillBlankQuiz(quizItem, arabic.ayahs)
            break
          case 'tap-hear':
            quizItem = await this.generateTapHearQuiz(quizItem, arabic.ayahs)
            break
          case 'what-next':
            quizItem = await this.generateWhatNextQuiz(quizItem, arabic.ayahs, i)
            break
          case 'reorder':
            quizItem = await this.generateReorderQuiz(quizItem)
            break
          case 'full-surah':
            // For full surah mode, keep the original text and add verse-specific data
            quizItem.words = quizItem.arabic.split(' ')
            break
        }
        
        quizItems.push(quizItem)
      }
      
      return quizItems
    } catch (error) {
      console.error('Error generating quiz data:', error)
      throw error
    }
  }

  private async generateFillBlankQuiz(quizItem: QuizData, allAyahs?: Ayah[]): Promise<QuizData> {
    const words = quizItem.arabic.split(' ')
    
    // Handle short ayahs (less than 3 words) differently
    if (words.length < 3) {
      // For very short ayahs, create a "complete the verse" style question
      if (words.length === 1) {
        // Single word ayah - show translation and ask for the word
        quizItem.arabic = `_____ (${quizItem.translation})`
        quizItem.correctAnswer = words[0]
      } else if (words.length === 2) {
        // Two word ayah - blank out one randomly
        const randomIndex = Math.floor(Math.random() * 2)
        const correctAnswer = words[randomIndex]
        const blankedWords = [...words]
        blankedWords[randomIndex] = '_____'
        
        quizItem.arabic = blankedWords.join(' ')
        quizItem.correctAnswer = correctAnswer
      }
      
             // Generate options from other short ayahs or common words
       const shortWords = new Set<string>()
       if (allAyahs) {
         allAyahs.forEach(ayah => {
           ayah.text.split(' ').forEach((word: string) => {
             const cleanWord = this.cleanArabicText(word)
             if (cleanWord.length > 0 && cleanWord !== quizItem.correctAnswer) {
               shortWords.add(cleanWord)
             }
           })
         })
       }
       
       const availableWords = Array.from(shortWords)
       let distractors = availableWords
         .sort(() => Math.random() - 0.5)
         .slice(0, 3)
       
       // Fallback words if we don't have enough distractors
       const fallbackWords = ['اللَّهِ', 'الرَّحْمَنِ', 'الرَّحِيمِ', 'الْحَمْدُ', 'رَبِّ', 'وَ', 'فِي', 'مِنْ', 'إِلَى', 'قُلْ', 'مَا', 'لَا', 'أَمْ', 'هُوَ']
       while (distractors.length < 3) {
         const fallback = fallbackWords[Math.floor(Math.random() * fallbackWords.length)]
         if (!distractors.includes(fallback) && fallback !== quizItem.correctAnswer) {
           distractors.push(fallback)
         }
       }
       
       // Ensure correctAnswer is defined before using it
       const correctAnswer = quizItem.correctAnswer || words[0]
       quizItem.options = [correctAnswer, ...distractors]
       quizItem.options = quizItem.options.sort(() => Math.random() - 0.5)
      
      return quizItem
    }
    
    // Original logic for longer ayahs (3+ words)
    // Remove a random word (not the first or last)
    const randomIndex = Math.floor(Math.random() * (words.length - 2)) + 1
    const correctAnswer = words[randomIndex]
    
    // Create the blanked text
    const blankedWords = [...words]
    blankedWords[randomIndex] = '_____'
    
    quizItem.arabic = blankedWords.join(' ')
    quizItem.correctAnswer = correctAnswer
    
    // Generate contextual options from the same surah
    const surahWords = new Set<string>()
    if (allAyahs) {
      // Collect all unique words from the surah
      allAyahs.forEach(ayah => {
        ayah.text.split(' ').forEach((word: string) => {
          const cleanWord = this.cleanArabicText(word)
          if (cleanWord.length > 1 && cleanWord !== correctAnswer) {
            surahWords.add(cleanWord)
          }
        })
      })
    }
    
    // Convert to array and get random words
    const availableWords = Array.from(surahWords)
    const distractors = availableWords
      .sort(() => Math.random() - 0.5)
      .slice(0, 3) // Get 3 distractors
    
    // If we don't have enough words from the surah, add some common words (but try to keep contextual)
    const fallbackWords = ['اللَّهِ', 'الرَّحْمَنِ', 'الرَّحِيمِ', 'الْحَمْدُ', 'رَبِّ', 'الْعَالَمِينَ', 'وَ', 'فِي', 'مِنْ', 'إِلَى', 'قُلْ', 'الَّذِي', 'مَا', 'لَا']
    while (distractors.length < 3) {
      const fallback = fallbackWords[Math.floor(Math.random() * fallbackWords.length)]
      if (!distractors.includes(fallback) && fallback !== correctAnswer) {
        distractors.push(fallback)
      }
    }
    
    quizItem.options = [correctAnswer, ...distractors]
    
    // Shuffle options
    quizItem.options = quizItem.options.sort(() => Math.random() - 0.5)
    
    return quizItem
  }

  private async generateTapHearQuiz(quizItem: QuizData, allAyahs?: Ayah[]): Promise<QuizData> {
    const words = quizItem.arabic.split(' ')
    
    // Get distractor words from the same surah
    const surahWords = new Set<string>()
    if (allAyahs) {
      allAyahs.forEach(ayah => {
        ayah.text.split(' ').forEach((word: string) => {
          const cleanWord = this.cleanArabicText(word)
          if (cleanWord.length > 1 && !words.includes(cleanWord)) {
            surahWords.add(cleanWord)
          }
        })
      })
    }
    
    // Get distractor words from the surah (proportional to verse length but at least 2)
    const numDistractors = Math.max(2, Math.min(6, Math.floor(words.length * 0.4)))
    const distractors = Array.from(surahWords)
      .sort(() => Math.random() - 0.5)
      .slice(0, numDistractors)
    
    // Combine correct words with distractors
    const allWords = [...words, ...distractors]
    
    quizItem.options = allWords.sort(() => Math.random() - 0.5)
    
    return quizItem
  }

  private async generateWhatNextQuiz(quizItem: QuizData, allAyahs: Ayah[], currentIndex: number): Promise<QuizData> {
    if (currentIndex >= allAyahs.length - 1) {
      // If this is the last ayah, use verses from the same surah as distractors
      const randomVerses = allAyahs
        .filter((_, index) => index !== currentIndex)
        .sort(() => Math.random() - 0.5)
        .slice(0, 3)
        .map(ayah => ayah.text)
      
      quizItem.nextOptions = [
        'صَدَقَ اللَّهُ الْعَظِيمُ', // Common ending
        ...randomVerses
      ]
      quizItem.correctAnswer = quizItem.nextOptions[0]
    } else {
      const nextAyah = allAyahs[currentIndex + 1]
      quizItem.correctAnswer = nextAyah.text
      
      // Get other verses from the same surah as distractors
      const distractorVerses = allAyahs
        .filter((_, index) => index !== currentIndex + 1 && index !== currentIndex)
        .sort(() => Math.random() - 0.5)
        .slice(0, 3)
        .map(ayah => ayah.text)
      
      quizItem.nextOptions = [nextAyah.text, ...distractorVerses]
      
      // Shuffle options
      quizItem.nextOptions = quizItem.nextOptions.sort(() => Math.random() - 0.5)
    }
    
    return quizItem
  }

  private async generateReorderQuiz(quizItem: QuizData): Promise<QuizData> {
    const words = quizItem.arabic.split(' ')
    
    // Only use reorder for shorter ayahs
    if (words.length > 8) {
      // Take first 5-6 words for reordering
      quizItem.words = words.slice(0, 6)
    } else {
      quizItem.words = words
    }
    
    return quizItem
  }

  // Helper function to clean Arabic text
  private cleanArabicText(text: string): string {
    return text
      .replace(/[۔،؟]/g, '') // Remove punctuation
      .replace(/[ًٌٍَُِْ]/g, '') // Remove diacritics for better matching
      .trim()
  }

  // Helper function to get similar length words for better distractors
  private getSimilarLengthWords(words: string[], targetLength: number, count: number): string[] {
    const similarWords = words.filter(word => 
      Math.abs(word.length - targetLength) <= 2 // Allow some variation in length
    )
    
    return similarWords
      .sort(() => Math.random() - 0.5)
      .slice(0, count)
  }

  // Get available editions/translations
  async getEditions(): Promise<Edition[]> {
    try {
      const response = await fetch(`${this.baseURL}/edition?format=text&type=translation`)
      const data = await response.json()
      
      if (data.code === 200) {
        return data.data
      }
      throw new Error('Failed to fetch editions')
    } catch (error) {
      console.error('Error fetching editions:', error)
      throw error
    }
  }

  // Get popular reciters for audio
  getPopularReciters() {
    return [
      { id: 'ar.alafasy', name: 'Mishary Alafasy', language: 'Arabic' },
      { id: 'ar.husary', name: 'Mahmoud Khalil Al-Husary', language: 'Arabic' },
      { id: 'ar.minshawi', name: 'Mohamed Siddiq Al-Minshawi', language: 'Arabic' },
      { id: 'ar.parhizgar', name: 'AbdulBaset AbdulSamad', language: 'Arabic' },
      { id: 'ar.maher', name: 'Maher Al Muaiqly', language: 'Arabic' },
    ]
  }

  // Search ayahs by keyword
  async searchAyahs(keyword: string, surahNumber?: number): Promise<Ayah[]> {
    try {
      const surahParam = surahNumber ? `/${surahNumber}` : '/all'
      const response = await fetch(`${this.baseURL}/search/${encodeURIComponent(keyword)}${surahParam}/en`)
      const data = await response.json()
      
      if (data.code === 200) {
        return data.data.matches
      }
      throw new Error('Search failed')
    } catch (error) {
      console.error('Error searching ayahs:', error)
      throw error
    }
  }
}

// Export singleton instance
export const quranAPI = new QuranAPI()

// Export the getSurah function for direct use
export const getSurah = (surahNumber: number) => quranAPI.getSurah(surahNumber) 