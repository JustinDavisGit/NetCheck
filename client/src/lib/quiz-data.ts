export type ProfileKey =
  | 'cautious-optimizer'
  | 'equity-maximizer'
  | 'flexible-landlord'
  | 'optionality-keeper'
  | 'simplicity-seeker';

export interface ScoreMapping {
  profile: ProfileKey;
  points: number;
}

export interface Answer {
  text: string;
  scores: ScoreMapping[];
}

export interface Question {
  id: number;
  text: string;
  answers: Answer[];
}

export interface Profile {
  key: ProfileKey;
  name: string;
  emoji: string;
  opening: string;
  explanation: string;
  insight: string;
  recommendation: string;
  ctaText: string;
}

export type Scores = Record<ProfileKey, number>;

export interface QuizResult {
  primary: ProfileKey;
  secondary: ProfileKey;
  confidence: number;
  scores: Scores;
}

export const QUESTIONS: Question[] = [
  {
    id: 1,
    text: "What brings you here right now?",
    answers: [
      {
        text: "I may want to move soon",
        scores: [
          { profile: 'equity-maximizer', points: 1 },
          { profile: 'simplicity-seeker', points: 1 },
        ],
      },
      {
        text: "I'm curious what selling would look like",
        scores: [{ profile: 'cautious-optimizer', points: 1 }],
      },
      {
        text: "I'm deciding between renting and selling",
        scores: [
          { profile: 'flexible-landlord', points: 1 },
          { profile: 'optionality-keeper', points: 1 },
        ],
      },
      {
        text: "I have a real decision or offer in front of me",
        scores: [{ profile: 'equity-maximizer', points: 2 }],
      },
      {
        text: "I'm just trying to get clarity",
        scores: [{ profile: 'cautious-optimizer', points: 2 }],
      },
    ],
  },
  {
    id: 2,
    text: "If you moved out, would you actually want to keep this home as a rental?",
    answers: [
      {
        text: "Definitely",
        scores: [{ profile: 'flexible-landlord', points: 2 }],
      },
      {
        text: "Maybe",
        scores: [
          { profile: 'optionality-keeper', points: 1 },
          { profile: 'flexible-landlord', points: 1 },
        ],
      },
      {
        text: "Probably not",
        scores: [
          { profile: 'simplicity-seeker', points: 1 },
          { profile: 'equity-maximizer', points: 1 },
        ],
      },
      {
        text: "No chance",
        scores: [{ profile: 'simplicity-seeker', points: 2 }],
      },
    ],
  },
  {
    id: 3,
    text: "Which matters more to you right now?",
    answers: [
      {
        text: "Getting the most cash in hand",
        scores: [{ profile: 'equity-maximizer', points: 2 }],
      },
      {
        text: "Keeping long-term upside",
        scores: [{ profile: 'flexible-landlord', points: 2 }],
      },
      {
        text: "Reducing stress and complexity",
        scores: [{ profile: 'simplicity-seeker', points: 2 }],
      },
      {
        text: "Creating monthly income",
        scores: [{ profile: 'flexible-landlord', points: 2 }],
      },
      {
        text: "I'm trying to balance everything",
        scores: [{ profile: 'cautious-optimizer', points: 2 }],
      },
    ],
  },
  {
    id: 4,
    text: "How likely are you to need access to your equity in the next 12 months?",
    answers: [
      {
        text: "Very likely",
        scores: [{ profile: 'equity-maximizer', points: 2 }],
      },
      {
        text: "Somewhat likely",
        scores: [{ profile: 'equity-maximizer', points: 1 }],
      },
      {
        text: "Not very likely",
        scores: [{ profile: 'optionality-keeper', points: 1 }],
      },
      {
        text: "Not at all",
        scores: [
          { profile: 'flexible-landlord', points: 1 },
          { profile: 'optionality-keeper', points: 1 },
        ],
      },
    ],
  },
  {
    id: 5,
    text: "Be honest—how appealing does being a landlord actually sound?",
    answers: [
      {
        text: "Very appealing",
        scores: [{ profile: 'flexible-landlord', points: 2 }],
      },
      {
        text: "Somewhat appealing",
        scores: [{ profile: 'flexible-landlord', points: 1 }],
      },
      {
        text: "Neutral",
        scores: [{ profile: 'cautious-optimizer', points: 1 }],
      },
      {
        text: "Not appealing",
        scores: [{ profile: 'simplicity-seeker', points: 1 }],
      },
      {
        text: "Absolutely not",
        scores: [{ profile: 'simplicity-seeker', points: 2 }],
      },
    ],
  },
  {
    id: 6,
    text: "How important is flexibility for you over the next 1–2 years?",
    answers: [
      {
        text: "Extremely important",
        scores: [{ profile: 'optionality-keeper', points: 2 }],
      },
      {
        text: "Pretty important",
        scores: [{ profile: 'optionality-keeper', points: 1 }],
      },
      {
        text: "Somewhat important",
        scores: [{ profile: 'cautious-optimizer', points: 1 }],
      },
      {
        text: "Not very important",
        scores: [
          { profile: 'equity-maximizer', points: 1 },
          { profile: 'simplicity-seeker', points: 1 },
        ],
      },
    ],
  },
  {
    id: 7,
    text: "Which risk would bother you more?",
    answers: [
      {
        text: "Selling now and missing future appreciation",
        scores: [
          { profile: 'flexible-landlord', points: 1 },
          { profile: 'optionality-keeper', points: 1 },
        ],
      },
      {
        text: "Keeping it and dealing with ongoing hassle",
        scores: [{ profile: 'simplicity-seeker', points: 2 }],
      },
      {
        text: "Renting it and dealing with tenants/issues",
        scores: [
          { profile: 'simplicity-seeker', points: 1 },
          { profile: 'equity-maximizer', points: 1 },
        ],
      },
      {
        text: "Waiting too long and missing the right window",
        scores: [{ profile: 'equity-maximizer', points: 2 }],
      },
    ],
  },
  {
    id: 8,
    text: "Which statement feels most like you?",
    answers: [
      {
        text: "I want the cleanest, simplest path",
        scores: [{ profile: 'simplicity-seeker', points: 2 }],
      },
      {
        text: "I want the smartest financial move",
        scores: [{ profile: 'cautious-optimizer', points: 2 }],
      },
      {
        text: "I want to preserve optionality",
        scores: [{ profile: 'optionality-keeper', points: 2 }],
      },
      {
        text: "I want to maximize upside",
        scores: [
          { profile: 'equity-maximizer', points: 1 },
          { profile: 'flexible-landlord', points: 1 },
        ],
      },
      {
        text: "I want something I'll feel good about",
        scores: [
          { profile: 'cautious-optimizer', points: 1 },
          { profile: 'simplicity-seeker', points: 1 },
        ],
      },
    ],
  },
  {
    id: 9,
    text: "How ready are you to make a move?",
    answers: [
      {
        text: "Ready now",
        scores: [{ profile: 'equity-maximizer', points: 2 }],
      },
      {
        text: "Within 3 months",
        scores: [
          { profile: 'equity-maximizer', points: 1 },
          { profile: 'simplicity-seeker', points: 1 },
        ],
      },
      {
        text: "Within 6–12 months",
        scores: [
          { profile: 'optionality-keeper', points: 1 },
          { profile: 'cautious-optimizer', points: 1 },
        ],
      },
      {
        text: "Just exploring",
        scores: [{ profile: 'cautious-optimizer', points: 2 }],
      },
    ],
  },
  {
    id: 10,
    text: "If you had to choose, you'd prefer:",
    answers: [
      {
        text: "A lump sum now",
        scores: [{ profile: 'equity-maximizer', points: 2 }],
      },
      {
        text: "Monthly income over time",
        scores: [{ profile: 'flexible-landlord', points: 2 }],
      },
      {
        text: "More time before deciding",
        scores: [{ profile: 'optionality-keeper', points: 2 }],
      },
      {
        text: "A side-by-side comparison first",
        scores: [{ profile: 'cautious-optimizer', points: 2 }],
      },
    ],
  },
];

