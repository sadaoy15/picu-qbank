"use client";

import { useState, useEffect, useCallback } from "react";
import { questions as builtInQuestions } from "@/data/questions";
import { Question } from "@/types/question";

const STORAGE_KEY = "picu_custom_questions";
const SESSIONS_KEY = "picu_sessions";
const DEVICE_MODE_KEY = "picu_device_mode";

type AnswerState = "unanswered" | "correct" | "incorrect";
type QuizMode = "sequential" | "random";
type ViewMode = "study" | "test";
type DeviceMode = "phone" | "computer";

interface Progress {
  [questionId: number]: { selected: string; state: AnswerState };
}

interface QuizSession {
  id: string;
  title: string;
  examId: string;
  examLabel: string;
  subCat: string;
  quizMode: QuizMode;
  viewMode: ViewMode;
  questionIds: number[];
  currentIndex: number;
  progress: Progress;
  status: "active" | "paused" | "completed";
  createdAt: string;
  updatedAt: string;
}

interface ExamGroup {
  id: string;
  label: string;
  description: string;
  accent: string;
  match: (q: Question) => boolean;
  subCategoryPrefix?: string;
}

const prepExamGroups: ExamGroup[] = [
  {
    id: "prep-picu-2019",
    label: "PREP PICU 2019",
    description: "Monthly cases Jan–Dec 2019",
    accent: "emerald",
    match: (q) => q.category.startsWith("PREP PICU 2019"),
    subCategoryPrefix: "PREP PICU 2019",
  },
  {
    id: "prep-picu-2020",
    label: "PREP PICU 2020",
    description: "Monthly cases Jan–Dec 2020",
    accent: "emerald",
    match: (q) => q.category.startsWith("PREP PICU 2020"),
    subCategoryPrefix: "PREP PICU 2020",
  },
  {
    id: "prep-picu-2021",
    label: "PREP PICU 2021",
    description: "Monthly cases Jan–Dec 2021",
    accent: "emerald",
    match: (q) => q.category.startsWith("PREP PICU 2021"),
    subCategoryPrefix: "PREP PICU 2021",
  },
  {
    id: "prep-icu-2022",
    label: "PREP ICU 2022",
    description: "Monthly cases Jan–Dec 2022",
    accent: "emerald",
    match: (q) => q.category.startsWith("PREP ICU 2022"),
    subCategoryPrefix: "PREP ICU 2022",
  },
  {
    id: "prep-icu-2023",
    label: "PREP ICU 2023",
    description: "Monthly cases Jan–Dec 2023",
    accent: "emerald",
    match: (q) => q.category.startsWith("PREP ICU 2023"),
    subCategoryPrefix: "PREP ICU 2023",
  },
  {
    id: "prep-icu-2024",
    label: "PREP ICU 2024",
    description: "Monthly cases Jan–Dec 2024",
    accent: "emerald",
    match: (q) => q.category.startsWith("PREP ICU 2024"),
    subCategoryPrefix: "PREP ICU 2024",
  },
  {
    id: "prep-2025",
    label: "PREP 2025",
    description: "Monthly cases Jan–Dec 2025",
    accent: "emerald",
    match: (q) => q.category === "PREP 2025",
  },
];

const specialExamGroups: ExamGroup[] = [
  {
    id: "study-prep",
    label: "Study All PREP",
    description: "All PREP questions combined (2019–2025)",
    accent: "violet",
    match: (q) => q.category.startsWith("PREP"),
  },
];

const examGroups: ExamGroup[] = [...prepExamGroups, ...specialExamGroups];

const accentClasses: Record<string, { card: string; badge: string; btn: string; ring: string }> = {
  blue: {
    card: "border-slate-200 hover:border-teal-300 hover:bg-teal-50/60",
    badge: "bg-teal-50 text-teal-700 border border-teal-100",
    btn: "bg-teal-700 hover:bg-teal-800",
    ring: "ring-teal-500",
  },
  indigo: {
    card: "border-slate-200 hover:border-cyan-300 hover:bg-cyan-50/60",
    badge: "bg-cyan-50 text-cyan-700 border border-cyan-100",
    btn: "bg-teal-700 hover:bg-teal-800",
    ring: "ring-cyan-500",
  },
  emerald: {
    card: "border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/60",
    badge: "bg-emerald-50 text-emerald-700 border border-emerald-100",
    btn: "bg-teal-700 hover:bg-teal-800",
    ring: "ring-emerald-500",
  },
  violet: {
    card: "border-slate-200 hover:border-teal-300 hover:bg-teal-50/60",
    badge: "bg-teal-50 text-teal-700 border border-teal-100",
    btn: "bg-teal-700 hover:bg-teal-800",
    ring: "ring-teal-500",
  },
  slate: {
    card: "border-slate-200 hover:border-teal-300 hover:bg-slate-50",
    badge: "bg-slate-50 text-slate-600 border border-slate-200",
    btn: "bg-slate-700 hover:bg-slate-800",
    ring: "ring-slate-500",
  },
};

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function MedicalIcon({
  name,
  className = "h-5 w-5",
}: {
  name: "heart" | "clipboard" | "stethoscope" | "book" | "timer" | "vial";
  className?: string;
}) {
  const common = {
    className,
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    viewBox: "0 0 24 24",
    "aria-hidden": true,
  };
  if (name === "heart") return (
    <svg {...common}>
      <path d="M19 14c1.5-1.4 2-3.9.8-5.8-1.3-2.1-4.2-2.5-6-1L12 8.8l-1.8-1.6c-1.8-1.5-4.7-1.1-6 1C3 10.1 3.5 12.6 5 14l7 6 7-6Z" />
      <path d="M3 13h4l2-4 3 8 2-4h7" />
    </svg>
  );
  if (name === "stethoscope") return (
    <svg {...common}>
      <path d="M6 3v5a4 4 0 0 0 8 0V3" /><path d="M6 3H4" /><path d="M14 3h2" />
      <path d="M10 12v2a5 5 0 0 0 10 0v-1" /><circle cx="20" cy="10" r="2" />
    </svg>
  );
  if (name === "book") return (
    <svg {...common}>
      <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21.5v-16Z" />
      <path d="M4 19a2.5 2.5 0 0 1 2.5-2H20" /><path d="M9 7h6" />
    </svg>
  );
  if (name === "timer") return (
    <svg {...common}>
      <circle cx="12" cy="13" r="7" /><path d="M12 13V9" /><path d="M12 13h3" /><path d="M9 2h6" />
    </svg>
  );
  if (name === "vial") return (
    <svg {...common}>
      <path d="M10 2h4" />
      <path d="M11 2v6l-5.5 9.5A3 3 0 0 0 8.1 22h7.8a3 3 0 0 0 2.6-4.5L13 8V2" />
      <path d="M8 16h8" />
    </svg>
  );
  return (
    <svg {...common}>
      <path d="M9 11h6" /><path d="M9 15h6" /><path d="M10 3h4" /><path d="M8 5h8" />
      <rect x="6" y="5" width="12" height="16" rx="2" />
    </svg>
  );
}

