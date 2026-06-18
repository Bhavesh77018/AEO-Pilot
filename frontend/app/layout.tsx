import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "AEO Pilot — Make your startup discoverable by AI",
  description:
    "Answer Engine Optimization for the AI era. Audit, score, and grow your brand's visibility inside ChatGPT, Gemini, Claude, Perplexity, Copilot and more — with an autonomous agent fleet.",
  openGraph: {
    title: "AEO Pilot — Make your startup discoverable by AI",
    description:
      "The HubSpot / Ahrefs for AI Search. Audit, score, and grow your visibility across every answer engine.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen font-sans antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
