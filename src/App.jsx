import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  Plus, Check, Clock, BookOpen, NotebookPen, ChevronDown, X, Play, Pause,
  RotateCcw, Flame, Star, ArrowLeft, ChevronRight, BookMarked, HelpCircle, Send,
} from "lucide-react";

/* ---------------------------------- THEME ---------------------------------- */
const C = {
  bg: "#10151D",
  surface: "#1A212C",
  surfaceAlt: "#212A38",
  border: "#2A3444",
  borderSoft: "#232C3A",
  text: "#EDF1F7",
  textDim: "#8D97A8",
  textFaint: "#5C6779",
  green: "#3ECF8E",
  greenSoft: "rgba(62,207,142,0.14)",
  blue: "#6C8EFF",
  blueSoft: "rgba(108,142,255,0.14)",
  red: "#F2685C",
  redSoft: "rgba(242,104,92,0.14)",
  amber: "#F4B860",
  amberSoft: "rgba(244,184,96,0.14)",
  purple: "#9B8CFF",
  purpleSoft: "rgba(155,140,255,0.14)",
  teal: "#34D8C2",
  tealSoft: "rgba(52,216,194,0.14)",
};

const CATEGORY_PALETTE = [
  { color: C.blue, soft: C.blueSoft },
  { color: C.green, soft: C.greenSoft },
  { color: C.amber, soft: C.amberSoft },
  { color: C.teal, soft: C.tealSoft },
  { color: C.red, soft: C.redSoft },
  { color: C.purple, soft: C.purpleSoft },
];

function hashStr(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function categoryStyle(name) {
  const clean = (name || "").trim();
  if (!clean) return { color: C.textDim, soft: C.surfaceAlt, label: "Uncategorized" };
  const idx = hashStr(clean.toLowerCase()) % CATEGORY_PALETTE.length;
  return { ...CATEGORY_PALETTE[idx], label: clean };
}

const STUDY_METHODS = [
  {
    id: "recall",
    title: "Active Recall",
    why: "Forces your brain to retrieve information instead of just re-reading it — retrieval is what actually builds long-term memory.",
    action: "Close the textbook. Write down everything you remember on a blank page. Then open the book and correct mistakes in red ink.",
  },
  {
    id: "spaced",
    title: "Spaced Repetition",
    why: "Reviewing right before you'd naturally forget strengthens the memory more than cramming everything at once.",
    action: "Review this topic again on Day 1, Day 3, Day 7, and Day 30. Mark each review on your calendar as you go.",
  },
  {
    id: "feynman",
    title: "The Feynman Technique",
    why: "If you can't explain it simply, you don't understand it yet — this exposes gaps before the exam does.",
    action: "Explain the topic out loud in plain language, as if teaching it to a 10-year-old. Simplify wherever you get stuck.",
  },
];

const TIMER_MODES = [
  { id: "pomodoro", label: "Classic Pomodoro", sub: "25 min work · 5 min break" },
  { id: "rule5217", label: "52/17 Rule", sub: "52 min work · 17 min rest" },
  { id: "flowtime", label: "Flowtime", sub: "Open stopwatch, earns your break" },
  { id: "momentum", label: "2-Min Momentum Boost", sub: "Beat procrastination now" },
];

const todayKey = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

const fmt = (totalSeconds) => {
  const m = Math.floor(Math.abs(totalSeconds) / 60);
  const s = Math.abs(totalSeconds) % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
};

function playChime() {
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    const ctx = new AC();
    if (ctx.state === "suspended") {
      ctx.resume();
    }
    const notes = [660, 880];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      const start = ctx.currentTime + i * 0.22;
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(0.18, start + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.6);
      osc.connect(gain).connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 0.65);
    });
  } catch (e) {
    /* fail silently */
  }
}

const greetingFor = (hour) => {
  if (hour < 5) return "Still up? Rest matters too.";
  if (hour < 12) return "Good morning. Fresh start.";
  if (hour < 17) return "Good afternoon. Keep the momentum.";
  if (hour < 21) return "Good evening. Finish strong.";
  return "Late one — one more focused block?";
};

const FOCUS_LETTERS = [
  { ch: "F", x: 46, y: 45, rot: -4 },
  { ch: "O", x: 53, y: 46, rot: 3 },
  { ch: "C", x: 60, y: 44.5, rot: -2 },
  { ch: "U", x: 67, y: 46, rot: 4 },
  { ch: "S", x: 74, y: 45, rot: -3 },
];
const PLAN_LETTERS = [
  { ch: "P", x: 48, y: 103, rot: -3 },
  { ch: "L", x: 55, y: 104, rot: 2 },
  { ch: "A", x: 62, y: 102, rot: -2 },
  { ch: "N", x: 69, y: 104, rot: 3 },
];

function Logo({ size = 32 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 120 150" fill="none">
      <defs>
        <clipPath id="topSandClip">
          <path d="M37 43.5 L83 43.5 L64 72 L56 72 Z" />
        </clipPath>
        <clipPath id="bottomSandClip">
          <path d="M30 118 Q45 100 60 100 Q75 100 90 118 L102 135 L18 135 Z" />
        </clipPath>
        <linearGradient id="sandGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFD9A0" />
          <stop offset="45%" stopColor={C.amber} />
          <stop offset="100%" stopColor="#C97F2E" />
        </linearGradient>
      </defs>
      <rect x="10" y="6" width="100" height="9" rx="3.5" fill={C.textDim} />
      <rect x="10" y="135" width="100" height="9" rx="3.5" fill={C.textDim} />
      <rect x="10" y="6" width="4" height="138" fill={C.textFaint} />
      <rect x="106" y="6" width="4" height="138" fill={C.textFaint} />
      <path d="M18 15 L102 15 L64 72 L56 72 Z" fill="rgba(237,241,247,0.05)" stroke={C.textFaint} strokeWidth="2" />
      <path d="M56 81 L64 81 L102 135 L18 135 Z" fill="rgba(237,241,247,0.03)" stroke={C.textFaint} strokeWidth="2" />
      <path d="M37 43.5 C44 42.8 51 44.2 58 43.3 C64 42.6 70 44 76 43.2 C79 42.8 81 43.2 83 43.5 L64 72 L56 72 Z" fill="url(#sandGrad)" />
      <path d="M39 43.7 C46 43 53 44.1 60 43.2 C66 42.7 72 43.9 78 43.1" stroke="#FFE9C2" strokeWidth="0.6" opacity="0.5" fill="none" />
      <path d="M30 118 C38 106 46 100 55 101 C62 102 68 99 75 101 C82 103 86 108 90 118 L102 135 L18 135 Z" fill="url(#sandGrad)" />
      <ellipse cx="58" cy="102" rx="11" ry="2.4" fill="#FFE9C2" opacity="0.35" />
      <ellipse cx="60" cy="75" rx="0.9" ry="1.6" fill="url(#sandGrad)" />
      <ellipse cx="59.5" cy="80" rx="0.8" ry="1.4" fill="url(#sandGrad)" />
      <ellipse cx="60.5" cy="86" rx="0.9" ry="1.6" fill="url(#sandGrad)" />
      {FOCUS_LETTERS.map((l, i) => (
        <text key={`f${i}`} x={l.x} y={l.y} transform={`rotate(${l.rot} ${l.x} ${l.y})`} textAnchor="middle" fontFamily="'IBM Plex Mono', monospace" fontWeight="700" fontSize="11.5" fill="#F5F7FA" stroke="#0A0D12" strokeWidth="0.5">
          {l.ch}
        </text>
      ))}
      {FOCUS_LETTERS.map((l, i) => (
        <ellipse key={`fb${i}`} cx={l.x} cy={l.y + 0.5} rx="4.2" ry="1.8" fill="url(#sandGrad)" opacity="0.88" />
      ))}
      {PLAN_LETTERS.map((l, i) => (
        <text key={`p${i}`} x={l.x} y={l.y} transform={`rotate(${l.rot} ${l.x} ${l.y})`} textAnchor="middle" fontFamily="'IBM Plex Mono', monospace" fontWeight="700" fontSize="10.5" fill="#F5F7FA" stroke="#0A0D12" strokeWidth="0.5">
          {l.ch}
        </text>
      ))}
      {PLAN_LETTERS.map((l, i) => (
        <ellipse key={`pb${i}`} cx={l.x} cy={l.y + 0.4} rx="3.8" ry="1.6" fill="url(#sandGrad)" opacity="0.88" />
      ))}
    </svg>
  );
}

