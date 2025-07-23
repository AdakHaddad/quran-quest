import { Metadata } from 'next'
import { SurahInfo } from '@/lib/surah-data'

interface SEOProps {
  surah?: SurahInfo
  mode?: string
  title?: string
  description?: string
}

export function generateSEOMetadata({ surah, mode, title, description }: SEOProps): Metadata {
  const baseUrl = 'https://quran-memorization.vercel.app'
  
  // Generate dynamic content based on surah
  let pageTitle = title || 'Quran Memorization App - Learn & Memorize All 114 Surahs'
  let pageDescription = description || 'Master Quran memorization with our interactive app featuring all 114 surahs.'
  
  if (surah) {
    pageTitle = `${surah.englishName} (${surah.name}) - Surah ${surah.number} | Quran Memorization`
    pageDescription = `Learn and memorize Surah ${surah.englishName} (${surah.englishNameTranslation}) - ${surah.numberOfAyahs} verses from the ${surah.revelationType} period. Interactive Quran memorization with audio and quiz modes.`
  }
  
  if (mode) {
    const modeNames: Record<string, string> = {
      'fill-blank': 'Fill in the Blank Quiz',
      'tap-hear': 'Tap What You Hear Exercise',
      'what-next': 'What Comes Next Quiz',
      'reorder': 'Word Reordering Exercise',
      'full-surah': 'Full Surah Memorization'
    }
    
    if (modeNames[mode]) {
      pageTitle = `${modeNames[mode]} - Quran Memorization App`
      pageDescription = `Practice Quran memorization with ${modeNames[mode].toLowerCase()}. Interactive learning for all 114 surahs.`
    }
  }
  
  const canonical = surah 
    ? `${baseUrl}/surah/${surah.number}`
    : mode 
    ? `${baseUrl}/quiz/${mode}`
    : baseUrl
  
  return {
    title: pageTitle,
    description: pageDescription,
    alternates: {
      canonical,
    },
    openGraph: {
      title: pageTitle,
      description: pageDescription,
      url: canonical,
      siteName: 'Quran Memorization App',
      locale: 'en_US',
      type: 'website',
      images: [
        {
          url: surah ? `/og-surah-${surah.number}.jpg` : '/og-image.jpg',
          width: 1200,
          height: 630,
          alt: pageTitle,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: pageTitle,
      description: pageDescription,
      images: [surah ? `/og-surah-${surah.number}.jpg` : '/og-image.jpg'],
    },
    keywords: surah ? [
      `Surah ${surah.englishName}`,
      surah.englishNameTranslation,
      `Quran ${surah.number}`,
      `${surah.revelationType} surah`,
      'Quran memorization',
      'Hifz',
      'Islamic learning',
      'Arabic text',
      'Quran recitation'
    ] : undefined,
  }
}

// Structured data for surah pages
export function generateSurahStructuredData(surah: SurahInfo) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: `Surah ${surah.englishName} (${surah.name})`,
    description: `Learn and memorize Surah ${surah.englishName} - ${surah.englishNameTranslation}`,
    author: {
      '@type': 'Organization',
      name: 'Quran Memorization App'
    },
    publisher: {
      '@type': 'Organization',
      name: 'Quran Memorization App'
    },
    inLanguage: ['ar', 'en'],
    about: {
      '@type': 'Thing',
      name: 'Holy Quran',
      description: 'The central religious text of Islam'
    },
    isPartOf: {
      '@type': 'Book',
      name: 'Holy Quran',
      author: 'Allah',
      inLanguage: 'ar',
      numberOfPages: 604,
      bookFormat: 'https://schema.org/EBook'
    },
    position: surah.number,
    wordCount: surah.numberOfAyahs,
    spatialCoverage: surah.revelationType === 'Meccan' ? 'Mecca' : 'Medina',
    keywords: [
      surah.englishName,
      surah.englishNameTranslation,
      'Quran',
      'Surah',
      'Islamic text',
      surah.revelationType
    ]
  }
} 