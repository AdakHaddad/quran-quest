import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: {
    default: "HifzOS — Qur'an Memorization Operating System",
    template: "%s | HifzOS",
  },
  description:
    "HifzOS helps you stop forgetting Qur'an with daily mission planning, blank recall, weak-ayah repair, repeat-to-hear, and review priority scheduling.",
  keywords: [
    "HifzOS",
    "Quran memorization",
    "Hifz",
    "Blank recall",
    "Weak ayah tracker",
    "Daily review planner",
    "Islamic learning",
  ],
  authors: [{ name: "HifzOS" }],
  creator: "HifzOS",
  publisher: "HifzOS",
  metadataBase: new URL("https://quran-quest.vercel.app"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    url: "https://quran-quest.vercel.app",
    siteName: "HifzOS",
    title: "HifzOS — Qur'an Memorization Operating System",
    description:
      "A practical daily system for retention: alarm recall, review priority, weak-ayah repair, and consistency loops.",
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  )
}