const ALL_PROFILE_KEYS: ProfileKey[] = [
  'cautious-optimizer',
  'equity-maximizer',
  'flexible-landlord',
  'optionality-keeper',
  'simplicity-seeker',
];

export const PROFILES: Record<ProfileKey, Profile> = {
  'cautious-optimizer': {
    key: 'cautious-optimizer',
    name: 'Cautious Optimizer',
    emoji: '🟢',
    opening: "You're not looking for a quick answer—you want to make the right decision.",
    explanation:
      "Based on your answers, you're weighing multiple angles—financial, practical, and emotional. You're not the type to rush into a move just because 'the market says so.' Most people in your position don't need a yes/no answer—they need to see the tradeoffs clearly before committing.",
    insight:
      "What often gets missed here isn't the big decision—it's how dramatically the numbers can shift depending on small variables (price, concessions, timing).",
    recommendation: "Your best next step isn't guessing—it's running the scenarios side by side.",
    ctaText: "👉 Compare Sell vs. Rent Now",
  },
  'equity-maximizer': {
    key: 'equity-maximizer',
    name: 'Equity Maximizer',
    emoji: '🔵',
    opening: "You value clarity, momentum, and access to capital.",
    explanation:
      "You're not interested in letting equity sit idle—you want to use it. Whether that's upgrading your lifestyle, redeploying into another investment, or simply simplifying your position.",
    insight: "Many homeowners underestimate how much liquidity can change their next move.",
    recommendation:
      "You'll get the most clarity by seeing exactly what selling puts in your pocket—after everything.",
    ctaText: "👉 See What You'd Walk Away With",
  },
  'flexible-landlord': {
    key: 'flexible-landlord',
    name: 'Flexible Landlord',
    emoji: '🟣',
    opening: "You're open to complexity if the long-term payoff makes sense.",
    explanation:
      "You see the appeal of holding onto the asset—especially if it can generate income and appreciate over time.",
    insight: "The key isn't just whether to rent—it's whether the numbers justify the effort.",
    recommendation:
      "Before deciding, compare your rental upside against what selling would actually give you today.",
    ctaText: "👉 Compare Rent vs. Sell",
  },
  'optionality-keeper': {
    key: 'optionality-keeper',
    name: 'Optionality Keeper',
    emoji: '🟡',
    opening: "You don't want to make a move that closes doors unnecessarily.",
    explanation:
      "You value flexibility. You'd rather stay in control of your options than rush into a decision that limits future choices.",
    insight:
      "In many cases, the best move isn't immediate action—it's understanding your position clearly enough to act when the timing is right.",
    recommendation: "Get clarity on both paths now—so you can move decisively later.",
    ctaText: "👉 See Both Paths Side by Side",
  },
  'simplicity-seeker': {
    key: 'simplicity-seeker',
    name: 'Simplicity Seeker',
    emoji: '🟠',
    opening: "You value a clean, low-friction path forward.",
    explanation:
      "While financial upside matters, it's not worth ongoing stress, uncertainty, or complexity.",
    insight:
      "Many homeowners hold longer than they should—not because it's optimal, but because they haven't seen a clean exit clearly.",
    recommendation: "See what a straightforward sale would actually look like—net of everything.",
    ctaText: "👉 See Your Clean Exit Number",
  },
};

