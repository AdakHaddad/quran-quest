import { Metadata } from "next"

interface SEOProps {
  title?: string
  description?: string
}

export function generateSEOMetadata({ title, description }: SEOProps): Metadata {
  const pageTitle = title || "HifzOS — Qur'an Memorization Operating System"
  const pageDescription =
    description ||
    "Daily Qur'an retention system with blank recall, weak-ayah tracking, review planning, and discipline-driven routines."

  return {
    title: pageTitle,
    description: pageDescription,
    alternates: {
      canonical: "https://quran-quest.vercel.app",
    },
    openGraph: {
      title: pageTitle,
      description: pageDescription,
      url: "https://quran-quest.vercel.app",
      siteName: "HifzOS",
      locale: "en_US",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: pageTitle,
      description: pageDescription,
    },
  }
}
