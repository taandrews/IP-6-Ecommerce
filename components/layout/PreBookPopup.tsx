"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import s from "./PreBookPopup.module.css";

const KEY = "ip6quiz_seen_v1";
const LAUNCH_MS = Date.parse("2026-10-03T04:00:00Z");
const PRODUCT_URL = "/shop/ip6-original-supplement";

type Step = "intent" | "email" | "q2" | "q3" | "q4" | "q5" | "q6" | "reveal";
const ORDER: Step[] = ["intent", "email", "q2", "q3", "q4", "q5", "q6", "reveal"];

type Opt = { v: string; label: string };
const QUESTIONS: Record<Exclude<Step, "intent" | "email" | "reveal">, { q: string; eyebrow: string; title: string; opts: Opt[] }> = {
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

const INTENTS: Opt[] = [
  { v: "everyday", label: "Everyday cellular health & longevity" },
  { v: "immune", label: "Immune & antioxidant support" },
  { v: "research", label: "I follow the research" },
  { v: "family", label: "For a family member" },
];

const RESULT_COPY: Record<string, string> = {
  everyday: "A high-purity IP6 and Inositol formula for daily cellular health support, made to the standard the research describes.",
  immune: "IP6 is a naturally occurring antioxidant. IP6 Original delivers it at research-grade purity, third-party tested.",
  research: "The original formula, built by the physician-scientist who pioneered the research, formulated to his specification.",
  family: "A clean, third-party-tested formula you can feel good about sharing.",
};

function seenBefore() {
  try {
    if (localStorage.getItem(KEY)) return true;
  } catch {}
  return document.cookie.indexOf(`${KEY}=1`) >= 0;
}

function markSeen() {
  try {
    localStorage.setItem(KEY, "1");
  } catch {}
  document.cookie = `${KEY}=1;path=/;max-age=2592000`;
}

function Countdown() {
  const [left, setLeft] = useState<number | null>(null);
  useEffect(() => {
    const tick = () => setLeft(LAUNCH_MS - Date.now());
    tick();
    const iv = setInterval(tick, 1000);
    return () => clearInterval(iv);
  }, []);
  if (left === null || left <= 0) return null;
  const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
  const units = [
    { n: `${Math.floor(left / 86400000)}`, l: "Days" },
    { n: pad(Math.floor(left / 3600000) % 24), l: "Hours" },
    { n: pad(Math.floor(left / 60000) % 60), l: "Min" },
    { n: pad(Math.floor(left / 1000) % 60), l: "Sec" },
  ];
  return (
    <div className={s.count} aria-label="Time until launch">
      {units.map((u) => (
        <div key={u.l} className={s.unit}>
          <div className={s.num}>{u.n}</div>
          <div className={s.lbl}>{u.l}</div>
        </div>
      ))}
    </div>
  );
}

export function PreBookPopup() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>("intent");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const lastFocused = useRef<Element | null>(null);

  const show = useCallback(() => {
    if (seenBefore()) return;
    lastFocused.current = document.activeElement;
    setOpen(true);
  }, []);

  const close = useCallback(() => {
    setOpen(false);
    markSeen();
    (lastFocused.current as HTMLElement | null)?.focus?.();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("quiz") === "1" || window.location.hash === "#quiz") {
      try {
        localStorage.removeItem(KEY);
      } catch {}
      document.cookie = `${KEY}=;path=/;max-age=0`;
      const t = setTimeout(show, 300);
      return () => clearTimeout(t);
    }
    if (seenBefore()) return;
    const t = setTimeout(show, 5000);
    const onMouseOut = (e: MouseEvent) => {
      if (e.clientY <= 0) show();
    };
    document.addEventListener("mouseout", onMouseOut);
    return () => {
      clearTimeout(t);
      document.removeEventListener("mouseout", onMouseOut);
    };
  }, [show]);

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    rootRef.current?.querySelector<HTMLElement>("[data-close]")?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") return close();
      if (e.key !== "Tab" || !rootRef.current) return;
      const f = Array.from(
        rootRef.current.querySelectorAll<HTMLElement>("button, [href], input, [tabindex]:not([tabindex='-1'])"),
      ).filter((el) => el.offsetParent !== null && !(el as HTMLButtonElement).disabled);
      if (!f.length) return;
      const first = f[0]!;
      const last = f[f.length - 1]!;
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", onKey);
    };
  }, [open, close]);

  if (!open) return null;

  const idx = ORDER.indexOf(step);
  const qStart = ORDER.indexOf("email");
  const qEnd = ORDER.indexOf("reveal");
  const pct = idx < qStart ? 0 : Math.min(100, Math.round(((idx - qStart) / (qEnd - qStart)) * 100));

  const pick = (q: string, v: string) => {
    setAnswers((a) => ({ ...a, [q]: v }));
    setStep(step === "intent" ? "email" : ORDER[idx + 1] ?? "reveal");
  };

  const submitEmail = (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim()) || !consent) {
      setError(true);
      return;
    }
    setError(false);
    fetch("/api/newsletter", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email.trim() }),
    }).catch(() => {});
    setStep("q2");
  };

  let result = RESULT_COPY[answers.intent ?? "everyday"] ?? RESULT_COPY.everyday;
  if (answers.experience === "new") result += " New to IP6? Take it on an empty stomach, with water.";
  const dailyNudge = answers.routine === "daily" || answers.experience === "regular";

  return (
    <div ref={rootRef} className={s.root} role="dialog" aria-modal="true" aria-label="Pre-book IP6 Original and receive 20% off">
      <div className={s.panel}>
        <div className={s.media} aria-hidden="true">
          <div className={s.mtag}>
            <div className={s.mtagE}>Science Driven · Purity First</div>
            <div className={s.mtagH}>Strengthen your cellular health</div>
          </div>
        </div>
        <div className={s.side}>
          <div className={s.bar}>
            <i style={{ width: `${pct}%` }} />
          </div>
          <div className={s.top}>
            <span className={s.brand}>IP6 Original</span>
            <button type="button" className={s.close} data-close onClick={close}>
              No thanks &times;
            </button>
          </div>
          <div className={s.body}>
            <div className={s.inner} key={step}>
              {step === "intent" && (
                <>
                  <span className={s.eyebrow}>From the lab of Professor AbulKalam M. Shamsuddin, MD, PhD</span>
                  <div className={s.launch}>
                    <div className={s.kicker}>Coming October 3, 2026</div>
                    <div className={s.offer}>
                      Pre-Book Now &amp; Receive <b>20% Off</b>
                    </div>
                    <Countdown />
                  </div>
                  <p className={s.sub}>What brings you to IP6 Original?</p>
                  <div className={s.opts}>
                    {INTENTS.map((o) => (
                      <button key={o.v} type="button" className={s.opt} onClick={() => pick("intent", o.v)}>
                        {o.label} <span aria-hidden="true">&rarr;</span>
                      </button>
                    ))}
                  </div>
                </>
              )}

              {step === "email" && (
                <>
                  <h2 className={s.h2}>Where should we send your 20% off?</h2>
                  <p className={s.sub}>Your pre-book discount is reserved. Answer a few quick questions and it&apos;s yours.</p>
                  <form className={s.form} onSubmit={submitEmail} noValidate>
                    <label htmlFor="pb-email" className={s.srOnly}>
                      Email address
                    </label>
                    <input
                      id="pb-email"
                      type="email"
                      className={s.input}
                      placeholder="Email address"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                    <label className={s.consent}>
                      <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} required /> Email
                      me my pre-book offer and occasional research-backed updates.
                    </label>
                    {error && <div className={s.err}>Please enter your email and check the box to continue.</div>}
                    <button type="submit" className={s.btn}>
                      Continue
                    </button>
                    <p className={s.micro}>Unsubscribe anytime. No spam.</p>
                  </form>
                </>
              )}

              {step in QUESTIONS && (
                <>
                  <p className={s.eyebrow}>{QUESTIONS[step as keyof typeof QUESTIONS].eyebrow}</p>
                  <h2 className={s.h2}>{QUESTIONS[step as keyof typeof QUESTIONS].title}</h2>
                  <div className={s.opts}>
                    {QUESTIONS[step as keyof typeof QUESTIONS].opts.map((o) => (
                      <button
                        key={o.v}
                        type="button"
                        className={s.opt}
                        onClick={() => pick(QUESTIONS[step as keyof typeof QUESTIONS].q, o.v)}
                      >
                        {o.label} <span aria-hidden="true">&rarr;</span>
                      </button>
                    ))}
                  </div>
                </>
              )}

              {step === "reveal" && (
                <>
                  <span className={s.eyebrow}>Your match</span>
                  <h2 className={s.h2}>IP6 Original is your match.</h2>
                  <p className={s.sub}>{result}</p>
                  <p className={s.price}>
                    Pre-book price with 20% off: <b>$39.20</b> <s>$49.00</s>
                  </p>
                  <p className={s.micro}>Your pre-book offer will be emailed to {email.trim()}. Ships on or after October 3, 2026.</p>
                  <a className={s.cta} href={PRODUCT_URL} onClick={markSeen}>
                    See IP6 Original &rarr;
                  </a>
                  <p className={s.nudge}>
                    {dailyNudge ? (
                      <>
                        You take it daily, <b>Subscribe &amp; Save</b> makes it a standing 15% off monthly, cancel anytime.
                      </>
                    ) : (
                      <>Subscribe &amp; save to keep the discount going.</>
                    )}
                  </p>
                  <div className={s.reassure}>
                    <span>cGMP Certified</span>
                    <span>Third-Party Tested</span>
                    <span>30-Day Returns</span>
                  </div>
                </>
              )}
            </div>
          </div>
          <div className={s.disc}>
            These statements have not been evaluated by the Food and Drug Administration. This product is not intended to
            diagnose, treat, cure, or prevent any disease.
          </div>
        </div>
      </div>
    </div>
  );
}
