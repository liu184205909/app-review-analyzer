import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import "@/polyfills"; // Import server-side polyfills
import "@/lib/node-shims"; // Import Node.js shims for browser globals
import PerformanceMonitor from "@/components/optimizations/PerformanceMonitor";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "ReviewInsight - AI-Powered App Review Analysis",
  description: "Analyze app reviews from iOS and Android to uncover user needs and discover opportunities from competitor feedback",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {children}
        <PerformanceMonitor />
      </body>
    </html>
  );
}

