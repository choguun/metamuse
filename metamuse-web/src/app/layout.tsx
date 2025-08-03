import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Web3Providers } from "@/providers/Web3Provider";
import { Navbar } from "@/components/layout/Navbar";
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
  title: "MetaMuse - Verifiable AI Companions",
  description: "Create unique AI companions with verifiable blockchain interactions, persistent memory, and customizable personalities.",
  keywords: ["AI", "blockchain", "NFT", "companions", "Web3", "MetaMuse"],
  authors: [{ name: "MetaMuse Team" }],
  viewport: "width=device-width, initial-scale=1",
  themeColor: "#8B5CF6",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-900 text-white min-h-screen`}
      >
        <Web3Providers>
          <div className="flex flex-col min-h-screen">
            <Navbar />
            <main className="flex-1">
              {children}
            </main>
            <footer className="border-t border-gray-800 py-6 text-center text-sm text-gray-400">
              <p>&copy; 2025 MetaMuse. Building the future of AI companions.</p>
            </footer>
          </div>
        </Web3Providers>
      </body>
    </html>
  );
}