function AppHeader({ notifPermission, onRequestNotif }) {
  return (
    <div className="sticky top-0 z-10 flex items-center justify-between gap-2.5 px-5 py-3" style={{ background: C.bg, borderBottom: `1px solid ${C.borderSoft}` }}>
      <div className="flex items-center gap-2.5">
        <Logo size={30} />
        <span className="text-base font-semibold" style={{ color: C.text, fontFamily: "'Lexend', sans-serif" }}>FocusPlus</span>
      </div>
      <button onClick={onRequestNotif} className="text-xs font-medium px-2.5 py-1.5 rounded-full" style={{ color: notifPermission === "granted" ? C.green : C.textDim, background: notifPermission === "granted" ? C.greenSoft : C.surfaceAlt, border: `1px solid ${notifPermission === "granted" ? C.green : C.border}` }}>
        {notifPermission === "granted" ? "Reminders on" : "Enable reminders"}
      </button>
    </div>
  );
}

/* ---------------------------------- ATOMS ---------------------------------- */
function Chip({ active, color, soft, onClick, children }) {
  return (
    <button type="button" onClick={onClick} className="px-3 py-1.5 rounded-full text-sm font-medium transition-all" style={{ background: active ? soft : "transparent", color: active ? color : C.textDim, border: `1px solid ${active ? color : C.border}` }}>
      {children}
    </button>
  );
}

function ScreenHeader({ title, onBack }) {
  return (
    <div className="flex items-center gap-3 px-5 pt-6 pb-2">
      {onBack && (
        <button onClick={onBack} style={{ color: C.textDim }}><ArrowLeft size={20} /></button>
      )}
      <h1 className="text-xl font-semibold" style={{ color: C.text, fontFamily: "'Lexend', sans-serif" }}>{title}</h1>
    </div>
  );
}

/* ---------------------------------- TODAY'S GOALS ---------------------------------- */
const CHECK_METHODS = [
  { id: "notes", label: "Wrote key points" },
  { id: "mcq", label: "Solved MCQs" },
  { id: "both", label: "Both" },
  { id: "read", label: "Just read" },
];

function CompletionCheckModal({ goal, onClose, onSave }) {
  const [stage, setStage] = useState("input");
  const [method, setMethod] = useState(null);
  const [attempted, setAttempted] = useState("");
  const [correct, setCorrect] = useState("");
  const [missed, setMissed] = useState("");
  const [pendingReview, setPendingReview] = useState(null);

  const hasMcq = method === "mcq" || method === "both";
  const attemptedNum = parseInt(attempted, 10);
  const correctNum = parseInt(correct, 10);
  const hasScore = hasMcq && attemptedNum > 0 && correctNum >= 0 && correctNum <= attemptedNum;
  const percentage = hasScore ? Math.round((correctNum / attemptedNum) * 100) : null;
  const goodScore = percentage !== null && percentage >= 70;
  const excellentScore = percentage !== null && percentage > 90;

  function handlePrimarySubmit(e) {
    e.preventDefault();
    if (!method) return;
    const review = hasScore ? { method, attempted: attemptedNum, correct: correctNum, percentage, tryHarder: excellentScore } : { method };
    if (goodScore) {
      setPendingReview(review);
      setStage("reviewPrompt");
    } else {
      onSave(review, null);
    }
  }

  function handleReviewSubmit(e) {
    e.preventDefault();
    onSave(pendingReview, missed.trim() || null);
  }

  return (
    <div className="fixed inset-0 z-30 flex items-end" style={{ background: "rgba(6,9,14,0.6)" }}>
      {stage === "input" ? (
        <form onSubmit={handlePrimarySubmit} className="w-full rounded-t-3xl p-5 flex flex-col gap-4" style={{ background: C.surface, borderTop: `1px solid ${C.border}` }}>
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold" style={{ color: C.text, fontFamily: "'Lexend', sans-serif" }}>Quick check</h3>
            <button type="button" onClick={onClose}><X size={20} style={{ color: C.textDim }} /></button>
          </div>
          <p className="text-sm" style={{ color: C.textDim }}>{goal.title}</p>
          <div>
            <label className="text-xs font-medium" style={{ color: C.textDim }}>Did you write key points, solve MCQs, or both?</label>
            <div className="flex flex-wrap gap-2 mt-1.5">
              {CHECK_METHODS.map((m) => (
                <Chip key={m.id} active={method === m.id} color={C.blue} soft={C.blueSoft} onClick={() => setMethod(m.id)}>{m.label}</Chip>
              ))}
            </div>
          </div>
          {hasMcq && (
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="text-xs font-medium" style={{ color: C.textDim }}>Attempted</label>
                <input type="number" min="0" value={attempted} onChange={(e) => setAttempted(e.target.value)} className="w-full mt-1.5 rounded-xl px-3 py-2.5 text-sm outline-none" style={{ background: C.surfaceAlt, color: C.text, border: `1px solid ${C.border}` }} />
              </div>
              <div className="flex-1">
                <label className="text-xs font-medium" style={{ color: C.textDim }}>Correct</label>
                <input type="number" min="0" value={correct} onChange={(e) => setCorrect(e.target.value)} className="w-full mt-1.5 rounded-xl px-3 py-2.5 text-sm outline-none" style={{ background: C.surfaceAlt, color: C.text, border: `1px solid ${C.border}` }} />
              </div>
            </div>
          )}
          <button type="submit" disabled={!method} className="w-full py-3 rounded-xl font-semibold text-sm" style={{ background: method ? C.blue : C.surfaceAlt, color: method ? "#0B0F15" : C.textFaint }}>Mark complete</button>
        </form>
      ) : (
        <form onSubmit={handleReviewSubmit} className="w-full rounded-t-3xl p-5 flex flex-col gap-4" style={{ background: C.surface, borderTop: `1px solid ${C.border}` }}>
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold" style={{ color: C.text, fontFamily: "'Lexend', sans-serif" }}>Nice, {percentage}%</h3>
            <button type="button" onClick={onClose}><X size={20} style={{ color: C.textDim }} /></button>
          </div>
          {excellentScore && (
            <div className="rounded-xl px-3 py-2.5" style={{ background: C.amberSoft, border: `1px solid ${C.amber}` }}>
              <p className="text-sm font-medium" style={{ color: C.amber }}>90%+ — these questions are too easy now. Try a harder question set next time.</p>
            </div>
          )}
          <p className="text-sm" style={{ color: C.textDim }}>Good score. What did you get wrong or not remember?</p>
          <textarea autoFocus value={missed} onChange={(e) => setMissed(e.target.value)} rows={4} placeholder="e.g. sign convention in mirror formula, formula for terminal velocity..." className="w-full rounded-xl px-3 py-2.5 text-sm outline-none resize-none" style={{ background: C.surfaceAlt, color: C.text, border: `1px solid ${C.border}` }} />
          <button type="submit" className="w-full py-3 rounded-xl font-semibold text-sm" style={{ background: C.green, color: "#0B0F15" }}>Save to review tab</button>
          <button type="button" onClick={() => onSave(pendingReview, null)} className="text-xs font-medium text-center" style={{ color: C.textFaint }}>Skip</button>
        </form>
      )}
    </div>
  );
}

