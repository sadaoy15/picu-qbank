import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PICU MCQ Bank",
  description: "PREP PICU interactive MCQ review sessions",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#eef7f8] text-slate-900">
        <nav className="sticky top-0 z-20 border-b border-white/70 bg-white/85 px-4 py-3 shadow-sm shadow-slate-200/60 backdrop-blur-xl sm:px-6">
          <div className="mx-auto flex max-w-6xl items-center justify-between">
            <a href="/PICUMCQBANK" className="flex items-center gap-3 hover:text-teal-700 transition-colors">
              <img src="/PICUMCQBANK/picu-icon.png" alt="PICU MCQ Bank" className="h-11 w-11 rounded-2xl shadow-lg shadow-teal-200" />
              <span>
                <span className="block text-base font-black tracking-tight text-slate-950 sm:text-lg">PICU MCQ Bank</span>
                <span className="block text-xs font-semibold text-slate-500">Pediatric critical care review</span>
              </span>
            </a>
            <a href="/PICUMCQBANK" className="hidden items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-600 shadow-sm hover:border-teal-200 hover:text-teal-700 sm:flex">
              <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 11h6" />
                <path d="M9 15h6" />
                <path d="M10 3h4" />
                <path d="M8 5h8" />
                <rect x="6" y="5" width="12" height="16" rx="2" />
              </svg>
              Sessions
            </a>
          </div>
        </nav>
        <main className="mx-auto max-w-6xl px-4 py-6 sm:py-8">{children}</main>
      </body>
    </html>
  );
}
