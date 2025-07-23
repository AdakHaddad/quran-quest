import { MetadataRoute } from 'next'
import { SURAHS } from '@/lib/surah-data'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://quran-memorization.vercel.app'
  
  // Static pages
  const staticPages = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 1,
    },
  ]
  
  // Dynamic pages for each surah
  const surahPages = SURAHS.map((surah) => ({
    url: `${baseUrl}/surah/${surah.number}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }))
  
  // Quiz mode pages
  const quizModes = ['fill-blank', 'tap-hear', 'what-next', 'reorder', 'full-surah']
  const quizPages = quizModes.map((mode) => ({
    url: `${baseUrl}/quiz/${mode}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }))
  
  return [
    ...staticPages,
    ...surahPages,
    ...quizPages,
  ]
} 