import { useState, useMemo, useCallback, useEffect } from "react";
import { useLocation, useRoute } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, Check, Copy, RotateCcw, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  QUESTIONS,
  PROFILES,
  getQuizResult,
  type ProfileKey,
  type QuizResult,
} from "@/lib/quiz-data";

// ─── Color maps per profile ─────────────────────────────────
const PROFILE_COLORS: Record<ProfileKey, { bg: string; border: string; text: string; badge: string; accent: string; light: string }> = {
  'cautious-optimizer': {
    bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700',
    badge: 'bg-emerald-400', accent: 'text-emerald-500', light: 'bg-emerald-100',
  },
  'equity-maximizer': {
    bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700',
    badge: 'bg-blue-500', accent: 'text-blue-500', light: 'bg-blue-100',
  },
  'flexible-landlord': {
    bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700',
    badge: 'bg-purple-500', accent: 'text-purple-500', light: 'bg-purple-100',
  },
  'optionality-keeper': {
    bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700',
    badge: 'bg-amber-400', accent: 'text-amber-500', light: 'bg-amber-100',
  },
  'simplicity-seeker': {
    bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700',
    badge: 'bg-orange-400', accent: 'text-orange-500', light: 'bg-orange-100',
  },
};

// ─── Slide direction helper ─────────────────────────────────
type Direction = 1 | -1;

const slideVariants = {
  enter: (dir: Direction) => ({
    x: dir > 0 ? 80 : -80,
    opacity: 0,
  }),
  center: { x: 0, opacity: 1 },
  exit: (dir: Direction) => ({
    x: dir > 0 ? -80 : 80,
    opacity: 0,
  }),
};

// ─── Entry Screen ───────────────────────────────────────────
function EntryScreen({ onStart }: { onStart: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4 }}
      className="min-h-[calc(100vh-80px)] flex flex-col items-center justify-center px-6 text-center"
    >
      <h1 className="text-3xl sm:text-4xl font-bold text-slate-800 leading-tight max-w-lg">
        Not sure if selling is the right move?
      </h1>
      <p className="mt-4 text-base sm:text-lg text-slate-500 max-w-md leading-relaxed">
        Get your <span className="font-semibold text-slate-700">NetCheck Decision Profile</span> in under
        60 seconds—and see which path (sell, rent, or wait) actually fits your situation.
      </p>

      <motion.button
        onClick={onStart}
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        animate={{ boxShadow: ["0 0 0 0 rgba(52,211,153,0.4)", "0 0 0 12px rgba(52,211,153,0)", "0 0 0 0 rgba(52,211,153,0.4)"] }}
        transition={{ boxShadow: { duration: 2, repeat: Infinity, ease: "easeInOut" } }}
        className="mt-8 px-10 py-4 rounded-2xl bg-emerald-400 hover:bg-emerald-500 text-white text-lg font-bold shadow-lg transition-colors"
      >
        👉 Find My Best Move
      </motion.button>

      <p className="mt-4 text-sm text-slate-400">
        No email required. Just a few questions to help you think more clearly about your next move.
      </p>
    </motion.div>
  );
}

