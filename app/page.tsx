"use client";

import { useState, useEffect, useCallback } from "react";
import { questions as builtInQuestions } from "@/data/questions";
import { Question } from "@/types/question";

const STORAGE_KEY = "picu_custom_questions";
const PROGRESS_KEY = "picu_progress";

type AnswerState = "unanswered" | "correct" | "incorrect";
type QuizMode = "sequential" | "random";
type ViewMode = "study" | "test";

interface Progress {
  [questionId: number]: { selected: string; state: AnswerState };
}

interface ExamGroup {
  id: string;
  label: string;
  description: string;
  accent: string;
  match: (q: Question) => boolean;
  subCategoryPrefix?: string;
}

const examGroups: ExamGroup[] = [
  {
    id: "picu-final-2026",
    label: "PICU Final 2026",
    description: "PICU final exam — all topics",
    accent: "blue",
    match: (q) => q.category === "PICU Final 2026",
  },
  {
    id: "picu-final-2022",
    label: "PICU Final 2022",
    description: "PICU final exam 2022",
    accent: "blue",
    match: (q) => q.category === "PICU Final 2022",
  },
  {
    id: "picu-promo-2022",
    label: "PICU Promotion 2022",
    description: "Promotion exam 2022",
    accent: "indigo",
    match: (q) => q.category === "PICU Promotion 2022",
  },
  {
    id: "picu-promo-2021",
    label: "PICU Promotion 2021",
    description: "Promotion exam 2021",
    accent: "indigo",
    match: (q) => q.category === "PICU Promotion 2021",
  },
  {
    id: "picu-promo-2019",
    label: "PICU Promotion 2019",
    description: "Promotion exam 2019",
    accent: "indigo",
    match: (q) => q.category === "PICU Promotion 2019",
  },
  {
    id: "prep-2025",
    label: "PREP 2025",
    description: "PREP self-assessment 2025",
    accent: "emerald",
    match: (q) => q.category === "PREP 2025",
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
    id: "prep-icu-2023",
    label: "PREP ICU 2023",
    description: "Monthly cases Jan–Dec 2023",
    accent: "emerald",
    match: (q) => q.category.startsWith("PREP ICU 2023"),
    subCategoryPrefix: "PREP ICU 2023",
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
    id: "study-prep",
    label: "Study All PREP",
    description: "All PREP questions combined (2022–2025)",
    accent: "violet",
    match: (q) => q.category.startsWith("PREP"),
  },
  {
    id: "all",
    label: "All Questions",
    description: "Every question in the bank",
    accent: "slate",
    match: () => true,
  },
];

