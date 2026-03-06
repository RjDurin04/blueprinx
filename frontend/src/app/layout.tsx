import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#FAFAF7",
};

export const metadata: Metadata = {
  title: "Blueprinx — Turn Your Idea into a Clear Plan",
  description:
    "Describe what you want to build. We create a step-by-step plan for your app, including business rules, user states, and technical details.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${jetbrains.variable} font-[family-name:var(--font-inter)] antialiased`}
      >
        <div className="relative min-h-screen min-h-dvh flex flex-col">
          {/* ── Noise texture overlay ── */}
          <div className="noise-texture fixed inset-0 pointer-events-none z-[100]" />

          {/* ── Blueprint grid background ── */}
          <div className="fixed inset-0 blueprint-grid pointer-events-none" />

          {/* ── Ambient gradient orbs (scaled down on mobile) ── */}
          <div className="fixed top-[-20%] right-[-10%] w-[300px] h-[300px] sm:w-[450px] sm:h-[450px] lg:w-[600px] lg:h-[600px] rounded-full bg-[#C8956C]/[0.04] blur-[80px] sm:blur-[100px] lg:blur-[120px] pointer-events-none" />
          <div className="fixed bottom-[-10%] left-[-5%] w-[250px] h-[250px] sm:w-[350px] sm:h-[350px] lg:w-[500px] lg:h-[500px] rounded-full bg-[#6B8F71]/[0.04] blur-[60px] sm:blur-[80px] lg:blur-[100px] pointer-events-none" />

          {/* ── Header ── */}
          <header className="relative z-10 w-full py-4 sm:py-6 px-4 sm:px-8 md:px-16 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 sm:gap-3 shrink-0">
              <div
                className="w-6 h-6 sm:w-7 sm:h-7 bg-[#0C0C1D] flex items-center justify-center"
                style={{ clipPath: "polygon(50% 0%, 100% 100%, 0% 100%)" }}
              >
                <span className="text-[#FAFAF7] text-[7px] sm:text-[8px] font-black mt-1">
                  B
                </span>
              </div>
              <span className="text-[11px] sm:text-[13px] font-bold uppercase tracking-[0.2em] text-[#0C0C1D]">
                Blueprinx
              </span>
            </Link>

          </header>

          {/* ── Main Content ── */}
          <main className="relative z-20 w-full flex-grow flex flex-col items-center pb-16 sm:pb-24 lg:pb-32">
            {children}
          </main>

          {/* ── Footer ── */}
          <footer className="relative z-10 w-full border-t border-[#E8E4E0] py-6 sm:py-8 px-4 sm:px-8 md:px-16 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-0">
            <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.15em] text-[#A0A0A8]">
              © {new Date().getFullYear()} Blueprinx
            </p>
            <div className="flex items-center gap-4 sm:gap-6">
              <a
                href="#"
                className="text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.15em] text-[#A0A0A8] hover:text-[#0C0C1D] transition-colors duration-[var(--duration-normal)]"
              >
                Privacy
              </a>
              <a
                href="#"
                className="text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.15em] text-[#A0A0A8] hover:text-[#0C0C1D] transition-colors duration-[var(--duration-normal)]"
              >
                Terms
              </a>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
