/**
 * The pre-order quiz: its questions and allowed answers. Shared by the pop-up,
 * the API that saves answers (only these values are accepted) and the admin.
 */
export type Opt = { v: string; label: string };
export const QUESTIONS: Record<"q2" | "q3" | "q4" | "q5" | "q6", { q: string; eyebrow: string; title: string; opts: Opt[] }> = {
  q2: { q: "experience", eyebrow: "A quick question", title: "Have you taken IP6 before?", opts: [
    { v: "regular", label: "I take it regularly" },
    { v: "tried", label: "I've tried it" },
    { v: "new", label: "No, I'm new to IP6" },
  ] },
  q3: { q: "values", eyebrow: "What matters most", title: "What matters most to you in a supplement?", opts: [
    { v: "purity", label: "Purity & third-party testing" },
    { v: "research", label: "Research-backed ingredients" },
    { v: "founder", label: "Formulated by the scientist behind the research" },
    { v: "clean", label: "Clean formulation, no fillers" },
  ] },
  q4: { q: "goal", eyebrow: "Your goal", title: "What's your main goal right now?", opts: [
    { v: "cellular", label: "General cellular health & longevity" },
    { v: "immune", label: "Immune & antioxidant support" },
    { v: "aging", label: "Healthy aging" },
    { v: "protocol", label: "Following a protocol / my doctor's guidance" },
  ] },
  q5: { q: "routine", eyebrow: "Your routine", title: "How would you describe your supplement routine?", opts: [
    { v: "daily", label: "Daily, I'm consistent" },
    { v: "onoff", label: "On and off" },
    { v: "starting", label: "Just getting started" },
  ] },
  q6: { q: "age", eyebrow: "Almost done", title: "Your age range", opts: [
    { v: "18-34", label: "18 to 34" },
    { v: "35-49", label: "35 to 49" },
    { v: "50-64", label: "50 to 64" },
    { v: "65+", label: "65+" },
  ] },
};

export const INTENTS: Opt[] = [
  { v: "everyday", label: "Everyday cellular health & longevity" },
  { v: "immune", label: "Immune & antioxidant support" },
  { v: "research", label: "I follow the research" },
  { v: "family", label: "For a family member" },
];

/** Answer key (intent, experience, values, goal, routine, age) to its allowed values. */
export const QUIZ_ANSWERS: Record<string, string[]> = {
  intent: INTENTS.map((o) => o.v),
  ...Object.fromEntries(Object.values(QUESTIONS).map((q) => [q.q, q.opts.map((o) => o.v)])),
};

/** The questions in quiz order, for the admin. */
export const QUIZ_LABELS: { key: string; title: string; opts: Opt[] }[] = [
  { key: "intent", title: "What brings you to IP6 Original?", opts: INTENTS },
  ...Object.values(QUESTIONS).map((q) => ({ key: q.q, title: q.title, opts: q.opts })),
];

export function quizAnswerLabel(key: string, value: string) {
  return QUIZ_LABELS.find((q) => q.key === key)?.opts.find((o) => o.v === value)?.label ?? value;
}