const accentClasses: Record<string, { card: string; badge: string; btn: string; ring: string }> = {
  blue: {
    card: "border-blue-200 hover:border-blue-400 hover:bg-blue-50",
    badge: "bg-blue-100 text-blue-700",
    btn: "bg-blue-900 hover:bg-blue-800",
    ring: "ring-blue-500",
  },
  indigo: {
    card: "border-indigo-200 hover:border-indigo-400 hover:bg-indigo-50",
    badge: "bg-indigo-100 text-indigo-700",
    btn: "bg-indigo-800 hover:bg-indigo-700",
    ring: "ring-indigo-500",
  },
  emerald: {
    card: "border-emerald-200 hover:border-emerald-400 hover:bg-emerald-50",
    badge: "bg-emerald-100 text-emerald-700",
    btn: "bg-emerald-700 hover:bg-emerald-600",
    ring: "ring-emerald-500",
  },
  violet: {
    card: "border-violet-200 hover:border-violet-400 hover:bg-violet-50",
    badge: "bg-violet-100 text-violet-700",
    btn: "bg-violet-700 hover:bg-violet-600",
    ring: "ring-violet-500",
  },
  slate: {
    card: "border-slate-200 hover:border-slate-400 hover:bg-slate-50",
    badge: "bg-slate-100 text-slate-600",
    btn: "bg-slate-700 hover:bg-slate-600",
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

export default function QuizPage() {
  const [allQuestions, setAllQuestions] = useState<Question[]>(builtInQuestions);
  const [selectedExam, setSelectedExam] = useState<ExamGroup | null>(null);
  const [activeSubCat, setActiveSubCat] = useState<string>("all");
  const [quizQuestions, setQuizQuestions] = useState<Question[]>([]);
  const [current, setCurrent] = useState(0);
  const [progress, setProgress] = useState<Progress>({});
  const [selected, setSelected] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [quizMode, setQuizMode] = useState<QuizMode>("sequential");
  const [viewMode, setViewMode] = useState<ViewMode>("study");
  const [showSummary, setShowSummary] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const custom: Question[] = JSON.parse(stored);
        setAllQuestions([...builtInQuestions, ...custom]);
      } catch {}
    }
    const savedProgress = localStorage.getItem(PROGRESS_KEY);
    if (savedProgress) {
      try { setProgress(JSON.parse(savedProgress)); } catch {}
    }
  }, []);

  const startQuiz = useCallback((questions: Question[], randomize: boolean) => {
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
    if (selectedExam && allQuestions.length > 0) {
      startQuiz(getExamQuestions(selectedExam, activeSubCat, allQuestions), quizMode === "random");
    }
  }, [selectedExam, activeSubCat, allQuestions]); // eslint-disable-line react-hooks/exhaustive-deps

  const saveProgress = (updated: Progress) => {
    setProgress(updated);
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(updated));
  };

  const handleSelect = (letter: string) => {
    if (revealed) return;
    setSelected(letter);
  };

  const handleSubmit = () => {
    if (!selected || !quizQuestions[current]) return;
    const q = quizQuestions[current];
    const state: AnswerState = selected === q.correctAnswer ? "correct" : "incorrect";
    saveProgress({ ...progress, [q.id]: { selected, state } });
    setRevealed(true);
  };

  const handleNext = () => {
    if (current + 1 >= quizQuestions.length) {
      setShowSummary(true);
    } else {
      const next = current + 1;
      const nextQ = quizQuestions[next];
      const prev = progress[nextQ.id];
      setCurrent(next);
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
    setSelected(saved?.selected ?? null);
    setRevealed(!!saved);
  };

  const handleJump = (idx: number) => {
    const q = quizQuestions[idx];
    const saved = progress[q.id];
    setCurrent(idx);
    setSelected(saved?.selected ?? null);
    setRevealed(!!saved);
    setShowSummary(false);
  };

  const resetProgress = () => {
    localStorage.removeItem(PROGRESS_KEY);
    setProgress({});
    if (selectedExam) {
      startQuiz(getExamQuestions(selectedExam, activeSubCat, allQuestions), quizMode === "random");
    }
  };

  const toggleQuizMode = () => {
    const next: QuizMode = quizMode === "sequential" ? "random" : "sequential";
    setQuizMode(next);
    if (selectedExam) {
      startQuiz(getExamQuestions(selectedExam, activeSubCat, allQuestions), next === "random");
    }
  };

  const handleSelectExam = (exam: ExamGroup) => {
    setSelectedExam(exam);
    setActiveSubCat("all");
    setShowSummary(false);
  };

  const handleBackToSelection = () => {
    setSelectedExam(null);
    setShowSummary(false);
  };

  // — Selection screen —
  if (!selectedExam) {
    const picuExams = examGroups.filter((g) => g.id.startsWith("picu"));
    const prepExams = examGroups.filter((g) => g.id.startsWith("prep") && g.id !== "study-prep");
    const special = examGroups.filter((g) => g.id === "study-prep" || g.id === "all");

    const countFor = (exam: ExamGroup) => allQuestions.filter(exam.match).length;
    const progressFor = (exam: ExamGroup) => {
      const qs = allQuestions.filter(exam.match);
      const answered = qs.filter((q) => progress[q.id]).length;
      const correct = qs.filter((q) => progress[q.id]?.state === "correct").length;
      return { total: qs.length, answered, correct };
    };

    const ExamCard = ({ exam }: { exam: ExamGroup }) => {
      const ac = accentClasses[exam.accent];
      const { total, answered, correct } = progressFor(exam);
      const pct = total > 0 ? (correct / total) * 100 : 0;
      return (
        <button
          onClick={() => handleSelectExam(exam)}
          className={`w-full text-left p-5 rounded-2xl border-2 transition-all ${ac.card} group`}
        >
          <div className="flex items-start justify-between mb-2">
            <div>
              <h3 className="font-bold text-slate-800 text-base group-hover:text-slate-900">{exam.label}</h3>
              <p className="text-xs text-slate-500 mt-0.5">{exam.description}</p>
            </div>
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0 ml-3 ${ac.badge}`}>
              {total} Qs
            </span>
          </div>
          {answered > 0 && (
            <div className="mt-3">
              <div className="flex justify-between text-xs text-slate-400 mb-1">
                <span>{answered}/{total} answered</span>
                <span className="text-green-600 font-medium">{correct} correct</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-1.5">
                <div
                  className="bg-green-500 h-1.5 rounded-full transition-all"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          )}
        </button>
      );
    };

    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Select Exam</h1>
          <p className="text-slate-500 text-sm mt-1">Choose a question set to start studying</p>
        </div>

        <div className="space-y-6">
          <section>
            <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">PICU Exams</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {picuExams.map((exam) => <ExamCard key={exam.id} exam={exam} />)}
            </div>
          </section>

          <section>
            <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">PREP Exams</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {prepExams.map((exam) => <ExamCard key={exam.id} exam={exam} />)}
            </div>
          </section>

          <section>
            <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Combined</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {special.map((exam) => <ExamCard key={exam.id} exam={exam} />)}
            </div>
          </section>
        </div>
      </div>
    );
  }

  // — Quiz screen —
  const ac = accentClasses[selectedExam.accent];
  const totalCount = quizQuestions.length;
  const answeredInView = quizQuestions.filter((q) => progress[q.id]).length;
  const correctInView = quizQuestions.filter((q) => progress[q.id]?.state === "correct").length;

  // Sub-category chips for PREP exams
  const subCats = selectedExam.subCategoryPrefix
    ? Array.from(new Set(allQuestions.filter(selectedExam.match).map((q) => q.category))).sort()
    : [];

  if (showSummary) {
    return (
      <div className="space-y-6">
        <button onClick={handleBackToSelection} className="text-sm text-slate-500 hover:text-slate-800 flex items-center gap-1">
          ← Back to Exams
        </button>
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 text-center">
          <p className="text-sm font-medium text-slate-400 mb-1">{selectedExam.label}</p>
          <div className="text-5xl font-bold text-blue-900 mb-2">{correctInView} / {totalCount}</div>
          <div className="text-slate-500 mb-6">Questions correct</div>
          <div className="w-full bg-slate-100 rounded-full h-4 mb-6">
            <div className="bg-green-500 h-4 rounded-full transition-all"
              style={{ width: `${(correctInView / totalCount) * 100}%` }} />
          </div>
          <div className="flex gap-3 justify-center flex-wrap">
            <button onClick={resetProgress}
              className={`text-white px-6 py-2 rounded-lg transition-colors ${ac.btn}`}>
              Restart
            </button>
            <button onClick={() => handleJump(0)}
              className="bg-slate-100 text-slate-700 px-6 py-2 rounded-lg hover:bg-slate-200 transition-colors">
              Review Answers
            </button>
            <button onClick={handleBackToSelection}
              className="bg-slate-100 text-slate-700 px-6 py-2 rounded-lg hover:bg-slate-200 transition-colors">
              Change Exam
            </button>
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

  return (
    <div className="space-y-4">
      {/* Header: back + exam label + mode toggle */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <button onClick={handleBackToSelection}
            className="text-sm text-slate-500 hover:text-slate-800 transition-colors flex items-center gap-1">
            ← Exams
          </button>
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${ac.badge}`}>
            {selectedExam.label}
          </span>
        </div>
        <div className="flex gap-1 bg-slate-100 p-1 rounded-xl">
          <button onClick={() => setViewMode("study")}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              viewMode === "study" ? "bg-white text-blue-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
            }`}>
            Study
          </button>
          <button onClick={() => setViewMode("test")}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              viewMode === "test" ? "bg-white text-blue-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
            }`}>
            Test
          </button>
        </div>
      </div>

      {/* Month sub-filter for PREP exams */}
      {subCats.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setActiveSubCat("all")}
            className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
              activeSubCat === "all"
                ? `${ac.btn} text-white border-transparent`
                : "bg-white text-slate-600 border-slate-200 hover:border-slate-400"
            }`}>
            All months <span className={activeSubCat === "all" ? "opacity-70" : "text-slate-400"}>
              {allQuestions.filter(selectedExam.match).length}
            </span>
          </button>
          {subCats.map((cat) => {
            const label = cat.replace(selectedExam.subCategoryPrefix! + " - ", "");
            const count = allQuestions.filter((q) => q.category === cat).length;
            return (
              <button key={cat} onClick={() => setActiveSubCat(cat)}
                className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                  activeSubCat === cat
                    ? `${ac.btn} text-white border-transparent`
                    : "bg-white text-slate-600 border-slate-200 hover:border-slate-400"
                }`}>
                {label} <span className={activeSubCat === cat ? "opacity-70" : "text-slate-400"}>{count}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Progress bar + controls */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-slate-500">
          Question <span className="font-semibold text-slate-700">{current + 1}</span> of{" "}
          <span className="font-semibold text-slate-700">{totalCount}</span>
        </div>
        <div className="flex gap-2">
          <button onClick={toggleQuizMode}
            className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-600 px-3 py-1 rounded-full transition-colors">
            {quizMode === "sequential" ? "Sequential" : "Random"}
          </button>
          <button onClick={resetProgress}
            className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-600 px-3 py-1 rounded-full transition-colors">
            Reset
          </button>
        </div>
      </div>

      <div className="w-full bg-slate-200 rounded-full h-2">
        <div className="bg-blue-600 h-2 rounded-full transition-all"
          style={{ width: `${((current + 1) / totalCount) * 100}%` }} />
      </div>

      {answeredInView > 0 && (
        <div className="text-xs text-slate-500 text-right">
          Score: {correctInView}/{answeredInView} answered
        </div>
      )}

      {/* Question card */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-4">
        <div className="flex items-start gap-3">
          <span className={`text-white text-xs font-bold rounded-full w-7 h-7 flex-shrink-0 flex items-center justify-center ${ac.btn}`}>
            {current + 1}
          </span>
          <div className="flex-1">
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full mr-2 ${ac.badge}`}>
              {q.category}
            </span>
            <h2 className="text-base font-semibold text-slate-800 leading-snug mt-1">{q.title}</h2>
          </div>
        </div>

        {q.scenario && (
          <p className="text-sm text-slate-600 bg-slate-50 rounded-lg p-4 leading-relaxed border border-slate-100">
            {q.scenario}
          </p>
        )}

        <div className="space-y-2">
          {choiceLetters.map((letter) => {
            const isSelected = selected === letter;
            const isCorrect = letter === q.correctAnswer;
            let style = "w-full text-left px-4 py-3 rounded-xl border text-sm transition-all cursor-pointer flex items-start gap-3 ";
            if (!revealed) {
              style += isSelected
                ? "border-blue-500 bg-blue-50 text-blue-900 font-medium"
                : "border-slate-200 hover:border-blue-300 hover:bg-blue-50";
            } else {
              if (isCorrect) style += "border-green-500 bg-green-50 text-green-900 font-medium";
              else if (isSelected) style += "border-red-400 bg-red-50 text-red-800";
              else style += "border-slate-200 text-slate-400";
            }
            return (
              <button key={letter} className={style} onClick={() => handleSelect(letter)}>
                <span className={`flex-shrink-0 w-6 h-6 rounded-full border text-xs font-bold flex items-center justify-center ${
                  !revealed
                    ? isSelected ? "border-blue-500 bg-blue-500 text-white" : "border-slate-300"
                    : isCorrect ? "border-green-500 bg-green-500 text-white"
                    : isSelected ? "border-red-400 bg-red-400 text-white"
                    : "border-slate-300 text-slate-400"
                }`}>
                  {letter}
                </span>
                <span>{q.choices[letter]}</span>
              </button>
            );
          })}
        </div>

        {!revealed ? (
          <button onClick={handleSubmit} disabled={!selected}
            className={`w-full py-3 rounded-xl text-white font-medium text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${ac.btn}`}>
            Submit Answer
          </button>
        ) : (
          <>
            <div className={`rounded-xl p-4 border text-sm space-y-2 ${
              savedState?.state === "correct" ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"
            }`}>
              <div className={`font-semibold ${savedState?.state === "correct" ? "text-green-800" : "text-red-800"}`}>
                {savedState?.state === "correct" ? "Correct!" : "Incorrect"} — Best answer:{" "}
                {q.correctAnswer}. {q.correctAnswerText}
              </div>
              {viewMode === "study" && (
                <>
                  {q.explanation && (() => {
                    const pearlIdx = q.explanation!.indexOf('PREP Pearls:');
                    const mainText = pearlIdx >= 0 ? q.explanation!.slice(0, pearlIdx).trim() : q.explanation;
                    const pearlText = pearlIdx >= 0 ? q.explanation!.slice(pearlIdx + 12).trim() : null;
                    return (
                      <>
                        {mainText && <p className="text-slate-700 leading-relaxed">{mainText}</p>}
                        {pearlText && (
                          <div className="mt-3 bg-amber-50 border border-amber-200 rounded-lg p-3">
                            <p className="text-xs font-bold text-amber-800 uppercase tracking-wide mb-2">PREP Pearls</p>
                            <ul className="space-y-1">
                              {pearlText.split(' | ').map((pearl, i) => (
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
            <div className="flex gap-3">
              {current > 0 && (
                <button onClick={handlePrev}
                  className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-600 text-sm hover:bg-slate-50 transition-colors">
                  Previous
                </button>
              )}
              <button onClick={handleNext}
                className={`flex-1 py-3 rounded-xl text-white font-medium text-sm transition-colors ${ac.btn}`}>
                {current + 1 >= totalCount ? "See Results" : "Next Question"}
              </button>
            </div>
          </>
        )}
      </div>

      <QuestionGrid questions={quizQuestions} progress={progress} onJump={handleJump} currentIdx={current} />
    </div>
  );
}

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
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Questions ({questions.length})
        </p>
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
                className="w-full px-4 py-3 flex items-center gap-3 hover:bg-slate-50 transition-colors text-left">
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
                      <div className="bg-green-500 transition-all" style={{ width: `${pct}%` }} />
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
                        className={`w-full text-left px-4 py-2.5 flex items-center gap-3 text-sm transition-colors hover:bg-slate-50 ${
                          isCurrent ? "bg-blue-50 border-l-2 border-blue-500" : "border-l-2 border-transparent"
                        }`}>
                        <span className={`flex-shrink-0 w-2 h-2 rounded-full ${
                          state === "correct" ? "bg-green-500"
                          : state === "incorrect" ? "bg-red-400"
                          : "bg-slate-200"
                        }`} />
                        <span className="text-xs font-mono text-slate-400 flex-shrink-0 w-6">{idx + 1}</span>
                        <span className={`truncate ${isCurrent ? "text-blue-900 font-medium" : "text-slate-600"}`}>
                          {q.title}
                        </span>
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
