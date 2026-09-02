import type { Metadata } from "next";
import { Space_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import "./globals.css";

/* One face for the whole site. Space Mono ships 400 and 700 only, so the
   300s and 600s scattered through the CSS resolve to 400 and 700 — the
   hierarchy now comes from size, case and color rather than weight. */
const spaceMono = Space_Mono({
  variable: "--font-space-mono",
  subsets: ["latin"],
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  title: "enrinjr",
  description:
    "A personal portfolio website showcasing my experience, projects, and skills as a software engineer.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={spaceMono.variable}>
      <body suppressHydrationWarning>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
