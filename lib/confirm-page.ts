import { NextResponse } from "next/server";
import { siteUrl } from "@/lib/site-url";

/**
 * A small self-contained page with one button that posts back to the link.
 * Opening an emailed link changes nothing (mail scanners open every link);
 * only the button does. No scripts, no analytics that could see the token.
 */
const escape = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

export function confirmPage(opts: { title: string; text: string; button: string; action: string; fields: Record<string, string> }) {
  const inputs = Object.entries(opts.fields)
    .map(([k, v]) => `<input type="hidden" name="${escape(k)}" value="${escape(v)}">`)
    .join("");
  const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex"><title>${escape(opts.title)} | IP6 Original</title>
<style>
body{margin:0;min-height:100vh;display:grid;place-items:center;background:#F7F9FB;color:#001840;font:16px/1.5 system-ui,-apple-system,"Segoe UI",sans-serif;padding:16px;box-sizing:border-box}
main{max-width:440px;background:#fff;border:1px solid #E8EDF3;border-radius:12px;padding:32px}
h1{font-size:22px;margin:0 0 12px;color:#001840}p{margin:0 0 20px;color:#334766}
button{background:#001840;color:#fff;border:0;border-radius:999px;padding:12px 24px;font:inherit;font-weight:600;cursor:pointer}
button:hover{background:#0C2C5E}
</style></head><body><main>
<h1>${escape(opts.title)}</h1>
<p>${escape(opts.text)}</p>
<form method="post" action="${escape(opts.action)}">${inputs}<button type="submit">${escape(opts.button)}</button></form>
</main></body></html>`;
  return new NextResponse(html, {
    headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store", "Referrer-Policy": "no-referrer", "X-Robots-Tag": "noindex" },
  });
}

/** Sends the visitor back to a site page after the button, without leaking the token in Referer. */
export function redirectAfter(req: Request, path: string, params: Record<string, string>) {
  const to = siteUrl(path, req);
  for (const [k, v] of Object.entries(params)) to.searchParams.set(k, v);
  const res = NextResponse.redirect(to, { status: 303 });
  res.headers.set("Referrer-Policy", "no-referrer");
  return res;
}
