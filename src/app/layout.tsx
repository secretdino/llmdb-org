import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";
import { SessionProvider } from "@/components/session-provider";
import { I18nProvider } from "@/components/i18n-provider";

// Load Inter font for technical stats and timing logs
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  weight: ["300", "400", "500", "600", "700", "800"],
});

// Load Outfit font for dashboard headings and performance numbers
const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  weight: ["400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "LLMDB — Community Inference Benchmarks Database",
  description: "A community-contributed database capturing exact tokens/sec throughput, hardware configurations, and optimization secrets across diverse runtimes.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body
        className={`${inter.variable} ${outfit.variable} font-sans antialiased bg-surface-0 text-zinc-100 min-h-screen flex flex-col`}
      >
        <I18nProvider>
          <SessionProvider>
            {children}
          </SessionProvider>
        </I18nProvider>
      </body>
    </html>
  );
}

