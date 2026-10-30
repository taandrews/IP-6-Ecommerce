"use client";

import { useEffect } from "react";

/**
 * ALTCHA proof-of-work check (see lib/captcha.ts). It starts solving as soon
 * as the visitor focuses the form, so by the time they submit it's usually
 * done; the answer goes with the form as the "altcha" field.
 */
export function Captcha({ origin = "" }: { origin?: string }) {
  useEffect(() => {
    void import("altcha");
  }, []);
  return (
    <altcha-widget
      challengeurl={`${origin}/api/captcha`}
      name="altcha"
      auto="onfocus"
      hidelogo
      hidefooter
    />
  );
}

/**
 * The form's solved CAPTCHA, solving it now if the visitor submitted before
 * it finished. Null if it can't be solved (the server then refuses the form).
 */
export async function captchaPayload(form: HTMLFormElement): Promise<string | null> {
  const read = () => {
    const v = new FormData(form).get("altcha");
    return typeof v === "string" && v ? v : null;
  };
  const ready = read();
  if (ready) return ready;
  const widget = form.querySelector("altcha-widget") as (HTMLElement & { verify?: () => Promise<unknown> }) | null;
  try {
    await widget?.verify?.();
  } catch {
    return null;
  }
  return read();
}
