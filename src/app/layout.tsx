import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Header from "@/components/site/Header";
import Footer from "@/components/site/Footer";
import PrivateBetaBanner from "@/components/site/PrivateBetaBanner";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Private beta: keep the app out of search engines until public launch.
// See also src/app/robots.ts for the crawler-level disallow rule.
export const metadata: Metadata = {
  title: {
    default: "I'm Realtor — Private Beta",
    template: "%s | I'm Realtor",
  },
  description:
    "I'm Realtor is a simple, verified, admin-reviewed real estate marketplace currently in private beta.",
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-white text-slate-900">
        <PrivateBetaBanner />
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
