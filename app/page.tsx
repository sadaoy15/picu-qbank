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

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const ALL_CATEGORIES = "All Exams";

export default function QuizPage() {
  const [allQuestions, setAllQuestions] = useState<Question[]>(builtInQuestions);
  const [quizQuestions, setQuizQuestions] = useState<Question[]>([]);
  const [current, setCurrent] = useState(0);
  const [progress, setProgress] = useState<Progress>({});
  const [selected, setSelected] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [quizMode, setQuizMode] = useState<QuizMode>("sequential");
  const [viewMode, setViewMode] = useState<ViewMode>("study");
  const [activeCategory, setActiveCategory] = useState<string>(ALL_CATEGORIES);
  const [showSummary, setShowSummary] = useState(false);

  const categories = [ALL_CATEGORIES, ...Array.from(new Set(builtInQuestions.map((q) => q.category))).sort()];

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

  const filteredQuestions = useCallback(
    (category: string, qs: Question[]) =>
      category === ALL_CATEGORIES ? qs : qs.filter((q) => q.category === category),
    []
  );

  useEffect(() => {
    if (allQuestions.length > 0) {
      startQuiz(filteredQuestions(activeCategory, allQuestions), quizMode === "random");
    }
  }, [allQuestions, activeCategory]); // eslint-disable-line react-hooks/exhaustive-deps

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
    startQuiz(filteredQuestions(activeCategory, allQuestions), quizMode === "random");
  };

  const toggleQuizMode = () => {
    const next: QuizMode = quizMode === "sequential" ? "random" : "sequential";
    setQuizMode(next);
    startQuiz(filteredQuestions(activeCategory, allQuestions), next === "random");
  };

  if (quizQuestions.length === 0) {
    return <div className="text-center py-20 text-slate-400">Loading questions…</div>;
  }

  const answeredInView = quizQuestions.filter((q) => progress[q.id]).length;
  const correctInView = quizQuestions.filter((q) => progress[q.id]?.state === "correct").length;
  const totalCount = quizQuestions.length;

  if (showSummary) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 text-center">
          <div className="text-4xl font-bold text-blue-900 mb-2">{correctInView} / {totalCount}</div>
          <div className="text-slate-500 mb-6">
            Questions correct{activeCategory !== ALL_CATEGORIES ? ` · ${activeCategory}` : ""}
          </div>
          <div className="w-full bg-slate-100 rounded-full h-4 mb-6">
            <div className="bg-green-500 h-4 rounded-full transition-all"
              style={{ width: `${(correctInView / totalCount) * 100}%` }} />
          </div>
          <div className="flex gap-3 justify-center flex-wrap">
            <button onClick={resetProgress}
              className="bg-blue-900 text-white px-6 py-2 rounded-lg hover:bg-blue-800 transition-colors">
              Restart
            </button>
            <button onClick={() => handleJump(0)}
              className="bg-slate-100 text-slate-700 px-6 py-2 rounded-lg hover:bg-slate-200 transition-colors">
              Review Answers
            </button>
          </div>
        </div>
        <QuestionGrid questions={quizQuestions} progress={progress} onJump={handleJump} />
      </div>
    );
  }

  const q = quizQuestions[current];
  const savedState = progress[q.id];
  const choiceLetters = Object.keys(q.choices).sort();

  return (
    <div className="space-y-4">
      {/* Study / Test mode toggle */}
      <div className="flex items-center justify-between">
        <div className="flex gap-1 bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setViewMode("study")}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              viewMode === "study"
                ? "bg-white text-blue-900 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            Study Mode
          </button>
          <button
            onClick={() => setViewMode("test")}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              viewMode === "test"
                ? "bg-white text-blue-900 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            Test Mode
          </button>
        </div>
        <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
          viewMode === "study"
            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
            : "bg-amber-50 text-amber-700 border border-amber-200"
        }`}>
          {viewMode === "study" ? "Explanations on" : "Explanations off"}
        </span>
      </div>

      {/* Category filter */}
      <div className="flex flex-wrap gap-2">
        {categories.map((cat) => {
          const count = cat === ALL_CATEGORIES
            ? allQuestions.length
            : allQuestions.filter((q) => q.category === cat).length;
          return (
            <button key={cat} onClick={() => setActiveCategory(cat)}
              className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                activeCategory === cat
                  ? "bg-blue-900 text-white border-blue-900"
                  : "bg-white text-slate-600 border-slate-200 hover:border-blue-300"
              }`}>
              {cat}{" "}
              <span className={activeCategory === cat ? "text-blue-200" : "text-slate-400"}>{count}</span>
            </button>
          );
        })}
      </div>

      {/* Progress header */}
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
          <span className="bg-blue-900 text-white text-xs font-bold rounded-full w-7 h-7 flex-shrink-0 flex items-center justify-center">
            {q.id <= 999 ? q.id : current + 1}
          </span>
          <div className="flex-1">
            <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full mr-2">
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

        {/* Choices */}
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
              if (isCorrect) {
                style += "border-green-500 bg-green-50 text-green-900 font-medium";
              } else if (isSelected && !isCorrect) {
                style += "border-red-400 bg-red-50 text-red-800";
              } else {
                style += "border-slate-200 text-slate-400";
              }
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
            className="w-full py-3 rounded-xl bg-blue-900 text-white font-medium text-sm hover:bg-blue-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
            Submit Answer
          </button>
        ) : (
          <>
            {/* Result feedback */}
            <div className={`rounded-xl p-4 border text-sm space-y-2 ${
              savedState?.state === "correct" ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"
            }`}>
              <div className={`font-semibold ${savedState?.state === "correct" ? "text-green-800" : "text-red-800"}`}>
                {savedState?.state === "correct" ? "Correct!" : "Incorrect"} — Best answer:{" "}
                {q.correctAnswer}. {q.correctAnswerText}
              </div>

              {/* Only show explanation in Study Mode */}
              {viewMode === "study" && (
                <>
                  {q.explanation && (
                    <p className="text-slate-700 leading-relaxed">{q.explanation}</p>
                  )}
                  {q.source && (
                    <p className="text-xs text-slate-500 italic border-t border-slate-200 pt-2 mt-2">
                      Source: {q.source}
                    </p>
                  )}
                </>
              )}

              {/* Test mode hint to review later */}
              {viewMode === "test" && savedState?.state === "incorrect" && (
                <p className="text-xs text-slate-500">
                  Switch to Study Mode to see the explanation.
                </p>
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
                className="flex-1 py-3 rounded-xl bg-blue-900 text-white font-medium text-sm hover:bg-blue-800 transition-colors">
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

  // Group questions by category, preserving quiz order
  const groups: { category: string; items: { q: Question; idx: number }[] }[] = [];
  const seen = new Map<string, { q: Question; idx: number }[]>();
  questions.forEach((q, idx) => {
    if (!seen.has(q.category)) {
      seen.set(q.category, []);
      groups.push({ category: q.category, items: seen.get(q.category)! });
    }
    seen.get(q.category)!.push({ q, idx });
  });

  // Auto-open the group containing the current question
  const currentCategory = currentIdx !== undefined ? questions[currentIdx]?.category : undefined;

  const toggleGroup = (cat: string) => {
    setOpenGroups((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
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
              {/* Category header row */}
              <button
                onClick={() => toggleGroup(category)}
                className="w-full px-4 py-3 flex items-center gap-3 hover:bg-slate-50 transition-colors text-left"
              >
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

              {/* Question list */}
              {open && (
                <div className="border-t border-slate-100 max-h-64 overflow-y-auto">
                  {items.map(({ q, idx }) => {
                    const state = progress[q.id]?.state;
                    const isCurrent = idx === currentIdx;
                    return (
                      <button
                        key={q.id}
                        onClick={() => onJump(idx)}
                        className={`w-full text-left px-4 py-2.5 flex items-center gap-3 text-sm transition-colors hover:bg-slate-50 ${
                          isCurrent ? "bg-blue-50 border-l-2 border-blue-500" : "border-l-2 border-transparent"
                        }`}
                      >
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