export function calculateScores(answers: (number | null)[]): Scores {
  const scores: Scores = {
    'cautious-optimizer': 0,
    'equity-maximizer': 0,
    'flexible-landlord': 0,
    'optionality-keeper': 0,
    'simplicity-seeker': 0,
  };

  answers.forEach((answerIndex, questionIndex) => {
    if (answerIndex === null) return;
    const question = QUESTIONS[questionIndex];
    if (!question) return;
    const answer = question.answers[answerIndex];
    if (!answer) return;
    answer.scores.forEach(({ profile, points }) => {
      scores[profile] += points;
    });
  });

  return scores;
}

export function getQuizResult(answers: (number | null)[]): QuizResult {
  const scores = calculateScores(answers);
  const sorted = [...ALL_PROFILE_KEYS].sort((a, b) => scores[b] - scores[a]);

  let primary = sorted[0];
  const topScore = scores[primary];

  // Tie-break: prefer cautious-optimizer
  const tiedAtTop = sorted.filter((p) => scores[p] === topScore);
  if (tiedAtTop.length > 1 && tiedAtTop.includes('cautious-optimizer')) {
    primary = 'cautious-optimizer';
  }

  const remaining = sorted.filter((p) => p !== primary);
  const secondary = remaining[0] ?? 'cautious-optimizer';
  const secondScore = scores[secondary] ?? 0;

  let confidence: number;
  if (topScore === 0) {
    confidence = 60;
  } else {
    confidence = Math.round(((topScore - secondScore) / topScore) * 100);
    confidence = Math.max(60, Math.min(95, confidence));
  }

  return { primary, secondary, confidence, scores };
}