function iconForExam(exam: ExamGroup): "heart" | "clipboard" | "book" | "stethoscope" {
  if (exam.id.includes("final")) return "stethoscope";
  if (exam.id.includes("promo")) return "heart";
  if (exam.id.includes("prep")) return "book";
  return "clipboard";
}

function ModeVisualIcon({ type, small = false }: { type: "books" | "stopwatch"; small?: boolean }) {
  const sz = small ? "h-12 w-12" : "h-20 w-20";
  if (type === "books") {
    return (
      <svg viewBox="0 0 96 96" aria-hidden="true" className={`${sz} drop-shadow-md`}>
        <path d="M20 58 67 45l10 8-47 13-10-8Z" fill="#1d4ed8" />
        <path d="M30 66 77 53v12L30 78V66Z" fill="#ffffff" />
        <path d="M20 58v12l10 8V66l-10-8Z" fill="#1e3a8a" />
        <path d="M24 42 71 29l10 8-47 13-10-8Z" fill="#ef4444" />
        <path d="M34 50 81 37v12L34 62V50Z" fill="#fff7ed" />
        <path d="M24 42v12l10 8V50l-10-8Z" fill="#b91c1c" />
        <path d="M18 28 65 15l13 9-47 13-13-9Z" fill="#65c75a" />
        <path d="M31 37 78 24v14L31 51V37Z" fill="#3fa13a" />
        <path d="M18 28v13l13 10V37L18 28Z" fill="#16803a" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 96 96" aria-hidden="true" className={`${sz} drop-shadow-md`}>
      <circle cx="48" cy="52" r="31" fill="#f8fafc" stroke="#64748b" strokeWidth="5" />
      <circle cx="48" cy="52" r="24" fill="#ffffff" stroke="#cbd5e1" strokeWidth="2" />
      <path d="M39 9h18v10H39z" fill="#94a3b8" stroke="#475569" strokeWidth="3" />
      <path d="M63 18 75 30" stroke="#475569" strokeWidth="6" strokeLinecap="round" />
      <path d="M33 18 21 30" stroke="#475569" strokeWidth="6" strokeLinecap="round" />
      <path d="M48 52V30" stroke="#ef4444" strokeWidth="5" strokeLinecap="round" />
      <path d="M48 52h17" stroke="#0f766e" strokeWidth="5" strokeLinecap="round" />
      <circle cx="48" cy="52" r="4" fill="#1e293b" />
      {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((angle) => (
        <line
          key={angle}
          x1={48 + Math.sin((angle * Math.PI) / 180) * 19}
          y1={52 - Math.cos((angle * Math.PI) / 180) * 19}
          x2={48 + Math.sin((angle * Math.PI) / 180) * 22}
          y2={52 - Math.cos((angle * Math.PI) / 180) * 22}
          stroke="#64748b" strokeWidth="2" strokeLinecap="round"
        />
      ))}
    </svg>
  );
}

// ── Device mode selector screen ──────────────────────────────────────────────
function DeviceModeScreen({ onSelect }: { onSelect: (m: DeviceMode) => void }) {
  return (
    <div className="flex min-h-[75vh] flex-col items-center justify-center py-12">
      <div className="w-full max-w-2xl px-4">
        <div className="mb-10 text-center">
          <div className="mb-5 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-teal-700 text-white">
            <svg viewBox="0 0 24 24" className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 5v14" /><path d="M5 12h14" />
            </svg>
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900">PICU MCQ Bank</h1>
          <p className="mt-3 text-lg text-slate-500">Choose your display mode to get started</p>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          {/* Phone / iPad */}
          <button
            onClick={() => onSelect("phone")}
            className="group relative overflow-hidden rounded-3xl border-2 border-slate-200 bg-white p-8 text-left shadow-xl shadow-slate-200/60 transition-all hover:border-teal-400 hover:shadow-2xl hover:shadow-teal-100/60 active:scale-[0.98]"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-white to-teal-50/60 opacity-0 transition-opacity group-hover:opacity-100" />
            <div className="relative">
              <div className="mb-5 flex items-center gap-3">
                <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-100 text-teal-700">
                  <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <rect x="5" y="2" width="14" height="20" rx="2" />
                    <line x1="12" y1="18" x2="12.01" y2="18" />
                  </svg>
                </span>
                <span className="rounded-full bg-teal-100 px-3 py-1 text-sm font-semibold text-teal-700">Touch friendly</span>
              </div>
              <h2 className="text-2xl font-extrabold text-slate-900">Phone / iPad</h2>
              <p className="mt-2 text-base text-slate-500 leading-relaxed">Large text, big tap targets, and a bold layout built for mobile and tablet.</p>
              <div className="mt-6 inline-flex items-center gap-2 text-lg font-bold text-teal-700 transition-all group-hover:gap-3">
                Select <span>→</span>
              </div>
            </div>
          </button>

          {/* Computer */}
          <button
            onClick={() => onSelect("computer")}
            className="group relative overflow-hidden rounded-3xl border-2 border-slate-200 bg-white p-8 text-left shadow-xl shadow-slate-200/60 transition-all hover:border-blue-400 hover:shadow-2xl hover:shadow-blue-100/60 active:scale-[0.98]"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-white to-blue-50/60 opacity-0 transition-opacity group-hover:opacity-100" />
            <div className="relative">
              <div className="mb-5 flex items-center gap-3">
                <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-100 text-blue-700">
                  <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <rect x="2" y="3" width="20" height="14" rx="2" />
                    <path d="M8 21h8" /><path d="M12 17v4" />
                  </svg>
                </span>
                <span className="rounded-full bg-blue-100 px-3 py-1 text-sm font-semibold text-blue-700">Desktop optimized</span>
              </div>
              <h2 className="text-2xl font-extrabold text-slate-900">Computer</h2>
              <p className="mt-2 text-base text-slate-500 leading-relaxed">Compact layout with smaller text — see more content on screen at once.</p>
              <div className="mt-6 inline-flex items-center gap-2 text-lg font-bold text-blue-700 transition-all group-hover:gap-3">
                Select <span>→</span>
              </div>
            </div>
          </button>
        </div>

        <p className="mt-8 text-center text-sm text-slate-400">You can switch modes at any time from the home screen.</p>
      </div>
    </div>
  );
}

// ── Style tokens ─────────────────────────────────────────────────────────────
function makeStyles(isPhone: boolean) {
  return {
    // Quiz wrapper card
    quizWrap: isPhone
      ? "-mx-4 overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-2xl shadow-slate-200/70 sm:mx-0"
      : "overflow-hidden rounded-xl border border-slate-200 bg-white shadow-md",
    // Header section
    headerPad: isPhone ? "bg-slate-50 px-5 py-6 sm:px-8" : "bg-slate-50 px-4 py-3 sm:px-5",
    // Pause/back button
    backBtn: isPhone
      ? "mb-5 inline-flex items-center gap-3 rounded-full bg-white px-7 py-4 text-2xl font-bold text-slate-700 shadow-xl shadow-slate-200 hover:text-slate-950"
      : "mb-3 inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:text-slate-950",
    examTitle: isPhone
      ? "text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl"
      : "text-lg font-bold tracking-tight text-slate-900",
    questionMeta: isPhone
      ? "mt-5 text-2xl font-bold text-slate-500"
      : "mt-1 text-sm font-medium text-slate-500",
    questionBadge: isPhone
      ? "rounded-full bg-blue-100 px-6 py-3 text-2xl font-extrabold text-blue-600"
      : "rounded-lg bg-blue-100 px-3 py-1.5 text-sm font-bold text-blue-600",
    // Tab bar
    tabBtn: isPhone ? "py-5 text-4xl" : "py-2.5 text-xl",
    // Question body
    questionBodyPad: isPhone ? "relative px-5 py-8 sm:px-8" : "relative px-4 py-5 sm:px-6",
    questionText: isPhone
      ? "mb-8 text-3xl font-extrabold leading-snug tracking-tight text-slate-900 sm:text-4xl"
      : "mb-4 text-base font-semibold leading-snug text-slate-900",
    // Answer choices
    choiceSpace: isPhone ? "space-y-5" : "space-y-2",
    choiceBase: isPhone
      ? "w-full text-left rounded-[22px] border-2 px-5 py-5 text-xl font-bold leading-relaxed text-slate-700 shadow-md shadow-slate-200/70 transition-all cursor-pointer flex items-center gap-5 "
      : "w-full text-left rounded-xl border px-4 py-2.5 text-sm font-medium leading-snug text-slate-700 shadow-sm transition-all cursor-pointer flex items-center gap-3 ",
    choiceLetterBase: isPhone
      ? "flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full text-base font-extrabold "
      : "flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold ",
    // Action buttons
    submitBtn: isPhone
      ? "mt-8 w-full rounded-[22px] bg-gradient-to-r from-blue-500 to-violet-600 py-5 text-3xl font-extrabold text-white shadow-lg shadow-blue-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      : "mt-4 w-full rounded-xl bg-gradient-to-r from-blue-500 to-violet-600 py-2.5 text-base font-bold text-white shadow-md transition-colors disabled:opacity-40 disabled:cursor-not-allowed",
    navGrid: isPhone ? "mt-6 grid grid-cols-2 gap-3" : "mt-3 grid grid-cols-2 gap-2",
    prevBtn: isPhone
      ? "rounded-[22px] bg-slate-100 py-4 text-xl font-extrabold text-slate-500 hover:bg-slate-200 transition-colors"
      : "rounded-xl bg-slate-100 py-2.5 text-sm font-semibold text-slate-500 hover:bg-slate-200 transition-colors",
    nextBtn: isPhone
      ? "rounded-[22px] bg-gradient-to-r from-blue-500 to-violet-600 py-4 text-xl font-extrabold text-white transition-colors"
      : "rounded-xl bg-gradient-to-r from-blue-500 to-violet-600 py-2.5 text-sm font-semibold text-white transition-colors",
    // Progress counter
    progressWrap: isPhone ? "mt-8 flex items-center justify-center" : "mt-4 flex items-center justify-center",
    progressPill: isPhone
      ? "rounded-full bg-white px-8 py-4 text-2xl font-extrabold text-slate-700 shadow-xl shadow-slate-200"
      : "rounded-full bg-white px-5 py-2 text-sm font-bold text-slate-700 shadow-md",
    progressDot: isPhone
      ? "mr-3 inline-block h-3 w-3 rounded-full bg-gradient-to-r from-blue-500 to-violet-600"
      : "mr-2 inline-block h-2 w-2 rounded-full bg-gradient-to-r from-blue-500 to-violet-600",
    scoreBubble: isPhone
      ? "absolute bottom-24 right-4 hidden h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-violet-600 text-center text-sm font-extrabold text-white shadow-xl sm:flex"
      : "absolute bottom-16 right-3 hidden h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-violet-600 text-center text-xs font-bold text-white shadow-lg sm:flex",
    // Explanation
    explanationBox: (correct: boolean) =>
      (isPhone
        ? "mt-8 rounded-[22px] border-2 p-5 text-base space-y-2 "
        : "mt-4 rounded-xl border p-4 text-sm space-y-2 ") +
      (correct ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"),
    // Home screen
    homeModeGrid: isPhone ? "space-y-5" : "grid grid-cols-2 gap-4",
    modeCardPad: isPhone ? "p-6 sm:p-8" : "p-5",
    modeCardMinH: isPhone ? "min-h-[330px]" : "min-h-[220px]",
    modeAvailBadge: isPhone
      ? "rounded-full bg-green-100 px-5 py-2.5 text-xl font-extrabold text-green-500 sm:px-7 sm:py-3 sm:text-2xl"
      : "rounded-full bg-green-100 px-3 py-1.5 text-sm font-semibold text-green-600",
    modeHeading: isPhone
      ? "text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl"
      : "text-2xl font-bold tracking-tight text-slate-900",
    modeDesc: isPhone
      ? "mx-auto mt-6 max-w-2xl text-xl font-semibold leading-relaxed text-slate-600 sm:text-2xl"
      : "mt-3 text-sm leading-relaxed text-slate-600",
    modeStartPractice: isPhone
      ? "relative mt-8 inline-flex items-center gap-4 text-2xl font-extrabold text-blue-600 hover:text-blue-700 transition-colors sm:text-3xl"
      : "relative mt-5 inline-flex items-center gap-2 text-base font-bold text-blue-600 hover:text-blue-700 transition-colors",
    modeStartTest: isPhone
      ? "relative mt-8 inline-flex items-center gap-4 text-2xl font-extrabold text-red-600 hover:text-red-700 transition-colors sm:text-3xl"
      : "relative mt-5 inline-flex items-center gap-2 text-base font-bold text-red-600 hover:text-red-700 transition-colors",
    modeArrow: isPhone ? "text-4xl leading-none" : "text-2xl leading-none",
    examGridCols: isPhone ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-2 lg:grid-cols-3",
    sectionHeading: "text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3",
    switchBtn: isPhone
      ? "inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-sm hover:border-teal-300 hover:text-teal-700 transition-colors"
      : "inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 shadow-sm hover:border-teal-300 hover:text-teal-700 transition-colors",
  };
}

// ── Main component ────────────────────────────────────────────────────────────
export default function QuizPage() {
  const [allQuestions, setAllQuestions] = useState<Question[]>(builtInQuestions);
  const [selectedExam, setSelectedExam] = useState<ExamGroup | null>(null);
  const [activeSubCat, setActiveSubCat] = useState<string>("all");
  const [quizQuestions, setQuizQuestions] = useState<Question[]>([]);
  const [current, setCurrent] = useState(0);
  const [progress, setProgress] = useState<Progress>({});
  const [sessions, setSessions] = useState<QuizSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [quizMode, setQuizMode] = useState<QuizMode>("sequential");
  const [viewMode, setViewMode] = useState<ViewMode>("study");
  const [pendingMode, setPendingMode] = useState<ViewMode | null>(null);
  const [showSummary, setShowSummary] = useState(false);
  const [deviceMode, setDeviceMode] = useState<DeviceMode | null>(null);
  const [deviceModeLoaded, setDeviceModeLoaded] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const custom: Question[] = JSON.parse(stored);
        setAllQuestions([...builtInQuestions, ...custom]);
      } catch {}
    }
    const savedSessions = localStorage.getItem(SESSIONS_KEY);
    if (savedSessions) {
      try { setSessions(JSON.parse(savedSessions)); } catch {}
    }
    const savedMode = localStorage.getItem(DEVICE_MODE_KEY) as DeviceMode | null;
    setDeviceMode(savedMode);
    setDeviceModeLoaded(true);
  }, []);

  const handleSetDeviceMode = (mode: DeviceMode) => {
    setDeviceMode(mode);
    localStorage.setItem(DEVICE_MODE_KEY, mode);
  };

  const s = makeStyles((deviceMode ?? "phone") === "phone");

  const loadQuiz = useCallback((questions: Question[], randomize: boolean) => {
    const ordered = randomize ? shuffle(questions) : [...questions];
    setQuizQuestions(ordered);
    setCurrent(0);
    setSelected(null);
    setRevealed(false);
    setShowSummary(false);
  }, []);

  const getExamQuestions = useCallback(
    (exam: ExamGroup, subCat: string, qs: Question[]) => {
      let filtered = qs.filter(exam.match);
      if (subCat !== "all" && exam.subCategoryPrefix) {
        filtered = filtered.filter((q) => q.category === subCat);
      }
      return filtered;
    },
    []
  );

  useEffect(() => {
    if (selectedExam && allQuestions.length > 0 && !activeSessionId) {
      loadQuiz(getExamQuestions(selectedExam, activeSubCat, allQuestions), quizMode === "random");
    }
  }, [selectedExam, activeSubCat, allQuestions, activeSessionId]); // eslint-disable-line react-hooks/exhaustive-deps

  const saveSessions = (updated: QuizSession[]) => {
    setSessions(updated);
    localStorage.setItem(SESSIONS_KEY, JSON.stringify(updated));
  };

  const updateActiveSession = (patch: Partial<QuizSession>) => {
    if (!activeSessionId) return;
    const updated = sessions.map((session) =>
      session.id === activeSessionId
        ? { ...session, ...patch, updatedAt: new Date().toISOString() }
        : session
    );
    saveSessions(updated);
  };

  const handleSelect = (letter: string) => {
    if (revealed) return;
    setSelected(letter);
  };

  const handleSubmit = () => {
    if (!selected || !quizQuestions[current]) return;
    const q = quizQuestions[current];
    const state: AnswerState = selected === q.correctAnswer ? "correct" : "incorrect";
    const updatedProgress = { ...progress, [q.id]: { selected, state } };
    setProgress(updatedProgress);
    updateActiveSession({ progress: updatedProgress });
    setRevealed(true);
  };

  const handleNext = () => {
    if (current + 1 >= quizQuestions.length) {
      updateActiveSession({ currentIndex: current, status: "completed" });
      setShowSummary(true);
    } else {
      const next = current + 1;
      const nextQ = quizQuestions[next];
      const prev = progress[nextQ.id];
      setCurrent(next);
      updateActiveSession({ currentIndex: next });
      setSelected(prev?.selected ?? null);
      setRevealed(!!prev);
    }
  };

  const handlePrev = () => {
    if (current === 0) return;
    const prev = current - 1;
    const prevQ = quizQuestions[prev];
    const saved = progress[prevQ.id];
    setCurrent(prev);
    updateActiveSession({ currentIndex: prev });
    setSelected(saved?.selected ?? null);
    setRevealed(!!saved);
  };

  const handleJump = (idx: number) => {
    const q = quizQuestions[idx];
    const saved = progress[q.id];
    setCurrent(idx);
    updateActiveSession({ currentIndex: idx });
    setSelected(saved?.selected ?? null);
    setRevealed(!!saved);
    setShowSummary(false);
  };

  const resetProgress = () => {
    setProgress({});
    updateActiveSession({ progress: {}, currentIndex: 0, status: "active" });
    if (selectedExam) {
      const ordered = quizMode === "random"
        ? shuffle(getExamQuestions(selectedExam, activeSubCat, allQuestions))
        : getExamQuestions(selectedExam, activeSubCat, allQuestions);
      setQuizQuestions(ordered);
      setCurrent(0);
      setSelected(null);
      setRevealed(false);
      setShowSummary(false);
      updateActiveSession({ questionIds: ordered.map((q) => q.id) });
    }
  };

  const toggleQuizMode = () => {
    const next: QuizMode = quizMode === "sequential" ? "random" : "sequential";
    setQuizMode(next);
    if (selectedExam) {
      const ordered = next === "random"
        ? shuffle(getExamQuestions(selectedExam, activeSubCat, allQuestions))
        : getExamQuestions(selectedExam, activeSubCat, allQuestions);
      setQuizQuestions(ordered);
      setCurrent(0);
      setSelected(null);
      setRevealed(false);
      setShowSummary(false);
      updateActiveSession({ quizMode: next, questionIds: ordered.map((q) => q.id), currentIndex: 0 });
    }
  };

  const handleSelectExam = (
    exam: ExamGroup,
    preferredViewMode: ViewMode = pendingMode ?? viewMode,
    preferredQuizMode: QuizMode = quizMode
  ) => {
    const questions = getExamQuestions(exam, "all", allQuestions);
    const ordered = preferredQuizMode === "random" ? shuffle(questions) : questions;
    const now = new Date().toISOString();
    const session: QuizSession = {
      id: `session-${Date.now()}`,
      title: `${exam.label} session`,
      examId: exam.id,
      examLabel: exam.label,
      subCat: "all",
      quizMode: preferredQuizMode,
      viewMode: preferredViewMode,
      questionIds: ordered.map((q) => q.id),
      currentIndex: 0,
      progress: {},
      status: "active",
      createdAt: now,
      updatedAt: now,
    };
    saveSessions([session, ...sessions]);
    setActiveSessionId(session.id);
    setSelectedExam(exam);
    setActiveSubCat("all");
    setQuizMode(preferredQuizMode);
    setViewMode(preferredViewMode);
    setQuizQuestions(ordered);
    setCurrent(0);
    setProgress({});
    setSelected(null);
    setRevealed(false);
    setShowSummary(false);
  };

  const handleStartAllPrep = (nextViewMode: ViewMode) => {
    setPendingMode(nextViewMode);
    setViewMode(nextViewMode);
  };

  const handleResumeSession = (session: QuizSession) => {
    const exam = examGroups.find((g) => g.id === session.examId);
    if (!exam) return;
    const byId = new Map(allQuestions.map((q) => [q.id, q]));
    let ordered = session.questionIds.map((id) => byId.get(id)).filter(Boolean) as Question[];
    if (ordered.length === 0) ordered = getExamQuestions(exam, session.subCat, allQuestions);
    const safeIndex = Math.min(session.currentIndex, Math.max(ordered.length - 1, 0));
    const q = ordered[safeIndex];
    const saved = q ? session.progress[q.id] : undefined;
    setActiveSessionId(session.id);
    setSelectedExam(exam);
    setActiveSubCat(session.subCat);
    setQuizMode(session.quizMode);
    setViewMode(session.viewMode);
    setQuizQuestions(ordered);
    setCurrent(safeIndex);
    setProgress(session.progress);
    setSelected(saved?.selected ?? null);
    setRevealed(!!saved);
    setShowSummary(session.status === "completed");
    saveSessions(sessions.map((item) =>
      item.id === session.id ? { ...item, status: "active" as const, updatedAt: new Date().toISOString() } : item
    ));
  };

  const handleBackToSelection = () => {
    if (activeSessionId) {
      updateActiveSession({ currentIndex: current, progress, quizMode, viewMode, status: "paused" });
    }
    setSelectedExam(null);
    setActiveSessionId(null);
    setPendingMode(null);
    setSelected(null);
    setRevealed(false);
    setShowSummary(false);
  };

  const handleDeleteSession = (sessionId: string) => {
    saveSessions(sessions.filter((s) => s.id !== sessionId));
  };

  const handleChangeSubCat = (subCat: string) => {
    if (!selectedExam) return;
    const ordered = quizMode === "random"
      ? shuffle(getExamQuestions(selectedExam, subCat, allQuestions))
      : getExamQuestions(selectedExam, subCat, allQuestions);
    setActiveSubCat(subCat);
    setQuizQuestions(ordered);
    setCurrent(0);
    setSelected(null);
    setRevealed(false);
    setShowSummary(false);
    updateActiveSession({ subCat, questionIds: ordered.map((q) => q.id), currentIndex: 0, status: "active" });
  };

  // ── First run: device picker ───────────────────────────────────────────────
  if (!deviceModeLoaded) {
    return <div className="flex min-h-[60vh] items-center justify-center"><span className="text-slate-400 text-sm">Loading…</span></div>;
  }
  if (!deviceMode) {
    return <DeviceModeScreen onSelect={handleSetDeviceMode} />;
  }

  // ── Selection screen ───────────────────────────────────────────────────────
  if (!selectedExam) {
    const availableExamIds = new Set(examGroups.map((e) => e.id));
    const visibleSessions = sessions.filter(
      (ses) => ses.status !== "completed" && availableExamIds.has(ses.examId)
    );

    const progressFor = (exam: ExamGroup) => {
      const total = allQuestions.filter(exam.match).length;
      const latest = sessions.filter((ses) => ses.examId === exam.id)[0];
      const answered = latest ? Object.keys(latest.progress).length : 0;
      const correct = latest
        ? Object.values(latest.progress).filter((p) => p.state === "correct").length
        : 0;
      return { total, answered, correct };
    };

    const ExamCard = ({ exam }: { exam: ExamGroup }) => {
      const ac = accentClasses[exam.accent];
      const { total, answered, correct } = progressFor(exam);
      const pct = total > 0 ? (correct / total) * 100 : 0;
      return (
        <button
          onClick={() => handleSelectExam(exam)}
          className={`w-full text-left p-4 rounded-lg border bg-white transition-all ${ac.card} group`}
        >
          <div className="flex items-start gap-3 mb-2">
            <span className={`mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg ${ac.badge}`}>
              <MedicalIcon name={iconForExam(exam)} className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-slate-800 text-base group-hover:text-slate-950">{exam.label}</h3>
              <p className="text-xs text-slate-500 mt-0.5">{exam.description}</p>
            </div>
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0 ml-3 ${ac.badge}`}>
              {total} Qs
            </span>
          </div>
          <p className={`text-xs font-bold mt-3 ${pendingMode === "test" ? "text-red-600" : "text-blue-600"}`}>
            {pendingMode === "test" ? "Start Test" : "Start Practice"}
          </p>
          {answered > 0 && (
            <div className="mt-3">
              <div className="flex justify-between text-xs text-slate-400 mb-1">
                <span>Latest: {answered}/{total} answered</span>
                <span className="text-teal-700 font-medium">{correct} correct</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-1.5">
                <div className="bg-teal-600 h-1.5 rounded-full transition-all" style={{ width: `${pct}%` }} />
              </div>
            </div>
          )}
        </button>
      );
    };

    return (
      <div className="space-y-10">
        {/* Mode switcher */}
        <div className="flex justify-end">
          <button
            onClick={() => handleSetDeviceMode(deviceMode === "phone" ? "computer" : "phone")}
            className={s.switchBtn}
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              {deviceMode === "phone"
                ? <><rect x="2" y="3" width="20" height="14" rx="2" /><path d="M8 21h8" /><path d="M12 17v4" /></>
                : <><rect x="5" y="2" width="14" height="20" rx="2" /><line x1="12" y1="18" x2="12.01" y2="18" /></>
              }
            </svg>
            Switch to {deviceMode === "phone" ? "Computer" : "Phone/iPad"} mode
          </button>
        </div>

        {/* Practice / Test mode selector or exam list header */}
        {pendingMode === null ? (
          <div className={s.homeModeGrid}>
            <section className={`relative overflow-hidden rounded-[28px] bg-white ${s.modeCardPad} shadow-2xl shadow-slate-200/80 border border-white ${s.modeCardMinH}`}>
              <div className="absolute inset-0 bg-gradient-to-br from-white via-white to-blue-50/60" />
              <div className="relative flex items-start justify-between gap-5">
                <ModeVisualIcon type="books" small={deviceMode === "computer"} />
                <span className={s.modeAvailBadge}>Available</span>
              </div>
              <div className="relative mt-8 text-center">
                <h1 className={s.modeHeading}>Practice Mode</h1>
                <p className={s.modeDesc}>Study at your own pace with explanations, PREP pearls, and progress tracking.</p>
              </div>
              <button onClick={() => handleStartAllPrep("study")} className={s.modeStartPractice}>
                Start Practicing <span className={s.modeArrow}>→</span>
              </button>
            </section>

            <section className={`relative overflow-hidden rounded-[28px] bg-white ${s.modeCardPad} shadow-2xl shadow-slate-200/80 border border-white ${s.modeCardMinH}`}>
              <div className="absolute inset-0 bg-gradient-to-br from-white via-white to-red-50/40" />
              <div className="relative flex items-start justify-between gap-5">
                <ModeVisualIcon type="stopwatch" small={deviceMode === "computer"} />
                <span className={s.modeAvailBadge}>Available</span>
              </div>
              <div className="relative mt-8 text-center">
                <h2 className={s.modeHeading}>Test Mode</h2>
                <p className={s.modeDesc}>Simulated exam experience with scoring and no explanations during the test.</p>
              </div>
              <button onClick={() => handleStartAllPrep("test")} className={s.modeStartTest}>
                Start Test <span className={s.modeArrow}>→</span>
              </button>
            </section>
          </div>
        ) : (
          <div className="rounded-[28px] bg-white p-6 shadow-xl shadow-slate-200/70 border border-white">
            <button
              onClick={() => setPendingMode(null)}
              className="mb-5 inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-lg font-bold text-slate-700 shadow-lg shadow-slate-200 hover:text-slate-950"
            >
              ← Back
            </button>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-bold uppercase tracking-wider text-slate-400">
                  {pendingMode === "study" ? "Practice Mode" : "Test Mode"}
                </p>
                <h1 className="mt-1 text-3xl font-extrabold text-slate-900">Choose your PREP exam</h1>
                <p className="mt-2 text-slate-500">Select a year, or use all PREP questions.</p>
              </div>
              <span className={`rounded-full px-5 py-2 text-lg font-extrabold ${pendingMode === "study" ? "bg-blue-100 text-blue-600" : "bg-red-100 text-red-600"}`}>
                {pendingMode === "study" ? "Practice" : "Test"}
              </span>
            </div>
          </div>
        )}

        {/* Paused sessions */}
        {visibleSessions.length > 0 && (
          <section className="bg-white rounded-lg border border-teal-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-teal-50 flex items-center justify-between">
              <h2 className="text-xs font-semibold text-teal-700 uppercase tracking-wider">Paused Sessions</h2>
              <span className="text-xs text-slate-400">{visibleSessions.length} session{visibleSessions.length !== 1 ? "s" : ""}</span>
            </div>
            <div className="divide-y divide-slate-100">
              {visibleSessions.map((ses) => {
                const answered = Object.keys(ses.progress).length;
                const correct = Object.values(ses.progress).filter((p) => p.state === "correct").length;
                const pct = ses.questionIds.length > 0 ? (answered / ses.questionIds.length) * 100 : 0;
                return (
                  <div key={ses.id} className="p-4 flex flex-col gap-3 sm:flex-row sm:items-center">
                    <span className="hidden sm:flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-teal-50 text-teal-700 border border-teal-100">
                      <MedicalIcon name="timer" className="h-5 w-5" />
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-slate-800 truncate">{ses.examLabel}</h3>
                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-100">
                          {ses.viewMode === "study" ? "Study" : "Test"} · {ses.quizMode}
                        </span>
                      </div>
                      <div className="flex flex-wrap justify-between gap-x-3 gap-y-1 text-xs text-slate-400 mb-1">
                        <span>Question {Math.min(ses.currentIndex + 1, ses.questionIds.length)} of {ses.questionIds.length}</span>
                        <span>{answered} answered · {correct} correct</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-1.5">
                        <div className="bg-teal-600 h-1.5 rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                    <div className="flex gap-2 sm:flex-shrink-0">
                      <button
                        onClick={() => handleResumeSession(ses)}
                        className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-teal-700 text-white text-sm font-medium hover:bg-teal-800 transition-colors"
                      >
                        <MedicalIcon name="clipboard" className="h-4 w-4" />
                        Resume
                      </button>
                      <button
                        onClick={() => handleDeleteSession(ses.id)}
                        className="px-3 py-2 rounded-lg bg-slate-100 text-slate-500 text-sm hover:bg-red-50 hover:text-red-600 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Exam grid */}
        {pendingMode !== null && (
          <div className="space-y-6">
            <section>
              <h2 className={s.sectionHeading}>PREP Exams</h2>
              <div className={`grid ${s.examGridCols} gap-3`}>
                {prepExamGroups.map((exam) => <ExamCard key={exam.id} exam={exam} />)}
              </div>
            </section>
            <section>
              <h2 className={s.sectionHeading}>Combined PREP</h2>
              <div className={`grid ${s.examGridCols} gap-3`}>
                {specialExamGroups.map((exam) => <ExamCard key={exam.id} exam={exam} />)}
              </div>
            </section>
          </div>
        )}
      </div>
    );
  }

  // ── Quiz screen ────────────────────────────────────────────────────────────
  const ac = accentClasses[selectedExam.accent];
  const totalCount = quizQuestions.length;
  const answeredInView = quizQuestions.filter((q) => progress[q.id]).length;
  const correctInView = quizQuestions.filter((q) => progress[q.id]?.state === "correct").length;
  const subCats = selectedExam.subCategoryPrefix
    ? Array.from(new Set(allQuestions.filter(selectedExam.match).map((q) => q.category))).sort()
    : [];

  if (showSummary) {
    return (
      <div className="space-y-6">
        <button onClick={handleBackToSelection} className="text-sm text-slate-500 hover:text-slate-800 flex items-center gap-1">
          ← Pause Session
        </button>
        <div className="bg-white rounded-lg shadow-sm border border-teal-100 p-8 text-center">
          <p className="text-sm font-medium text-slate-400 mb-1">{selectedExam.label}</p>
          <div className="text-5xl font-bold text-teal-800 mb-2">{correctInView} / {totalCount}</div>
          <div className="text-slate-500 mb-6">Questions correct</div>
          <div className="w-full bg-slate-100 rounded-full h-4 mb-6">
            <div className="bg-teal-600 h-4 rounded-full transition-all" style={{ width: `${(correctInView / totalCount) * 100}%` }} />
          </div>
          <div className="flex gap-3 justify-center flex-wrap">
            <button onClick={resetProgress} className={`text-white px-6 py-2 rounded-lg transition-colors ${ac.btn}`}>Restart</button>
            <button onClick={() => handleJump(0)} className="bg-slate-100 text-slate-700 px-6 py-2 rounded-lg hover:bg-slate-200 transition-colors">Review Answers</button>
            <button onClick={handleBackToSelection} className="bg-slate-100 text-slate-700 px-6 py-2 rounded-lg hover:bg-slate-200 transition-colors">Change Exam</button>
          </div>
        </div>
        <QuestionGrid questions={quizQuestions} progress={progress} onJump={handleJump} />
      </div>
    );
  }

  if (quizQuestions.length === 0) {
    return <div className="text-center py-20 text-slate-400">Loading questions…</div>;
  }

  const q = quizQuestions[current];
  const savedState = progress[q.id];
  const choiceLetters = Object.keys(q.choices).sort();
  const questionText = q.scenario || q.title;

  return (
    <div className={s.quizWrap}>
      {/* Header */}
      <div className={s.headerPad}>
        <button onClick={handleBackToSelection} className={s.backBtn}>
          ⏸ Pause &amp; Exit
        </button>
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <span className="h-4 w-4 rounded-full bg-gradient-to-br from-blue-500 to-violet-600" />
              <h1 className={s.examTitle}>{selectedExam.label}</h1>
            </div>
            <p className={s.questionMeta}>
              Question <span className="text-slate-700">{current + 1}</span> of {totalCount}
            </p>
          </div>
          <span className={s.questionBadge}>Q{current + 1}</span>
        </div>
      </div>

      {/* Tab bar */}
      <div className="grid grid-cols-3 border-y border-slate-200 bg-white">
        <button className={`border-b-4 border-blue-500 ${s.tabBtn}`}>?</button>
        <button className={`${s.tabBtn} opacity-80`}>💡</button>
        <button className={`${s.tabBtn} opacity-80`}>📝</button>
      </div>

      {/* Month filter */}
      {subCats.length > 0 && (
        <details className="border-b border-slate-100 bg-white">
          <summary className="cursor-pointer list-none px-5 py-4 text-sm font-extrabold text-slate-500 marker:hidden sm:px-8">
            <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2">
              <span className="h-2 w-2 rounded-full bg-blue-500" />
              Filter months
            </span>
          </summary>
          <div className="flex gap-2 overflow-x-auto px-5 pb-4 sm:px-8">
            <button
              onClick={() => handleChangeSubCat("all")}
              className={`whitespace-nowrap rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${activeSubCat === "all" ? "border-blue-500 bg-blue-600 text-white" : "border-slate-200 bg-white text-slate-500"}`}
            >
              All months
            </button>
            {subCats.map((cat) => (
              <button
                key={cat}
                onClick={() => handleChangeSubCat(cat)}
                className={`whitespace-nowrap rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${activeSubCat === cat ? "border-blue-500 bg-blue-600 text-white" : "border-slate-200 bg-white text-slate-500"}`}
              >
                {cat.replace(selectedExam.subCategoryPrefix! + " - ", "")}
              </button>
            ))}
          </div>
        </details>
      )}

      {/* Question body */}
      <div className={s.questionBodyPad}>
        <div className="mb-7 flex items-center justify-between gap-3">
          <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold ${ac.badge}`}>
            <MedicalIcon name="clipboard" className="h-3.5 w-3.5" />
            {q.category}
          </span>
          <div className="flex gap-2">
            <button onClick={toggleQuizMode} className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-500">
              {quizMode === "sequential" ? "Sequential" : "Random"}
            </button>
            <button onClick={resetProgress} className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-500">
              Reset
            </button>
          </div>
        </div>

        <h2 className={s.questionText}>{questionText}</h2>

        <div className={s.choiceSpace}>
          {choiceLetters.map((letter) => {
            const isSelected = selected === letter;
            const isCorrect = letter === q.correctAnswer;
            let style = s.choiceBase;
            if (!revealed) {
              style += isSelected
                ? "border-blue-500 bg-blue-50 text-blue-900"
                : "border-slate-200 bg-white hover:border-blue-300 hover:bg-blue-50/40";
            } else {
              if (isCorrect) style += "border-green-500 bg-green-50 text-green-900";
              else if (isSelected) style += "border-red-400 bg-red-50 text-red-800";
              else style += "border-slate-200 text-slate-400";
            }
            return (
              <button key={letter} className={style} onClick={() => handleSelect(letter)}>
                <span className={`${s.choiceLetterBase}${
                  !revealed
                    ? isSelected ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-500"
                    : isCorrect ? "bg-green-500 text-white"
                    : isSelected ? "bg-red-400 text-white"
                    : "bg-slate-100 text-slate-400"
                }`}>
                  {letter}
                </span>
                <span>{q.choices[letter]}</span>
              </button>
            );
          })}
        </div>

        {!revealed ? (
          <button onClick={handleSubmit} disabled={!selected} className={s.submitBtn}>
            Submit
          </button>
        ) : (
          <>
            <div className={s.explanationBox(savedState?.state === "correct")}>
              <div className={`font-semibold flex items-start gap-2 ${savedState?.state === "correct" ? "text-green-800" : "text-red-800"}`}>
                <MedicalIcon name={savedState?.state === "correct" ? "heart" : "vial"} className="mt-0.5 h-4 w-4 flex-shrink-0" />
                <span>
                  {savedState?.state === "correct" ? "Correct!" : "Incorrect"} — Best answer:{" "}
                  {q.correctAnswer}. {q.correctAnswerText}
                </span>
              </div>
              {viewMode === "study" && (
                <>
                  {q.explanation && (() => {
                    const pearlIdx = q.explanation!.indexOf("PREP Pearls:");
                    const mainText = pearlIdx >= 0 ? q.explanation!.slice(0, pearlIdx).trim() : q.explanation;
                    const pearlText = pearlIdx >= 0 ? q.explanation!.slice(pearlIdx + 12).trim() : null;
                    return (
                      <>
                        {mainText && <p className="text-slate-700 leading-relaxed">{mainText}</p>}
                        {pearlText && (
                          <div className="mt-3 bg-amber-50 border border-amber-200 rounded-lg p-3">
                            <p className="text-xs font-bold text-amber-800 uppercase tracking-wide mb-2">PREP Pearls</p>
                            <ul className="space-y-1">
                              {pearlText.split(" | ").map((pearl, i) => (
                                <li key={i} className="text-sm text-amber-900 flex gap-2">
                                  <span className="text-amber-500 flex-shrink-0">•</span>
                                  <span>{pearl}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </>
                    );
                  })()}
                  {q.source && (
                    <p className="text-xs text-slate-500 italic border-t border-slate-200 pt-2 mt-2">
                      Source: {q.source}
                    </p>
                  )}
                </>
              )}
              {viewMode === "test" && savedState?.state === "incorrect" && (
                <p className="text-xs text-slate-500">Switch to Study mode to see the explanation.</p>
              )}
            </div>

            <div className={s.navGrid}>
              {current > 0 && (
                <button onClick={handlePrev} className={s.prevBtn}>⬅ Previous</button>
              )}
              <button onClick={handleNext} className={s.nextBtn}>
                {current + 1 >= totalCount ? "See Results" : "Next ➡"}
              </button>
            </div>
          </>
        )}

        <div className={s.progressWrap}>
          <span className={s.progressPill}>
            <span className={s.progressDot} />
            {current + 1} of {totalCount}
          </span>
        </div>

        {answeredInView > 0 && (
          <div className={s.scoreBubble}>
            {Math.round((correctInView / answeredInView) * 100)}%<br />📊
          </div>
        )}
      </div>

      {/* Question list accordion */}
      <details className="border-t border-slate-100 bg-slate-50 p-4">
        <summary className="cursor-pointer list-none rounded-[18px] bg-white px-5 py-4 text-lg font-extrabold text-slate-700 shadow-md shadow-slate-200 marker:hidden">
          Question list
          <span className="ml-3 text-sm font-bold text-slate-400">{answeredInView}/{totalCount} answered</span>
        </summary>
        <div className="mt-4">
          <QuestionGrid questions={quizQuestions} progress={progress} onJump={handleJump} currentIdx={current} />
        </div>
      </details>
    </div>
  );
}

// ── Question grid ─────────────────────────────────────────────────────────────
function QuestionGrid({
  questions, progress, onJump, currentIdx,
}: {
  questions: Question[];
  progress: Progress;
  onJump: (idx: number) => void;
  currentIdx?: number;
}) {
  const [openGroups, setOpenGroups] = useState<Set<string>>(new Set());

  const groups: { category: string; items: { q: Question; idx: number }[] }[] = [];
  const seen = new Map<string, { q: Question; idx: number }[]>();
  questions.forEach((q, idx) => {
    if (!seen.has(q.category)) {
      seen.set(q.category, []);
      groups.push({ category: q.category, items: seen.get(q.category)! });
    }
    seen.get(q.category)!.push({ q, idx });
  });

  const currentCategory = currentIdx !== undefined ? questions[currentIdx]?.category : undefined;
  const toggleGroup = (cat: string) => {
    setOpenGroups((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat); else next.add(cat);
      return next;
    });
  };
  const isOpen = (cat: string) => openGroups.has(cat) || cat === currentCategory;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-teal-100 overflow-hidden">
      <div className="px-4 py-3 border-b border-teal-50 flex items-center justify-between">
        <p className="text-xs font-semibold text-teal-700 uppercase tracking-wider">Questions ({questions.length})</p>
        <div className="flex gap-3 text-xs text-slate-400">
          <span className="flex items-center gap-1"><span className="w-2 h-2 bg-green-500 rounded-full inline-block" /> Correct</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 bg-red-400 rounded-full inline-block" /> Incorrect</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 bg-slate-200 rounded-full inline-block" /> Unanswered</span>
        </div>
      </div>
      <div className="divide-y divide-slate-100">
        {groups.map(({ category, items }) => {
          const correct = items.filter(({ q }) => progress[q.id]?.state === "correct").length;
          const incorrect = items.filter(({ q }) => progress[q.id]?.state === "incorrect").length;
          const answered = correct + incorrect;
          const pct = items.length > 0 ? (correct / items.length) * 100 : 0;
          const open = isOpen(category);
          return (
            <div key={category}>
              <button onClick={() => toggleGroup(category)}
                className="w-full px-4 py-3 flex items-center gap-3 hover:bg-teal-50/50 transition-colors text-left">
                <span className={`transition-transform text-slate-400 text-xs ${open ? "rotate-90" : ""}`}>▶</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-slate-700 truncate">{category}</span>
                    <span className="text-xs text-slate-400 ml-2 flex-shrink-0">
                      {answered}/{items.length}
                      {answered > 0 && <span className="text-green-600 ml-1">({correct} ✓)</span>}
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-1.5">
                    <div className="flex h-1.5 rounded-full overflow-hidden">
                      <div className="bg-teal-600 transition-all" style={{ width: `${pct}%` }} />
                      <div className="bg-red-400 transition-all" style={{ width: `${(incorrect / items.length) * 100}%` }} />
                    </div>
                  </div>
                </div>
              </button>
              {open && (
                <div className="border-t border-slate-100 max-h-64 overflow-y-auto">
                  {items.map(({ q, idx }) => {
                    const state = progress[q.id]?.state;
                    const isCurrent = idx === currentIdx;
                    return (
                      <button key={q.id} onClick={() => onJump(idx)}
                        className={`w-full text-left px-4 py-2.5 flex items-center gap-3 text-sm transition-colors hover:bg-slate-50 ${isCurrent ? "bg-teal-50 border-l-2 border-teal-600" : "border-l-2 border-transparent"}`}>
                        <span className={`flex-shrink-0 w-2 h-2 rounded-full ${state === "correct" ? "bg-teal-600" : state === "incorrect" ? "bg-red-400" : "bg-slate-200"}`} />
                        <span className="text-xs font-mono text-slate-400 flex-shrink-0 w-6">{idx + 1}</span>
                        <span className={`truncate ${isCurrent ? "text-teal-900 font-medium" : "text-slate-600"}`}>{q.title}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
