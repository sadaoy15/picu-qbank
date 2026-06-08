import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PICU Question Bank",
  description: "PICU Final 2026 — Interactive Question Bank",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-900">
        <nav className="bg-blue-900 text-white px-6 py-3 flex items-center justify-between shadow-md">
          <a href="/" className="text-lg font-bold tracking-tight hover:text-blue-200 transition-colors">
            PICU Question Bank
          </a>
          <div className="flex gap-4 text-sm">
            <a href="/" className="hover:text-blue-200 transition-colors">Quiz</a>
          </div>
        </nav>
        <main className="max-w-3xl mx-auto px-4 py-8">{children}</main>
      </body>
    </html>
  );
}
