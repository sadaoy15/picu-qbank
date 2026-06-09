import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PICU MCQ Bank",
  description: "PREP PICU interactive MCQ review sessions",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#f6fbfb] text-slate-900">
        <nav className="bg-white/95 text-slate-900 px-6 py-3 border-b border-teal-100 shadow-sm">
          <div className="max-w-5xl mx-auto flex items-center justify-between">
          <a href="/PICUMCQBANK" className="flex items-center gap-3 hover:text-teal-700 transition-colors">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-700 text-white font-bold">
              <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 5v14" />
                <path d="M5 12h14" />
              </svg>
            </span>
            <span>
              <span className="block text-base font-bold tracking-tight">PICU MCQ Bank</span>
              <span className="block text-xs text-slate-500 font-normal">Clinical review sessions</span>
            </span>
          </a>
          <div className="flex gap-4 text-sm">
            <a href="/PICUMCQBANK" className="flex items-center gap-1.5 text-slate-600 hover:text-teal-700 transition-colors">
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
          </div>
        </nav>
        <main className="max-w-5xl mx-auto px-4 py-8">{children}</main>
      </body>
    </html>
  );
}
