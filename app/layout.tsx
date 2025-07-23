import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Quran Memorization App - Learn & Memorize All 114 Surahs",
    template: "%s | Quran Memorization App"
  },
  description: "Master Quran memorization with our interactive app featuring all 114 surahs. Practice with fill-in-the-blank, audio exercises, and full surah memorization modes. Free Hifz learning tool.",
  keywords: [
    "Quran memorization",
    "Hifz",
    "Islamic learning",
    "Quran study",
    "Arabic learning",
    "Islamic education",
    "Surah memorization",
    "Quran recitation",
    "Holy Quran",
    "Islamic app",
    "Quran practice",
    "memorize Quran",
    "Quran quiz",
    "Islamic studies"
  ],
  authors: [{ name: "Quran Memorization App" }],
  creator: "Quran Memorization App",
  publisher: "Quran Memorization App",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://quran-memorization.vercel.app'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://quran-memorization.vercel.app',
    siteName: 'Quran Memorization App',
    title: 'Quran Memorization App - Learn & Memorize All 114 Surahs',
    description: 'Master Quran memorization with our interactive app featuring all 114 surahs. Practice with multiple quiz modes and audio recitation.',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Quran Memorization App - Interactive Islamic Learning',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Quran Memorization App - Learn & Memorize All 114 Surahs',
    description: 'Master Quran memorization with our interactive app featuring all 114 surahs. Free Hifz learning tool.',
    images: ['/og-image.jpg'],
    creator: '@QuranMemorization',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'your-google-verification-code',
    yandex: 'your-yandex-verification-code',
    yahoo: 'your-yahoo-verification-code',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" dir="ltr">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
        <meta name="theme-color" content="#059669" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Quran Memorization" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="manifest" href="/site.webmanifest" />
        <link rel="canonical" href="https://quran-memorization.vercel.app" />
        
        {/* Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              "name": "Quran Memorization App",
              "description": "Interactive Quran memorization app with all 114 surahs, multiple quiz modes, and audio recitation",
              "url": "https://quran-memorization.vercel.app",
              "applicationCategory": "EducationalApplication",
              "operatingSystem": "Web",
              "offers": {
                "@type": "Offer",
                "price": "0",
                "priceCurrency": "USD"
              },
              "creator": {
                "@type": "Organization",
                "name": "Quran Memorization App"
              },
              "keywords": "Quran, memorization, Hifz, Islamic education, Arabic learning",
              "inLanguage": ["en", "ar"],
              "featureList": [
                "All 114 Surahs",
                "Multiple Quiz Modes",
                "Audio Recitation",
                "Progress Tracking",
                "Full Surah Memorization",
                "Interactive Learning"
              ]
            })
          }}
        />
        
        {/* Additional Religious Content Schema */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Dataset",
              "name": "Holy Quran - All 114 Surahs",
              "description": "Complete collection of all 114 Surahs from the Holy Quran with Arabic text and English translations",
              "keywords": "Quran, Surahs, Islamic text, Arabic, religion",
              "inLanguage": ["ar", "en"],
              "creator": {
                "@type": "Organization",
                "name": "Quran Memorization App"
              },
              "license": "https://creativecommons.org/licenses/by-sa/4.0/",
              "temporalCoverage": "610/632",
              "spatialCoverage": "Mecca, Medina"
            })
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