// ─── Question Screen ────────────────────────────────────────
function QuestionScreen({
  questionIndex,
  selectedAnswer,
  direction,
  onSelect,
  onBack,
}: {
  questionIndex: number;
  selectedAnswer: number | null;
  direction: Direction;
  onSelect: (answerIndex: number) => void;
  onBack: () => void;
}) {
  const question = QUESTIONS[questionIndex];
  const progress = ((questionIndex + 1) / QUESTIONS.length) * 100;

  return (
    <div className="min-h-[calc(100vh-80px)] flex flex-col">
      {/* Progress bar */}
      <div className="w-full h-1 bg-slate-100">
        <motion.div
          className="h-full bg-emerald-400 rounded-r-full"
          initial={false}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        />
      </div>

      {/* Back button */}
      <div className="px-4 pt-4">
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-slate-400 hover:text-slate-600 transition-colors text-sm"
        >
          <ChevronLeft className="w-5 h-5" />
          <span className="sr-only sm:not-sr-only">Back</span>
        </button>
      </div>

      {/* Question + Answers */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 pb-12 max-w-lg mx-auto w-full">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={questionIndex}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="w-full"
          >
            <p className="text-xs font-medium text-emerald-400 uppercase tracking-wider mb-3 text-center">
              Question {questionIndex + 1} of {QUESTIONS.length}
            </p>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-800 text-center mb-8 leading-snug">
              {question.text}
            </h2>

            <div className="space-y-3">
              {question.answers.map((answer, idx) => {
                const isSelected = selectedAnswer === idx;
                return (
                  <motion.button
                    key={idx}
                    onClick={() => onSelect(idx)}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05, duration: 0.2 }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`w-full text-left px-5 py-4 rounded-xl border-2 transition-all duration-150 font-medium text-sm sm:text-base ${
                      isSelected
                        ? "bg-emerald-50 border-emerald-400 text-emerald-700"
                        : "bg-white border-slate-200 text-slate-700 hover:border-emerald-300 hover:shadow-sm"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span>{answer.text}</span>
                      {isSelected && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: "spring", stiffness: 500, damping: 25 }}
                        >
                          <Check className="w-5 h-5 text-emerald-500" />
                        </motion.div>
                      )}
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

// ─── Result Screen ──────────────────────────────────────────
function ResultScreen({
  result,
  onRetake,
}: {
  result: QuizResult;
  onRetake: () => void;
}) {
  const profile = PROFILES[result.primary];
  const secondaryProfile = PROFILES[result.secondary];
  const colors = PROFILE_COLORS[result.primary];
  const [, navigate] = useLocation();
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const shareUrl = `${window.location.origin}/quiz/result/${result.primary}`;

  const handleShare = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(shareUrl);
      } else {
        const ta = document.createElement("textarea");
        ta.value = shareUrl;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      }
      setCopied(true);
      toast({ title: "Link copied!", description: "Share your Decision Profile with others." });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ title: "Couldn't copy link", variant: "destructive" });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen pb-20"
    >
      <div className="max-w-xl mx-auto px-6 pt-10">
        {/* Profile badge */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.4, type: "spring", stiffness: 200 }}
          className="text-center"
        >
          <p className="text-sm font-medium text-slate-400 uppercase tracking-wider mb-3">
            ✨ Your NetCheck Decision Profile
          </p>
          <div className={`inline-flex items-center gap-2 px-6 py-3 rounded-2xl ${colors.badge} shadow-lg`}>
            <span className="text-2xl">{profile.emoji}</span>
            <span className="text-xl font-bold text-white">{profile.name}</span>
          </div>
        </motion.div>

        {/* Opening quote */}
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}
          className="mt-8 text-xl sm:text-2xl font-medium text-slate-700 italic text-center leading-relaxed"
        >
          "{profile.opening}"
        </motion.p>

        {/* Confidence meter */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45, duration: 0.4 }}
          className={`mt-6 ${colors.bg} ${colors.border} border rounded-xl px-5 py-4 text-center`}
        >
          <p className="text-sm text-slate-500 mb-2">
            Based on your answers, we're <span className={`font-bold ${colors.accent}`}>{result.confidence}%</span> confident this fits you.
          </p>
          <div className="w-full h-2 bg-white/60 rounded-full overflow-hidden">
            <motion.div
              className={`h-full ${colors.badge} rounded-full`}
              initial={{ width: 0 }}
              animate={{ width: `${result.confidence}%` }}
              transition={{ delay: 0.6, duration: 0.8, ease: "easeOut" }}
            />
          </div>
          <p className="mt-2 text-xs text-slate-400">
            You also show traits of <span className="font-semibold">{secondaryProfile.emoji} {secondaryProfile.name}</span>
          </p>
        </motion.div>

        {/* What this means */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55, duration: 0.4 }}
          className="mt-8"
        >
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">What this means</h3>
          <p className="text-base text-slate-600 leading-relaxed">{profile.explanation}</p>
        </motion.div>

        {/* What most people miss */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.65, duration: 0.4 }}
          className="mt-6"
        >
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">What most people miss</h3>
          <p className="text-base text-slate-600 leading-relaxed">{profile.insight}</p>
        </motion.div>

        {/* Your best next step */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.75, duration: 0.4 }}
          className="mt-6"
        >
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Your best next step</h3>
          <p className="text-base text-slate-600 leading-relaxed">{profile.recommendation}</p>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.85, duration: 0.4 }}
          className="mt-8"
        >
          <Button
            onClick={() => navigate("/")}
            className="w-full py-6 text-lg font-bold bg-emerald-400 hover:bg-emerald-500 text-white rounded-2xl shadow-lg transition-colors"
          >
            {profile.ctaText}
          </Button>
        </motion.div>

        {/* Share + Retake */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.95, duration: 0.4 }}
          className="mt-6 flex flex-col items-center gap-3"
        >
          <p className="text-sm font-medium text-slate-400">Share your result</p>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={handleShare}
              className="flex items-center gap-2 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300 transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-500" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Copy Link
                </>
              )}
            </Button>
          </div>

          <button
            onClick={onRetake}
            className="mt-2 flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-600 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Retake Quiz
          </button>
        </motion.div>
      </div>
    </motion.div>
  );
}

// ─── Static Result Page (direct URL) ────────────────────────
function StaticResultPage({ profileKey }: { profileKey: ProfileKey }) {
  const profile = PROFILES[profileKey];
  const colors = PROFILE_COLORS[profileKey];
  const [, navigate] = useLocation();
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-700">Profile not found</h1>
          <button onClick={() => navigate("/quiz")} className="mt-4 text-emerald-500 hover:underline">
            Take the quiz →
          </button>
        </div>
      </div>
    );
  }

  const shareUrl = `${window.location.origin}/quiz/result/${profileKey}`;

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast({ title: "Link copied!" });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ title: "Couldn't copy link", variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen nc-bg relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -top-32 -left-32 w-[500px] h-[500px] rounded-full bg-emerald-200/30 blur-3xl" />
        <div className="absolute top-1/3 -right-40 w-[420px] h-[420px] rounded-full bg-blue-200/20 blur-3xl" />
      </div>
      <div className="relative z-10">
        {/* Header */}
        <div className="text-center pt-6 pb-2 px-4">
          <a href="/" className="inline-flex items-center justify-center px-6 py-2 rounded-2xl bg-emerald-400 shadow-lg">
            <span className="text-xl font-extrabold text-white tracking-tight">
              Net<span className="font-light">Check</span>
            </span>
          </a>
        </div>

        <div className="max-w-xl mx-auto px-6 pt-6 pb-20">
          <div className="text-center">
            <p className="text-sm font-medium text-slate-400 uppercase tracking-wider mb-3">
              ✨ NetCheck Decision Profile
            </p>
            <div className={`inline-flex items-center gap-2 px-6 py-3 rounded-2xl ${colors.badge} shadow-lg`}>
              <span className="text-2xl">{profile.emoji}</span>
              <span className="text-xl font-bold text-white">{profile.name}</span>
            </div>
          </div>

          <p className="mt-8 text-xl sm:text-2xl font-medium text-slate-700 italic text-center leading-relaxed">
            "{profile.opening}"
          </p>

          <div className="mt-8">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">What this means</h3>
            <p className="text-base text-slate-600 leading-relaxed">{profile.explanation}</p>
          </div>

          <div className="mt-6">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">What most people miss</h3>
            <p className="text-base text-slate-600 leading-relaxed">{profile.insight}</p>
          </div>

          <div className="mt-6">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Your best next step</h3>
            <p className="text-base text-slate-600 leading-relaxed">{profile.recommendation}</p>
          </div>

          <div className="mt-8 space-y-4">
            <Button
              onClick={() => navigate("/")}
              className="w-full py-6 text-lg font-bold bg-emerald-400 hover:bg-emerald-500 text-white rounded-2xl shadow-lg transition-colors"
            >
              {profile.ctaText}
            </Button>

            <div className="flex justify-center gap-3">
              <Button
                variant="outline"
                onClick={handleShare}
                className="flex items-center gap-2 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300"
              >
                {copied ? <><Check className="w-4 h-4 text-emerald-500" /> Copied!</> : <><Copy className="w-4 h-4" /> Copy Link</>}
              </Button>
            </div>

            <div className="text-center">
              <button
                onClick={() => navigate("/quiz")}
                className="text-sm text-emerald-500 hover:text-emerald-600 font-medium hover:underline transition-colors"
              >
                Take the quiz yourself →
              </button>
            </div>
          </div>
        </div>

        <footer className="text-center py-6 text-slate-400">
          <p className="text-sm">NetCheck LLC © 2026</p>
        </footer>
      </div>
    </div>
  );
}

// ─── Main Quiz Component ────────────────────────────────────
type Phase = "entry" | "questions" | "results";

export default function Quiz() {
  const [phase, setPhase] = useState<Phase>("entry");
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>(new Array(QUESTIONS.length).fill(null));
  const [direction, setDirection] = useState<Direction>(1);
  const [quizResult, setQuizResult] = useState<QuizResult | null>(null);
  const [, navigate] = useLocation();

  const handleStart = useCallback(() => {
    setPhase("questions");
    setCurrentQuestion(0);
    setDirection(1);
  }, []);

  const handleSelect = useCallback(
    (answerIndex: number) => {
      const newAnswers = [...answers];
      newAnswers[currentQuestion] = answerIndex;
      setAnswers(newAnswers);

      // Auto-advance after brief delay
      setTimeout(() => {
        if (currentQuestion < QUESTIONS.length - 1) {
          setDirection(1);
          setCurrentQuestion((prev) => prev + 1);
        } else {
          // Last question — compute results
          const result = getQuizResult(newAnswers);
          setQuizResult(result);
          setPhase("results");
          // Update URL for shareability
          window.history.replaceState(null, "", `/quiz/result/${result.primary}`);
        }
      }, 200);
    },
    [answers, currentQuestion]
  );

  const handleBack = useCallback(() => {
    if (currentQuestion === 0) {
      setPhase("entry");
    } else {
      setDirection(-1);
      setCurrentQuestion((prev) => prev - 1);
    }
  }, [currentQuestion]);

  const handleRetake = useCallback(() => {
    setPhase("entry");
    setCurrentQuestion(0);
    setAnswers(new Array(QUESTIONS.length).fill(null));
    setQuizResult(null);
    setDirection(1);
    window.history.replaceState(null, "", "/quiz");
  }, []);

  return (
    <div className="min-h-screen nc-bg relative overflow-hidden">
      {/* Ambient glow orbs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -top-32 -left-32 w-[500px] h-[500px] rounded-full bg-emerald-200/30 blur-3xl" />
        <div className="absolute top-1/3 -right-40 w-[420px] h-[420px] rounded-full bg-blue-200/20 blur-3xl" />
        <div className="absolute -bottom-24 left-1/4 w-[360px] h-[360px] rounded-full bg-emerald-100/25 blur-3xl" />
      </div>

      <div className="relative z-10">
        {/* Header brand pill */}
        {phase !== "results" && (
          <div className="text-center pt-6 pb-2 px-4">
            <a href="/" className="inline-flex items-center justify-center px-6 py-2 rounded-2xl bg-emerald-400 shadow-lg">
              <span className="text-xl font-extrabold text-white tracking-tight">
                Net<span className="font-light">Check</span>
              </span>
            </a>
          </div>
        )}

        <AnimatePresence mode="wait">
          {phase === "entry" && (
            <EntryScreen key="entry" onStart={handleStart} />
          )}
          {phase === "questions" && (
            <QuestionScreen
              key={`q-${currentQuestion}`}
              questionIndex={currentQuestion}
              selectedAnswer={answers[currentQuestion]}
              direction={direction}
              onSelect={handleSelect}
              onBack={handleBack}
            />
          )}
          {phase === "results" && quizResult && (
            <ResultScreen
              key="results"
              result={quizResult}
              onRetake={handleRetake}
            />
          )}
        </AnimatePresence>

        {/* Footer only on entry */}
        {phase === "entry" && (
          <footer className="text-center py-6 text-slate-400">
            <p className="text-sm">NetCheck LLC © 2026</p>
          </footer>
        )}
      </div>
    </div>
  );
}

// ─── Result Route Wrapper ───────────────────────────────────
export function QuizResultRoute() {
  const [match, params] = useRoute("/quiz/result/:profile");
  const profileKey = params?.profile as ProfileKey | undefined;

  if (!match || !profileKey || !PROFILES[profileKey]) {
    return <Quiz />;
  }

  return <StaticResultPage profileKey={profileKey} />;
}
