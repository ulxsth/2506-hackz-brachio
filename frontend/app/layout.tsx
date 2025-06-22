import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { JotaiProvider } from "../components/jotai-provider";
import TerminalWindow from "../components/TerminalWindow";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TYPE 2 DIVE",
  description: "IT用語を使った大規模リアルタイムタイピングゲーム。己の「タイピング力」と「IT知識」で、知識の海底を目指せ───。",
  openGraph: {
    title: "TYPE 2 DIVE",
    description: "己の「タイピング力」と「IT知識」で、知識の海底を目指せ───。",
    images: [
      {
        url: "/thumbnail.png",
        width: 1200,
        height: 630,
        alt: "TYPE 2 DIVE thumbnail",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "TYPE 2 LIVE",
    description: "IT用語を使った大規模リアルタイムタイピングゲーム",
    images: ["/thumbnail.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className={`${geistSans.variable} ${geistMono.variable} w-screen h-screen flex items-center justify-center bg-terminalBg`}>
        <JotaiProvider>
          <div className="w-screen h-screen flex items-center justify-center bg-terminalBg">
            <TerminalWindow>{children}</TerminalWindow>
          </div>
        </JotaiProvider>
      </body>
    </html>
  );
}