function GoalsTab({ goals, setGoals, onOpenTimerFor, addReviewItem }) {
  const [showForm, setShowForm] = useState(false);
  const [expandedCompleted, setExpandedCompleted] = useState(false);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [method, setMethod] = useState(STUDY_METHODS[0].id);
  const [timerMode, setTimerMode] = useState(TIMER_MODES[0].id);
  const [checkGoal, setCheckGoal] = useState(null);

  const active = goals.filter((g) => !g.completed);
  const completed = goals.filter((g) => g.completed);
  const total = goals.length;

  const hour = new Date().getHours();
  const dateStr = new Date().toLocaleDateString("en-IN", { weekday: "long", month: "long", day: "numeric" });
  const noGoalsYetLate = hour >= 18 && total === 0;

  const hotStreak = useMemo(() => {
    const byCategory = {};
    const completedSorted = [...completed].sort((a, b) => (a.completedAt || "").localeCompare(b.completedAt || ""));
    completedSorted.forEach((g) => {
      if (!g.review || g.review.percentage == null) return;
      byCategory[g.category] = byCategory[g.category] || [];
      byCategory[g.category].push(g.review.percentage > 90);
    });
    for (const [catId, arr] of Object.entries(byCategory)) {
      let streak = 0;
      for (let i = arr.length - 1; i >= 0; i--) {
        if (arr[i]) streak++; else break;
      }
      if (streak >= 3) return { catId, streak };
    }
    return null;
  }, [completed]);

  function resetForm() {
    setTitle("");
    setCategory("");
    setMethod(STUDY_METHODS[0].id);
    setTimerMode(TIMER_MODES[0].id);
  }

  function addGoal(e) {
    e.preventDefault();
    if (!title.trim()) return;
    setGoals((prev) => [
      ...prev,
      {
        id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(),
        title: title.trim(),
        category,
        method,
        timerMode,
        completed: false,
        createdAt: new Date().toISOString(),
      },
    ]);
    resetForm();
    setShowForm(false);
  }

  function toggleGoal(id) {
    const g = goals.find((x) => x.id === id);
    if (!g) return;
    if (g.completed) {
      setGoals((prev) => prev.map((x) => (x.id === id ? { ...x, completed: false } : x)));
    } else {
      setCheckGoal(g);
    }
  }

  function finishCompletion(review, missedNotes) {
    setGoals((prev) => prev.map((x) => (x.id === checkGoal.id ? { ...x, completed: true, review, completedAt: new Date().toISOString() } : x)));
    if (missedNotes) {
      addReviewItem({ goalTitle: checkGoal.title, category: checkGoal.category, percentage: review?.percentage ?? null, missed: missedNotes });
    } else if (review?.percentage !== null && review?.percentage !== undefined && review.percentage < 70) {
      addReviewItem({ goalTitle: checkGoal.title, category: checkGoal.category, percentage: review.percentage, missed: null, needsReread: true });
    }
    setCheckGoal(null);
  }

  return (
    <div className="pb-28">
      <div className="px-5 pt-6">
        <p className="text-sm" style={{ color: C.textDim, fontFamily: "'Lexend', sans-serif" }}>{dateStr}</p>
        <h1 className="text-2xl font-semibold mt-1" style={{ color: C.text, fontFamily: "'Lexend', sans-serif" }}>{greetingFor(hour)}</h1>
      </div>
      {noGoalsYetLate && (
        <div className="mx-5 mt-5 rounded-2xl p-4 flex items-center justify-between" style={{ background: C.amberSoft, border: `1px solid ${C.amber}` }}>
          <p className="text-sm" style={{ color: C.amber }}>No goals added yet today. Quick, add one before you lose the day.</p>
          <button onClick={() => setShowForm(true)} className="shrink-0 ml-2 w-8 h-8 rounded-full flex items-center justify-center" style={{ background: C.amber }}><Plus size={16} color="#0B0F15" /></button>
        </div>
      )}
      {hotStreak && (
        <div className="mx-5 mt-5 rounded-2xl p-4" style={{ background: C.blueSoft, border: `1px solid ${C.blue}` }}>
          <p className="text-sm font-medium" style={{ color: C.blue }}>🔥 {hotStreak.streak} in a row above 90% in {hotStreak.catId}. Step up to harder questions.</p>
        </div>
      )}
      <div className="mx-5 mt-5 rounded-2xl p-4" style={{ background: C.surface, border: `1px solid ${C.borderSoft}` }}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm" style={{ color: C.textDim }}>Today's progress</span>
          <span className="text-sm font-semibold" style={{ color: C.green }}>{completed.length} of {total || 0} goals</span>
        </div>
        <div className="h-2 rounded-full overflow-hidden" style={{ background: C.surfaceAlt }}>
          <div className="h-full rounded-full transition-all" style={{ width: total ? `${(completed.length / total) * 100}%` : "0%", background: C.green }} />
        </div>
      </div>
      <div className="px-5 mt-6 flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide" style={{ color: C.textFaint }}>Active</h2>
      </div>
      <div className="px-5 mt-3 flex flex-col gap-3">
        {active.length === 0 && (
          <div className="rounded-2xl p-6 text-center" style={{ background: C.surface, border: `1px dashed ${C.border}` }}>
            <p className="text-sm" style={{ color: C.textDim }}>No goals yet. Add your first one for today.</p>
          </div>
        )}
        {active.map((g) => {
          const cat = categoryStyle(g.category);
          return (
            <div key={g.id} className="rounded-2xl p-4 flex items-start gap-3" style={{ background: C.surface, border: `1px solid ${C.borderSoft}` }}>
              <button onClick={() => toggleGoal(g.id)} className="mt-0.5 w-6 h-6 rounded-full flex items-center justify-center shrink-0" style={{ border: `2px solid ${C.textFaint}` }} />
              <button className="flex-1 text-left" onClick={() => onOpenTimerFor(g)}>
                <p className="text-sm font-medium" style={{ color: C.text, fontFamily: "'Lexend', sans-serif" }}>{g.title}</p>
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ color: cat.color, background: cat.soft }}>{cat.label}</span>
                  <span className="text-xs flex items-center gap-1" style={{ color: C.textDim }}><Clock size={12} /> {TIMER_MODES.find((t) => t.id === g.timerMode)?.label}</span>
                </div>
              </button>
              <ChevronRight size={16} style={{ color: C.textFaint }} className="mt-1 shrink-0" />
            </div>
          );
        })}
      </div>
      {completed.length > 0 && (
        <div className="px-5 mt-6">
          <button onClick={() => setExpandedCompleted((v) => !v)} className="w-full flex items-center justify-between rounded-2xl p-4" style={{ background: C.surface, border: `1px solid ${C.borderSoft}` }}>
            <span className="text-sm font-medium" style={{ color: C.textDim }}>Completed ({completed.length})</span>
            <ChevronDown size={16} style={{ color: C.textFaint, transform: expandedCompleted ? "rotate(180deg)" : "none", transition: "transform .2s" }} />
          </button>
          {expandedCompleted && (
            <div className="mt-2 flex flex-col gap-2">
              {completed.map((g) => {
                const cat = categoryStyle(g.category);
                return (
                  <div key={g.id} className="rounded-xl p-3 flex items-center gap-3" style={{ background: C.surfaceAlt }}>
                    <button onClick={() => toggleGoal(g.id)} className="w-5 h-5 rounded-full flex items-center justify-center shrink-0" style={{ background: C.green }}><Check size={12} color={C.bg} strokeWidth={3} /></button>
                    <div className="flex-1">
                      <p className="text-sm line-through" style={{ color: C.textFaint }}>{g.title}</p>
                      {g.review?.percentage != null && (
                        <span className="text-xs" style={{ color: g.review.percentage >= 70 ? C.green : C.red }}>{g.review.correct}/{g.review.attempted} · {g.review.percentage}%{g.review.tryHarder ? " 🔥" : ""}</span>
                      )}
                    </div>
                    <span className="text-xs" style={{ color: cat.color }}>{cat.label}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
      <button onClick={() => setShowForm(true)} className="fixed bottom-24 right-5 w-14 h-14 rounded-full flex items-center justify-center shadow-lg" style={{ background: C.blue }}><Plus size={26} color="#0B0F15" strokeWidth={2.5} /></button>
      {showForm && (
        <div className="fixed inset-0 z-30 flex items-end" style={{ background: "rgba(6,9,14,0.6)" }}>
          <form onSubmit={addGoal} className="w-full rounded-t-3xl p-5 flex flex-col gap-4 max-h-[85vh] overflow-y-auto" style={{ background: C.surface, borderTop: `1px solid ${C.border}` }}>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold" style={{ color: C.text, fontFamily: "'Lexend', sans-serif" }}>New goal</h3>
              <button type="button" onClick={() => { setShowForm(false); resetForm(); }}><X size={20} style={{ color: C.textDim }} /></button>
            </div>
            <div>
              <label className="text-xs font-medium" style={{ color: C.textDim }}>Task title</label>
              <input autoFocus value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Finish Chapter 5 practice problems" className="w-full mt-1.5 rounded-xl px-3 py-2.5 text-sm outline-none" style={{ background: C.surfaceAlt, color: C.text, border: `1px solid ${C.border}` }} />
            </div>
            <div>
              <label className="text-xs font-medium" style={{ color: C.textDim }}>Category</label>
              <input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="e.g. Math, Science, English, Coding..." className="w-full mt-1.5 rounded-xl px-3 py-2.5 text-sm outline-none" style={{ background: C.surfaceAlt, color: C.text, border: `1px solid ${C.border}` }} />
            </div>
            <div>
              <label className="text-xs font-medium" style={{ color: C.textDim }}>Study method</label>
              <select value={method} onChange={(e) => setMethod(e.target.value)} className="w-full mt-1.5 rounded-xl px-3 py-2.5 text-sm outline-none" style={{ background: C.surfaceAlt, color: C.text, border: `1px solid ${C.border}` }}>
                {STUDY_METHODS.map((m) => (
                  <option key={m.id} value={m.id}>{m.title}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium" style={{ color: C.textDim }}>Timer mode</label>
              <select value={timerMode} onChange={(e) => setTimerMode(e.target.value)} className="w-full mt-1.5 rounded-xl px-3 py-2.5 text-sm outline-none" style={{ background: C.surfaceAlt, color: C.text, border: `1px solid ${C.border}` }}>
                {TIMER_MODES.map((t) => (
                  <option key={t.id} value={t.id}>{t.label}</option>
                ))}
              </select>
            </div>
            <button type="submit" className="w-full py-3 rounded-xl font-semibold text-sm mt-2" style={{ background: C.blue, color: "#0B0F15" }}>Add goal</button>
          </form>
        </div>
      )}
      {checkGoal && <CompletionCheckModal goal={checkGoal} onClose={() => setCheckGoal(null)} onSave={finishCompletion} />}
    </div>
  );
}

/* ---------------------------------- FOCUS TIMERS ---------------------------------- */
function TimerRing({ progress, color, children }) {
  const r = 90;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative w-56 h-56 mx-auto">
      <svg width="224" height="224" viewBox="0 0 224 224" className="-rotate-90">
        <circle cx="112" cy="112" r={r} fill="none" stroke={C.surfaceAlt} strokeWidth="10" />
        <circle cx="112" cy="112" r={r} fill="none" stroke={color} strokeWidth="10" strokeDasharray={c} strokeDashoffset={c - progress * c} strokeLinecap="round" style={{ transition: "stroke-dashoffset 1s linear" }} />
        {Array.from({ length: 12 }).map((_, i) => {
          const angle = (i / 12) * 2 * Math.PI;
          const x1 = 112 + Math.cos(angle) * 100;
          const y1 = 112 + Math.sin(angle) * 100;
          const x2 = 112 + Math.cos(angle) * 94;
          const y2 = 112 + Math.sin(angle) * 94;
          return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={C.border} strokeWidth="2" />;
        })}
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">{children}</div>
    </div>
  );
}

function TimersTab({ initialGoalId, initialGoalMode, initialGoalCategory, clearInitialGoal, onSession }) {
  const [mode, setMode] = useState(initialGoalMode || "pomodoro");
  const [linkedCategory, setLinkedCategory] = useState(initialGoalCategory || null);
  const [phase, setPhase] = useState("work");
  const [secondsLeft, setSecondsLeft] = useState(25 * 60);
  const [flowElapsed, setFlowElapsed] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef(null);

  const durations = { pomodoro: { work: 25 * 60, break: 5 * 60 }, rule5217: { work: 52 * 60, break: 17 * 60 }, momentum: { work: 120, break: 0 } };

  useEffect(() => {
    if (initialGoalId) {
      setMode(initialGoalMode || "pomodoro");
      setLinkedCategory(initialGoalCategory || null);
      clearInitialGoal && clearInitialGoal();
    }
  }, [initialGoalId, initialGoalMode, initialGoalCategory, clearInitialGoal]);

  useEffect(() => {
    setIsRunning(false);
    setPhase("work");
    setFlowElapsed(0);
    if (mode === "pomodoro") setSecondsLeft(25 * 60);
    else if (mode === "rule5217") setSecondsLeft(52 * 60);
    else if (mode === "momentum") setSecondsLeft(120);
    else setSecondsLeft(0);
  }, [mode]);

  useEffect(() => {
    if (!isRunning) return;
    intervalRef.current = setInterval(() => {
      if (mode === "flowtime") {
        setFlowElapsed((s) => s + 1);
        return;
      }
      setSecondsLeft((s) => {
        if (s <= 1) {
          playChime();
          if (window.Notification && Notification.permission === "granted") {
            try { new Notification("Timer done", { body: "Time's up — take a look at your next step." }); } catch (e) {}
          }
          if (mode === "momentum") {
            setIsRunning(false);
            onSession && onSession(2, linkedCategory);
            return 0;
          }
          if (phase === "work") {
            onSession && onSession(Math.round(durations[mode].work / 60), linkedCategory);
          }
          const nextPhase = phase === "work" ? "break" : "work";
          setPhase(nextPhase);
          return durations[mode][nextPhase];
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, [isRunning, mode, phase, linkedCategory, onSession]);

  function reset() {
    setIsRunning(false);
    setPhase("work");
    setFlowElapsed(0);
    if (mode === "pomodoro") setSecondsLeft(25 * 60);
    else if (mode === "rule5217") setSecondsLeft(52 * 60);
    else if (mode === "momentum") setSecondsLeft(120);
  }

  function pauseFlow() {
    setIsRunning(false);
    playChime();
    if (flowElapsed >= 60) onSession && onSession(Math.round(flowElapsed / 60), linkedCategory);
  }

  const suggestedBreak = Math.round((flowElapsed / 60 / 5)) * 1;
  const total = mode === "flowtime" ? null : durations[mode]?.[phase] || 120;
  const progress = mode === "flowtime" ? 1 : total ? 1 - secondsLeft / total : 0;
  const ringColor = phase === "break" ? C.green : mode === "momentum" ? C.amber : C.blue;

  return (
    <div className="pb-28">
      <ScreenHeader title="Focus Timers" />
      <div className="px-5 mt-2 flex flex-col gap-2">
        {TIMER_MODES.map((t) => (
          <button key={t.id} onClick={() => setMode(t.id)} className="w-full text-left rounded-2xl p-3.5 flex items-center justify-between" style={{ background: mode === t.id ? C.blueSoft : C.surface, border: `1px solid ${mode === t.id ? C.blue : C.borderSoft}` }}>
            <div>
              <p className="text-sm font-medium" style={{ color: mode === t.id ? C.blue : C.text, fontFamily: "'Lexend', sans-serif" }}>{t.label}</p>
              <p className="text-xs mt-0.5" style={{ color: C.textDim }}>{t.sub}</p>
            </div>
          </button>
        ))}
      </div>
      <div className="mt-8">
        <TimerRing progress={progress} color={ringColor}>
          <div className="text-center">
            {mode === "flowtime" ? (
              <>
                <p className="text-4xl font-semibold tabular-nums" style={{ color: C.text, fontFamily: "'IBM Plex Mono', monospace" }}>{fmt(flowElapsed)}</p>
                <p className="text-xs mt-1" style={{ color: C.textDim }}>elapsed</p>
              </>
            ) : (
              <>
                <p className="text-4xl font-semibold tabular-nums" style={{ color: C.text, fontFamily: "'IBM Plex Mono', monospace" }}>{fmt(secondsLeft)}</p>
                <p className="text-xs mt-1 uppercase tracking-wide" style={{ color: phase === "break" ? C.green : C.textDim }}>{mode === "momentum" ? "just start" : phase}</p>
              </>
            )}
          </div>
        </TimerRing>
        {mode === "flowtime" && !isRunning && flowElapsed > 0 && (
          <p className="text-center text-sm mt-4" style={{ color: C.green }}>Earned break: {suggestedBreak || 1} min</p>
        )}
        <div className="flex items-center justify-center gap-4 mt-8">
          <button onClick={() => { if (mode === "flowtime" && isRunning) pauseFlow(); else setIsRunning((r) => !r); }} className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: ringColor }}>
            {isRunning ? <Pause size={24} color="#0B0F15" /> : <Play size={24} color="#0B0F15" style={{ marginLeft: 2 }} />}
          </button>
          <button onClick={reset} className="w-14 h-14 rounded-full flex items-center justify-center" style={{ background: C.surfaceAlt, border: `1px solid ${C.border}` }}><RotateCcw size={18} style={{ color: C.textDim }} /></button>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------- STUDY METHODS ---------------------------------- */
function MethodsTab() {
  return (
    <div className="pb-28">
      <ScreenHeader title="Study Methods" />
      <div className="px-5 mt-2 flex flex-col gap-3">
        {STUDY_METHODS.map((m) => (
          <div key={m.id} className="rounded-2xl p-5" style={{ background: C.surface, border: `1px solid ${C.borderSoft}` }}>
            <div className="flex items-center gap-2 mb-2">
              <BookOpen size={16} style={{ color: C.blue }} />
              <h3 className="text-base font-semibold" style={{ color: C.text, fontFamily: "'Lexend', sans-serif" }}>{m.title}</h3>
            </div>
            <p className="text-xs font-semibold uppercase tracking-wide mt-3" style={{ color: C.textFaint }}>Why it works</p>
            <p className="text-sm mt-1" style={{ color: C.textDim }}>{m.why}</p>
            <p className="text-xs font-semibold uppercase tracking-wide mt-3" style={{ color: C.textFaint }}>Action step</p>
            <p className="text-sm mt-1" style={{ color: C.text }}>{m.action}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------------------------------- DAILY LOG ---------------------------------- */
function StarRating({ value, onChange }) {
  return (
    <div className="flex gap-1.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} type="button" onClick={() => onChange(n)}>
          <Star size={26} fill={n <= value ? C.amber : "none"} color={n <= value ? C.amber : C.border} />
        </button>
      ))}
    </div>
  );
}

function StressBar({ value, onChange }) {
  return (
    <div className="flex gap-1.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} type="button" onClick={() => onChange(n)} className="h-3 flex-1 rounded-full" style={{ background: n <= value ? C.red : C.surfaceAlt }} />
      ))}
    </div>
  );
}

function StreakGrid({ entries }) {
  const days = 35;
  const cells = [];
  const today = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = todayKey(d);
    const entry = entries.find((e) => e.date === key);
    cells.push({ key, focus: entry?.focus || 0 });
  }
  const colorFor = (f) => {
    if (!f) return C.surfaceAlt;
    const map = { 1: "rgba(62,207,142,0.25)", 2: "rgba(62,207,142,0.45)", 3: "rgba(62,207,142,0.6)", 4: "rgba(62,207,142,0.8)", 5: C.green };
    return map[f];
  };
  return (
    <div className="grid grid-cols-7 gap-1.5">
      {cells.map((c) => (
        <div key={c.key} className="aspect-square rounded-md" style={{ background: colorFor(c.focus) }} />
      ))}
    </div>
  );
}

function MonthCalendar({ entries, goals }) {
  const [cursor, setCursor] = useState(new Date());
  const [selected, setSelected] = useState(null);

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const firstDay = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startOffset = firstDay.getDay();
  const monthLabel = cursor.toLocaleDateString("en-IN", { month: "long", year: "numeric" });

  const cells = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  function keyFor(d) { return todayKey(new Date(year, month, d)); }
  function entryFor(d) { return entries.find((e) => e.date === keyFor(d)); }
  function goalsFor(d) { return (goals || []).filter((g) => g.completed && g.completedAt && todayKey(new Date(g.completedAt)) === keyFor(d)); }

  const selectedEntry = selected ? entryFor(selected) : null;
  const selectedGoals = selected ? goalsFor(selected) : [];
  const isToday = (d) => keyFor(d) === todayKey();

  return (
    <div className="mx-5 mt-6 rounded-2xl p-4" style={{ background: C.surface, border: `1px solid ${C.borderSoft}` }}>
      <div className="flex items-center justify-between mb-3">
        <button onClick={() => setCursor(new Date(year, month - 1, 1))} style={{ color: C.textDim }}><ArrowLeft size={16} /></button>
        <span className="text-sm font-semibold" style={{ color: C.text, fontFamily: "'Lexend', sans-serif" }}>{monthLabel}</span>
        <button onClick={() => setCursor(new Date(year, month + 1, 1))} style={{ color: C.textDim, transform: "rotate(180deg)" }}><ArrowLeft size={16} /></button>
      </div>
      <div className="grid grid-cols-7 gap-1 mb-1">
        {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
          <div key={i} className="text-center text-[10px] font-medium" style={{ color: C.textFaint }}>{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((d, i) => {
          if (!d) return <div key={i} />;
          const entry = entryFor(d);
          const goalsCount = goalsFor(d).length;
          return (
            <button key={i} onClick={() => setSelected(d)} className="aspect-square rounded-lg flex flex-col items-center justify-center gap-0.5 relative" style={{ background: selected === d ? C.blueSoft : isToday(d) ? C.surfaceAlt : "transparent", border: isToday(d) ? `1px solid ${C.blue}` : "1px solid transparent" }}>
              <span className="text-xs" style={{ color: selected === d ? C.blue : C.text }}>{d}</span>
              <div className="flex gap-0.5">
                {entry && <span className="w-1 h-1 rounded-full" style={{ background: C.amber }} />}
                {goalsCount > 0 && <span className="w-1 h-1 rounded-full" style={{ background: C.green }} />}
              </div>
            </button>
          );
        })}
      </div>
      {selected && (
        <div className="mt-4 pt-4" style={{ borderTop: `1px solid ${C.borderSoft}` }}>
          <p className="text-sm font-medium mb-2" style={{ color: C.text }}>{new Date(year, month, selected).toLocaleDateString("en-IN", { weekday: "long", month: "short", day: "numeric" })}</p>
          {!selectedEntry && selectedGoals.length === 0 && <p className="text-xs" style={{ color: C.textFaint }}>Nothing logged this day.</p>}
          {selectedEntry && <p className="text-xs mb-2" style={{ color: C.textDim }}>Focus {selectedEntry.focus}/5 · Stress {selectedEntry.stress}/5</p>}
          {selectedGoals.map((g) => {
            const cat = categoryStyle(g.category);
            return (
              <div key={g.id} className="flex items-center gap-2 mt-1">
                <Check size={12} style={{ color: C.green }} />
                <span className="text-xs" style={{ color: C.text }}>{g.title}</span>
                <span className="text-xs" style={{ color: cat?.color }}>{cat?.label}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function LogTab({ entries, setEntries, goals, sessions }) {
  const key = todayKey();
  const todayEntry = entries.find((e) => e.date === key);
  const [editing, setEditing] = useState(!todayEntry);
  const [focus, setFocus] = useState(todayEntry?.focus || 0);
  const [stress, setStress] = useState(todayEntry?.stress || 0);
  const [accomplished, setAccomplished] = useState(todayEntry?.accomplished || "");
  const [priority, setPriority] = useState(todayEntry?.priority || "");
  const [entertainmentMin, setEntertainmentMin] = useState(todayEntry?.entertainmentMin || "");
  const [expanded, setExpanded] = useState(null);

  function submit(e) {
    e.preventDefault();
    if (!focus || !stress) return;
    const entry = { date: key, focus, stress, accomplished, priority, entertainmentMin: entertainmentMin ? parseInt(entertainmentMin, 10) : null, createdAt: new Date().toISOString() };
    setEntries((prev) => {
      const others = prev.filter((p) => p.date !== key);
      return [...others, entry];
    });
    setEditing(false);
  }

  const history = [...entries].sort((a, b) => (a.date < b.date ? 1 : -1));

  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const weekEntries = entries.filter((e) => new Date(e.date) >= weekAgo);
  const weekGoalsCompleted = (goals || []).filter((g) => g.completed && g.completedAt && new Date(g.completedAt) >= weekAgo);
  const weekSessions = (sessions || []).filter((s) => new Date(s.date) >= weekAgo);
  const avg = (arr) => (arr.length ? Math.round((arr.reduce((a, b) => a + b, 0) / arr.length) * 10) / 10 : null);
  const avgFocus = avg(weekEntries.map((e) => e.focus));
  const avgStress = avg(weekEntries.map((e) => e.stress));
  const totalStudyMin = weekSessions.reduce((a, s) => a + s.minutes, 0);
  const totalEntertainMin = weekEntries.reduce((a, e) => a + (e.entertainmentMin || 0), 0);

  const subjectStats = useMemo(() => {
    const byCat = {};
    (goals || []).forEach((g) => {
      if (!g.completed || g.review?.percentage == null) return;
      const key = (g.category || "").trim() || "Uncategorized";
      byCat[key] = byCat[key] || [];
      byCat[key].push(g.review.percentage);
    });
    return Object.entries(byCat).map(([label, pcts]) => ({
      id: label,
      label,
      ...categoryStyle(label),
      count: pcts.length,
      avgPct: Math.round(pcts.reduce((a, b) => a + b, 0) / pcts.length),
    })).sort((a, b) => b.count - a.count);
  }, [goals]);

  const weakestSubject = subjectStats.length
    ? subjectStats.reduce((worst, s) => (s.avgPct < (worst?.avgPct ?? 101) ? s : worst), null)
    : null;

  return (
    <div className="pb-28">
      <ScreenHeader title="Daily Log" />
      <div className="mx-5 mt-2 rounded-2xl p-4" style={{ background: C.surface, border: `1px solid ${C.borderSoft}` }}>
        <h2 className="text-sm font-semibold uppercase tracking-wide mb-3" style={{ color: C.textFaint }}>This week</h2>
        <div className="grid grid-cols-2 gap-3">
          <div><p className="text-xl font-semibold" style={{ color: C.text, fontFamily: "'IBM Plex Mono', monospace" }}>{weekGoalsCompleted.length}</p><p className="text-xs" style={{ color: C.textDim }}>goals completed</p></div>
          <div><p className="text-xl font-semibold" style={{ color: C.text, fontFamily: "'IBM Plex Mono', monospace" }}>{totalStudyMin}m</p><p className="text-xs" style={{ color: C.textDim }}>focused study time</p></div>
          <div><p className="text-xl font-semibold" style={{ color: avgFocus != null ? C.amber : C.textFaint, fontFamily: "'IBM Plex Mono', monospace" }}>{avgFocus ?? "–"}</p><p className="text-xs" style={{ color: C.textDim }}>avg focus /5</p></div>
          <div><p className="text-xl font-semibold" style={{ color: avgStress != null ? C.red : C.textFaint, fontFamily: "'IBM Plex Mono', monospace" }}>{avgStress ?? "–"}</p><p className="text-xs" style={{ color: C.textDim }}>avg stress /5</p></div>
        </div>
        {totalEntertainMin > 0 && (
          <p className="text-xs mt-3" style={{ color: C.textDim }}>Entertainment/screen time logged: <span style={{ color: C.text }}>{totalEntertainMin}m</span> vs <span style={{ color: C.green }}>{totalStudyMin}m</span> focused</p>
        )}
        {weakestSubject && (
          <p className="text-xs mt-2" style={{ color: C.textDim }}>Weakest subject: <span style={{ color: weakestSubject.color }}>{weakestSubject.label}</span> ({weakestSubject.avgPct}% avg)</p>
        )}
      </div>
      {subjectStats.length > 0 && (
        <div className="mx-5 mt-3 rounded-2xl p-4" style={{ background: C.surface, border: `1px solid ${C.borderSoft}` }}>
          <h2 className="text-sm font-semibold uppercase tracking-wide mb-3" style={{ color: C.textFaint }}>Subject-wise stats</h2>
          <div className="flex flex-col gap-2">
            {subjectStats.map((s) => (
              <div key={s.id} className="flex items-center justify-between">
                <span className="text-sm" style={{ color: s.color }}>{s.label}</span>
                <span className="text-sm" style={{ color: C.textDim }}>{s.count} done · {s.avgPct}% avg</span>
              </div>
            ))}
          </div>
        </div>
      )}
      {!editing && todayEntry ? (
        <div className="mx-5 mt-2 rounded-2xl p-5" style={{ background: C.surface, border: `1px solid ${C.borderSoft}` }}>
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium" style={{ color: C.text }}>Today's reflection is saved</p>
            <button onClick={() => setEditing(true)} className="text-xs font-semibold" style={{ color: C.blue }}>Edit</button>
          </div>
          <div className="flex items-center gap-4 mt-3">
            <div className="flex items-center gap-1">
              <Star size={14} fill={C.amber} color={C.amber} />
              <span className="text-sm" style={{ color: C.textDim }}>{todayEntry.focus}/5 focus</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: C.red }} />
              <span className="text-sm" style={{ color: C.textDim }}>{todayEntry.stress}/5 stress</span>
            </div>
          </div>
        </div>
      ) : (
        <form onSubmit={submit} className="mx-5 mt-2 rounded-2xl p-5 flex flex-col gap-5" style={{ background: C.surface, border: `1px solid ${C.borderSoft}` }}>
          <div>
            <p className="text-sm font-medium mb-2" style={{ color: C.text }}>Rate your mental focus today</p>
            <StarRating value={focus} onChange={setFocus} />
          </div>
          <div>
            <p className="text-sm font-medium mb-2" style={{ color: C.text }}>Rate your anxiety level today</p>
            <StressBar value={stress} onChange={setStress} />
          </div>
          <div>
            <label className="text-xs font-medium" style={{ color: C.textDim }}>What I accomplished today</label>
            <textarea value={accomplished} onChange={(e) => setAccomplished(e.target.value)} rows={3} className="w-full mt-1.5 rounded-xl px-3 py-2.5 text-sm outline-none resize-none" style={{ background: C.surfaceAlt, color: C.text, border: `1px solid ${C.border}` }} />
          </div>
          <div>
            <label className="text-xs font-medium" style={{ color: C.textDim }}>Tomorrow's #1 non-negotiable priority</label>
            <textarea value={priority} onChange={(e) => setPriority(e.target.value)} rows={2} className="w-full mt-1.5 rounded-xl px-3 py-2.5 text-sm outline-none resize-none" style={{ background: C.surfaceAlt, color: C.text, border: `1px solid ${C.border}` }} />
          </div>
          <div>
            <label className="text-xs font-medium" style={{ color: C.textDim }}>Entertainment / screen time today (minutes, self-reported)</label>
            <input type="number" min="0" value={entertainmentMin} onChange={(e) => setEntertainmentMin(e.target.value)} placeholder="e.g. 90" className="w-full mt-1.5 rounded-xl px-3 py-2.5 text-sm outline-none" style={{ background: C.surfaceAlt, color: C.text, border: `1px solid ${C.border}` }} />
          </div>
          <button type="submit" className="w-full py-3 rounded-xl font-semibold text-sm" style={{ background: C.blue, color: "#0B0F15" }}>Save today's log</button>
        </form>
      )}
      <div className="px-5 mt-6">
        <h2 className="text-sm font-semibold uppercase tracking-wide mb-2" style={{ color: C.textFaint }}>Focus streak</h2>
        <StreakGrid entries={entries} />
      </div>
      <MonthCalendar entries={entries} goals={goals} />
      <div className="px-5 mt-6">
        <h2 className="text-sm font-semibold uppercase tracking-wide mb-2" style={{ color: C.textFaint }}>History</h2>
        <div className="flex flex-col gap-2">
          {history.length === 0 && <p className="text-sm" style={{ color: C.textFaint }}>No entries yet.</p>}
          {history.map((h) => (
            <div key={h.date} className="rounded-xl overflow-hidden" style={{ background: C.surfaceAlt }}>
              <button onClick={() => setExpanded(expanded === h.date ? null : h.date)} className="w-full flex items-center justify-between p-3.5">
                <span className="text-sm font-medium" style={{ color: C.text }}>{new Date(h.date).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}</span>
                <div className="flex items-center gap-3">
                  <span className="text-xs" style={{ color: C.amber }}>{h.focus}★ focus</span>
                  <span className="text-xs" style={{ color: C.red }}>{h.stress}/5 stress</span>
                  <ChevronDown size={14} style={{ color: C.textFaint, transform: expanded === h.date ? "rotate(180deg)" : "none" }} />
                </div>
              </button>
              {expanded === h.date && (
                <div className="px-3.5 pb-3.5">
                  {h.accomplished && (
                    <>
                      <p className="text-xs font-semibold uppercase tracking-wide mt-1" style={{ color: C.textFaint }}>Accomplished</p>
                      <p className="text-sm mt-1" style={{ color: C.textDim }}>{h.accomplished}</p>
                    </>
                  )}
                  {h.priority && (
                    <>
                      <p className="text-xs font-semibold uppercase tracking-wide mt-3" style={{ color: C.textFaint }}>Tomorrow's priority</p>
                      <p className="text-sm mt-1" style={{ color: C.textDim }}>{h.priority}</p>
                    </>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------- STUFF TO REVIEW ---------------------------------- */
function ReviewTab({ items, setItems }) {
  const sorted = [...items].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  function dismiss(id) { setItems((prev) => prev.filter((i) => i.id !== id)); }
  return (
    <div className="pb-28">
      <ScreenHeader title="Stuff to Review" />
      <div className="px-5 mt-2 flex flex-col gap-3">
        {sorted.length === 0 && (
          <div className="rounded-2xl p-6 text-center" style={{ background: C.surface, border: `1px dashed ${C.border}` }}>
            <p className="text-sm" style={{ color: C.textDim }}>Nothing here yet. Points you forget or get wrong after a quiz will land here.</p>
          </div>
        )}
        {sorted.map((item) => {
          const cat = categoryStyle(item.category);
          return (
            <div key={item.id} className="rounded-2xl p-4" style={{ background: C.surface, border: `1px solid ${C.borderSoft}` }}>
              <div className="flex items-center justify-between">
                <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ color: cat?.color, background: cat?.soft }}>{cat?.label}</span>
                {item.percentage != null && <span className="text-xs font-medium" style={{ color: item.percentage >= 70 ? C.green : C.red }}>{item.percentage}%</span>}
              </div>
              <p className="text-sm font-medium mt-2" style={{ color: C.text, fontFamily: "'Lexend', sans-serif" }}>{item.goalTitle}</p>
              <p className="text-sm mt-2" style={{ color: C.textDim }}>{item.needsReread ? "Score was low — reread the full chapter." : item.missed}</p>
              <button onClick={() => dismiss(item.id)} className="mt-3 text-xs font-semibold" style={{ color: C.blue }}>Reread it — clear from review</button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ---------------------------------- DOUBTS ---------------------------------- */
async function askAI(question, category) {
  /* PRODUCTION NOTICE: Client-side keys leak easily and are blocked by CORS.
    Point this execution to your private secure proxy server or Serverless backend route.
    Example: fetch("/api/get-doubt-answer", { ... })
  */
  try {
    const response = await fetch("https://api.your-backend-proxy.com/v1/doubts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question, category }),
    });
    const data = await response.json();
    return data.answer || "Couldn't get an answer just now — try rephrasing.";
  } catch (err) {
    // Graceful fallback simulation for local prototype visualization:
    return `[Mock AI Response for: "${question}"] Ensure you understand this core equation!`;
  }
}

function DoubtsTab({ doubts, setDoubts }) {
  const [question, setQuestion] = useState("");
  const [category, setCategory] = useState("");
  const [expanded, setExpanded] = useState(null);

  async function submit(e) {
    e.preventDefault();
    if (!question.trim()) return;
    const id = crypto.randomUUID ? crypto.randomUUID() : (Date.now() + Math.random()).toString();
    const entry = { id, question: question.trim(), category: category.trim(), answer: null, loading: true, error: false, createdAt: new Date().toISOString() };
    setDoubts((prev) => [entry, ...prev]);
    setQuestion("");
    setExpanded(id);
    try {
      const answer = await askAI(entry.question, entry.category);
      setDoubts((prev) => prev.map((d) => (d.id === id ? { ...d, answer, loading: false } : d)));
    } catch (err) {
      setDoubts((prev) => prev.map((d) => (d.id === id ? { ...d, loading: false, error: true, errorDetail: err?.message || String(err) } : d)));
    }
  }

  return (
    <div className="pb-28">
      <ScreenHeader title="Doubts" />
      <form onSubmit={submit} className="mx-5 mt-2 rounded-2xl p-4 flex flex-col gap-3" style={{ background: C.surface, border: `1px solid ${C.borderSoft}` }}>
        <textarea value={question} onChange={(e) => setQuestion(e.target.value)} rows={3} placeholder="Type your doubt — e.g. Why is the sign convention different for concave and convex mirrors?" className="w-full rounded-xl px-3 py-2.5 text-sm outline-none resize-none" style={{ background: C.surfaceAlt, color: C.text, border: `1px solid ${C.border}` }} />
        <div className="flex gap-2">
          <input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Subject (optional)" className="flex-1 rounded-xl px-3 py-2.5 text-sm outline-none" style={{ background: C.surfaceAlt, color: C.text, border: `1px solid ${C.border}` }} />
          <button type="submit" disabled={!question.trim()} className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ background: question.trim() ? C.blue : C.surfaceAlt }}>
            <Send size={16} color={question.trim() ? "#0B0F15" : C.textFaint} />
          </button>
        </div>
      </form>
      <div className="px-5 mt-4 flex flex-col gap-2">
        {doubts.length === 0 && (
          <div className="rounded-2xl p-6 text-center" style={{ background: C.surface, border: `1px dashed ${C.border}` }}>
            <p className="text-sm" style={{ color: C.textDim }}>No doubts asked yet. Type one above whenever you get stuck.</p>
          </div>
        )}
        {doubts.map((d) => {
          const cat = d.category ? categoryStyle(d.category) : null;
          return (
            <div key={d.id} className="rounded-2xl overflow-hidden" style={{ background: C.surface, border: `1px solid ${C.borderSoft}` }}>
              <button onClick={() => setExpanded(expanded === d.id ? null : d.id)} className="w-full text-left p-4 flex items-start gap-3">
                <HelpCircle size={16} style={{ color: C.blue, marginTop: 2, flexShrink: 0 }} />
                <div className="flex-1">
                  <p className="text-sm font-medium" style={{ color: C.text, fontFamily: "'Lexend', sans-serif" }}>{d.question}</p>
                  {cat && <span className="text-xs mt-1 inline-block" style={{ color: cat.color }}>{cat.label}</span>}
                </div>
                <ChevronDown size={14} style={{ color: C.textFaint, marginTop: 4, transform: expanded === d.id ? "rotate(180deg)" : "none", flexShrink: 0 }} />
              </button>
              {expanded === d.id && (
                <div className="px-4 pb-4">
                  {d.loading && <p className="text-xs" style={{ color: C.textFaint }}>Thinking...</p>}
                  {d.error && <p className="text-xs" style={{ color: C.red }}>Couldn't reach the AI: {d.errorDetail || "unknown error"}</p>}
                  {d.answer && <p className="text-sm whitespace-pre-line" style={{ color: C.textDim }}>{d.answer}</p>}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ---------------------------------- BOTTOM NAV ---------------------------------- */
function BottomNav({ tab, setTab }) {
  const items = [
    { id: "goals", label: "Goals", icon: Check },
    { id: "timers", label: "Timers", icon: Clock },
    { id: "methods", label: "Methods", icon: BookOpen },
    { id: "log", label: "Log", icon: NotebookPen },
    { id: "review", label: "Review", icon: BookMarked },
    { id: "doubts", label: "Doubts", icon: HelpCircle },
  ];
  return (
    <div className="fixed bottom-0 left-0 right-0 flex items-center justify-around py-2.5 z-20" style={{ background: C.surface, borderTop: `1px solid ${C.borderSoft}` }}>
      {items.map((it) => {
        const Icon = it.icon;
        const active = tab === it.id;
        return (
          <button key={it.id} onClick={() => setTab(it.id)} className="flex flex-col items-center gap-1 px-3 py-1">
            <Icon size={20} color={active ? C.blue : C.textFaint} strokeWidth={active ? 2.4 : 2} />
            <span className="text-[11px] font-medium" style={{ color: active ? C.blue : C.textFaint }}>{it.label}</span>
          </button>
        );
      })}
    </div>
  );
}

/* ---------------------------------- APP ---------------------------------- */
export default function App() {
  const [tab, setTab] = useState("goals");
  const [goals, setGoals] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("fp_goals");
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });
  const [entries, setEntries] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("fp_entries");
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });
  const [reviewItems, setReviewItems] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("fp_reviews");
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });
  const [sessions, setSessions] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("fp_sessions");
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });
  const [doubts, setDoubts] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("fp_doubts");
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });

  // Flat primitives to ensure safe dependencies down inside TimersTab
  const [focusGoalId, setFocusGoalId] = useState("");
  const [focusGoalMode, setFocusGoalMode] = useState("");
  const [focusGoalCategory, setFocusGoalCategory] = useState("");

  const [notifPermission, setNotifPermission] = useState(
    typeof window !== "undefined" && window.Notification ? Notification.permission : "unsupported"
  );

  // Persistence side-effects
  useEffect(() => { localStorage.setItem("fp_goals", JSON.stringify(goals)); }, [goals]);
  useEffect(() => { localStorage.setItem("fp_entries", JSON.stringify(entries)); }, [entries]);
  useEffect(() => { localStorage.setItem("fp_reviews", JSON.stringify(reviewItems)); }, [reviewItems]);
  useEffect(() => { localStorage.setItem("fp_sessions", JSON.stringify(sessions)); }, [sessions]);
  useEffect(() => { localStorage.setItem("fp_doubts", JSON.stringify(doubts)); }, [doubts]);

  function addReviewItem(item) {
    const id = crypto.randomUUID ? crypto.randomUUID() : (Date.now() + Math.random()).toString();
    setReviewItems((prev) => [...prev, { id, createdAt: new Date().toISOString(), ...item }]);
  }

  function logSession(minutes, category) {
    const id = crypto.randomUUID ? crypto.randomUUID() : (Date.now() + Math.random()).toString();
    setSessions((prev) => [...prev, { id, date: new Date().toISOString(), minutes, category }]);
  }

  async function requestNotif() {
    if (!window.Notification) return;
    const perm = await Notification.requestPermission();
    setNotifPermission(perm);
  }

  function handleOpenTimer(g) {
    setFocusGoalId(g.id);
    setFocusGoalMode(g.timerMode);
    setFocusGoalCategory(g.category || "");
    setTab("timers");
  }

  function clearFocusGoal() {
    setFocusGoalId("");
    setFocusGoalMode("");
    setFocusGoalCategory("");
  }

  return (
    <div className="min-h-screen w-full flex justify-center" style={{ background: "#05070A" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Lexend:wght@300;400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap');
        * { font-family: 'Lexend', sans-serif; box-sizing: border-box; }
        input::placeholder, textarea::placeholder { color: ${C.textFaint}; }
        button { -webkit-tap-highlight-color: transparent; }
        select {
          appearance: none;
          background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%238D97A8' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><polyline points='6 9 12 15 18 9'></polyline></svg>");
          background-repeat: no-repeat;
          background-position: right 12px center;
          background-size: 16px;
          padding-right: 40px !important;
        }
      `}</style>
      <div className="w-full max-w-md min-h-screen relative" style={{ background: C.bg }}>
        <AppHeader notifPermission={notifPermission} onRequestNotif={requestNotif} />
        {tab === "goals" && (
          <GoalsTab goals={goals} setGoals={setGoals} onOpenTimerFor={handleOpenTimer} addReviewItem={addReviewItem} />
        )}
        {tab === "timers" && (
          <TimersTab initialGoalId={focusGoalId} initialGoalMode={focusGoalMode} initialGoalCategory={focusGoalCategory} clearInitialGoal={clearFocusGoal} onSession={logSession} />
        )}
        {tab === "methods" && <MethodsTab />}
        {tab === "log" && <LogTab entries={entries} setEntries={setEntries} goals={goals} sessions={sessions} />}
        {tab === "review" && <ReviewTab items={reviewItems} setItems={setReviewItems} />}
        {tab === "doubts" && <DoubtsTab doubts={doubts} setDoubts={setDoubts} />}
        <BottomNav tab={tab} setTab={setTab} />
      </div>
    </div>
  );
}
