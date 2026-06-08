"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Question } from "@/types/question";
import { questions as builtInQuestions } from "@/data/questions";

const ADMIN_AUTH_KEY = "picu_admin_auth";
const STORAGE_KEY = "picu_custom_questions";
const EMPTY_CHOICES = { A: "", B: "", C: "", D: "" };

type Tab = "add" | "manage";

export default function AdminDashboard() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("add");
  const [customQuestions, setCustomQuestions] = useState<Question[]>([]);
  const [saved, setSaved] = useState(false);
  const [extraLetters, setExtraLetters] = useState<string[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [form, setForm] = useState({
    title: "",
    scenario: "",
    choices: { ...EMPTY_CHOICES } as Record<string, string>,
    correctAnswer: "A",
    explanation: "",
    source: "",
    category: "Custom",
  });

  useEffect(() => {
    if (localStorage.getItem(ADMIN_AUTH_KEY) !== "true") {
      router.replace("/admin");
      return;
    }
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try { setCustomQuestions(JSON.parse(stored)); } catch {}
    }
  }, [router]);

  const allLetters = ["A", "B", "C", "D", ...extraLetters];

  const updateChoice = (letter: string, value: string) =>
    setForm((f) => ({ ...f, choices: { ...f.choices, [letter]: value } }));

  const addChoice = () => {
    const next = String.fromCharCode(65 + allLetters.length);
    if (next > "F") return;
    setExtraLetters((l) => [...l, next]);
    setForm((f) => ({ ...f, choices: { ...f.choices, [next]: "" } }));
  };

  const resetForm = () => {
    setForm({ title: "", scenario: "", choices: { ...EMPTY_CHOICES }, correctAnswer: "A", explanation: "", source: "", category: "Custom" });
    setExtraLetters([]);
    setEditingId(null);
  };

  const saveToStorage = (qs: Question[]) => {
    setCustomQuestions(qs);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(qs));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const filledChoices: Record<string, string> = {};
    for (const l of allLetters) {
      if (form.choices[l]?.trim()) filledChoices[l] = form.choices[l].trim();
    }
    if (Object.keys(filledChoices).length < 2) {
      alert("Please fill in at least 2 answer choices.");
      return;
    }
    if (!filledChoices[form.correctAnswer]) {
      alert("Correct answer choice must have text.");
      return;
    }

    if (editingId !== null) {
      // Update existing
      const updated = customQuestions.map((q) =>
        q.id === editingId
          ? { ...q, title: form.title.trim(), scenario: form.scenario.trim(), choices: filledChoices, correctAnswer: form.correctAnswer, correctAnswerText: filledChoices[form.correctAnswer], explanation: form.explanation.trim(), source: form.source.trim(), category: form.category.trim() }
          : q
      );
      saveToStorage(updated);
    } else {
      // New question
      const allIds = [...builtInQuestions, ...customQuestions].map((q) => q.id);
      const maxId = allIds.length > 0 ? Math.max(...allIds) : 10000;
      const newQ: Question = {
        id: maxId + 1,
        title: form.title.trim() || "Custom Question",
        scenario: form.scenario.trim(),
        choices: filledChoices,
        correctAnswer: form.correctAnswer,
        correctAnswerText: filledChoices[form.correctAnswer],
        explanation: form.explanation.trim(),
        source: form.source.trim(),
        category: form.category.trim() || "Custom",
      };
      saveToStorage([...customQuestions, newQ]);
    }

    setSaved(true);
    resetForm();
    setTimeout(() => setSaved(false), 3000);
  };

  const handleEdit = (q: Question) => {
    setForm({
      title: q.title,
      scenario: q.scenario,
      choices: { ...EMPTY_CHOICES, ...q.choices },
      correctAnswer: q.correctAnswer ?? "A",
      explanation: q.explanation ?? "",
      source: q.source ?? "",
      category: q.category,
    });
    const letters = Object.keys(q.choices).sort();
    const extra = letters.filter((l) => !["A", "B", "C", "D"].includes(l));
    setExtraLetters(extra);
    setEditingId(q.id);
    setTab("add");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = (id: number) => {
    if (!confirm("Delete this question?")) return;
    saveToStorage(customQuestions.filter((q) => q.id !== id));
  };

  const handleLogout = () => {
    localStorage.removeItem(ADMIN_AUTH_KEY);
    router.push("/admin");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-blue-900">Admin Dashboard</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {builtInQuestions.length} built-in · {customQuestions.length} custom questions
          </p>
        </div>
        <button
          onClick={handleLogout}
          className="text-sm text-slate-500 hover:text-red-600 border border-slate-200 px-3 py-1.5 rounded-lg hover:border-red-300 transition-colors"
        >
          Sign Out
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
        {([["add", editingId ? "Edit Question" : "Add Question"], ["manage", `Manage (${customQuestions.length})`]] as [Tab, string][]).map(([t, label]) => (
          <button
            key={t}
            onClick={() => { setTab(t); if (t === "add" && editingId) resetForm(); }}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${tab === t ? "bg-white text-blue-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Add / Edit Form */}
      {tab === "add" && (
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-5">
          {editingId && (
            <div className="flex items-center justify-between bg-amber-50 border border-amber-200 rounded-lg px-4 py-2 text-sm text-amber-800">
              <span>Editing custom question #{editingId}</span>
              <button type="button" onClick={resetForm} className="text-amber-600 hover:text-amber-900 font-medium">
                Cancel Edit
              </button>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Question Title / Topic <span className="text-red-400">*</span></label>
            <input type="text" required value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="e.g. Management of severe sepsis in a 5-year-old"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Clinical Scenario (optional)</label>
            <textarea rows={4} value={form.scenario}
              onChange={(e) => setForm((f) => ({ ...f, scenario: e.target.value }))}
              placeholder="Describe the patient presentation or question stem…"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Answer Choices <span className="text-red-400">*</span></label>
            <div className="space-y-2">
              {allLetters.map((letter) => (
                <div key={letter} className="flex gap-2 items-center">
                  <span className={`w-7 h-7 rounded-full text-xs font-bold flex items-center justify-center flex-shrink-0 ${form.correctAnswer === letter ? "bg-green-500 text-white" : "bg-slate-100 text-slate-600"}`}>
                    {letter}
                  </span>
                  <input type="text" value={form.choices[letter] || ""}
                    onChange={(e) => updateChoice(letter, e.target.value)}
                    placeholder={`Choice ${letter}`}
                    className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </div>
              ))}
            </div>
            {allLetters.length < 6 && (
              <button type="button" onClick={addChoice} className="mt-2 text-xs text-blue-600 hover:text-blue-800 transition-colors">
                + Add another choice
              </button>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Correct Answer <span className="text-red-400">*</span></label>
            <div className="flex gap-2 flex-wrap">
              {allLetters.map((l) => (
                <button key={l} type="button"
                  onClick={() => setForm((f) => ({ ...f, correctAnswer: l }))}
                  className={`w-10 h-10 rounded-lg text-sm font-bold border transition-colors ${form.correctAnswer === l ? "bg-green-500 text-white border-green-500" : "bg-white text-slate-600 border-slate-200 hover:border-green-300"}`}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Explanation</label>
            <textarea rows={4} value={form.explanation}
              onChange={(e) => setForm((f) => ({ ...f, explanation: e.target.value }))}
              placeholder="Explain why the correct answer is best…"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Source (optional)</label>
              <input type="text" value={form.source}
                onChange={(e) => setForm((f) => ({ ...f, source: e.target.value }))}
                placeholder="e.g. Rogers' Handbook, Ch. 12"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
              <input type="text" value={form.category}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
          </div>

          <div className="flex gap-3">
            <button type="submit"
              className="flex-1 py-3 bg-blue-900 text-white font-medium rounded-xl hover:bg-blue-800 transition-colors"
            >
              {editingId ? "Save Changes" : "Add Question"}
            </button>
            {editingId && (
              <button type="button" onClick={resetForm}
                className="px-6 py-3 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
            )}
          </div>

          {saved && (
            <div className="text-center text-green-600 text-sm font-medium bg-green-50 border border-green-200 rounded-lg py-2">
              {editingId ? "Question updated!" : "Question saved!"} It will appear in the quiz.
            </div>
          )}
        </form>
      )}

      {/* Manage Questions */}
      {tab === "manage" && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          {customQuestions.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <p className="text-4xl mb-3">📝</p>
              <p>No custom questions yet.</p>
              <button onClick={() => setTab("add")} className="mt-3 text-blue-600 text-sm hover:underline">
                Add your first question
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {customQuestions.map((q) => (
                <div key={q.id} className="border border-slate-100 rounded-xl p-4 hover:border-slate-200 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                          {q.category}
                        </span>
                      </div>
                      <p className="text-sm font-medium text-slate-800 truncate">{q.title}</p>
                      {q.scenario && (
                        <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{q.scenario}</p>
                      )}
                      <div className="flex gap-3 mt-2">
                        {Object.entries(q.choices).map(([l, text]) => (
                          <span key={l} className={`text-xs px-2 py-0.5 rounded-full border ${l === q.correctAnswer ? "bg-green-50 border-green-300 text-green-700 font-semibold" : "bg-slate-50 border-slate-200 text-slate-500"}`}>
                            {l}. {text.length > 20 ? text.slice(0, 20) + "…" : text}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <button onClick={() => handleEdit(q)}
                        className="text-xs text-blue-600 hover:text-blue-800 border border-blue-200 hover:border-blue-400 px-3 py-1.5 rounded-lg transition-colors"
                      >
                        Edit
                      </button>
                      <button onClick={() => handleDelete(q.id)}
                        className="text-xs text-red-500 hover:text-red-700 border border-red-200 hover:border-red-400 px-3 py-1.5 rounded-lg transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
