import { chromium } from "playwright";
import { writeFile, mkdir } from "node:fs/promises";

const URL = "https://www.ozempic.com/";
const OUT = "scripts/ozempic-inspection";

await mkdir(OUT, { recursive: true });

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();

await page.goto(URL, { waitUntil: "domcontentloaded", timeout: 45000 });

// Wait a bit for cookie banner / scripts to render
await page.waitForTimeout(2500);

// Dismiss cookie banner — try a few common selectors
const cookieSelectors = [
  "#onetrust-accept-btn-handler",
  "button#onetrust-accept-btn-handler",
  'button[aria-label*="Accept"]',
  'button:has-text("Accept All")',
  'button:has-text("Accept")',
];
for (const sel of cookieSelectors) {
  const btn = await page.locator(sel).first();
  if ((await btn.count()) > 0) {
    try {
      await btn.click({ timeout: 3000 });
      break;
    } catch {
      /* keep trying */
    }
  }
}
await page.waitForTimeout(1500);

// Full page screenshot for reference
await page.screenshot({ path: `${OUT}/full-page.png`, fullPage: true });

// Hero viewport — the first 1000px below the top nav
await page.screenshot({ path: `${OUT}/hero-viewport.png`, clip: { x: 0, y: 0, width: 1440, height: 900 } });

// Isolate the hero container — find the first <main> or biggest top-of-page wrapper
const heroData = await page.evaluate(() => {
  const candidates = [
    'main section:first-of-type',
    'section:first-of-type',
    'main > div:first-child',
    'main',
  ];
  let root = null;
  for (const sel of candidates) {
    const el = document.querySelector(sel);
    if (el) { root = el; break; }
  }
  if (!root) return null;

  const rect = root.getBoundingClientRect();
  const css = window.getComputedStyle(root);
  const heroHTML = root.outerHTML.slice(0, 18000);

  // Also pull the h1 and nearest big text elements
  const h1 = document.querySelector('h1');
  const h1Rect = h1?.getBoundingClientRect();
  const h1Style = h1 ? window.getComputedStyle(h1) : null;

  // Find the biggest image inside the hero
  const imgs = Array.from(root.querySelectorAll('img, picture source')).map((el) => {
    const r = (el).getBoundingClientRect();
    return {
      tag: el.tagName,
      src: (el).currentSrc || (el).src || (el).srcset,
      width: r.width,
      height: r.height,
    };
  }).sort((a, b) => (b.width * b.height) - (a.width * a.height)).slice(0, 5);

  // Find all buttons/links in the hero
  const ctas = Array.from(root.querySelectorAll('a, button')).slice(0, 10).map((el) => {
    const r = (el).getBoundingClientRect();
    const s = window.getComputedStyle(el);
    return {
      text: (el).innerText.trim().slice(0, 80),
      bg: s.backgroundColor,
      color: s.color,
      fontSize: s.fontSize,
      fontWeight: s.fontWeight,
      borderRadius: s.borderRadius,
      padding: s.padding,
      width: r.width,
      height: r.height,
    };
  });

  return {
    rect: { top: rect.top, width: rect.width, height: rect.height },
    background: css.backgroundColor,
    padding: css.padding,
    heroHTML,
    h1: h1 ? {
      text: h1.innerText.slice(0, 200),
      fontFamily: h1Style.fontFamily,
      fontSize: h1Style.fontSize,
      fontWeight: h1Style.fontWeight,
      lineHeight: h1Style.lineHeight,
      letterSpacing: h1Style.letterSpacing,
      color: h1Style.color,
      rectWidth: h1Rect.width,
      rectHeight: h1Rect.height,
    } : null,
    imgs,
    ctas,
  };
});

await writeFile(`${OUT}/hero-data.json`, JSON.stringify(heroData, null, 2));

// Also grab the top ~4000 characters of page CSS stylesheet
const styles = await page.evaluate(() => {
  const sheets = Array.from(document.styleSheets);
  const lines = [];
  for (const s of sheets) {
    try {
      const rules = Array.from(s.cssRules ?? []);
      for (const r of rules.slice(0, 60)) lines.push(r.cssText);
    } catch { /* cross-origin stylesheet */ }
    if (lines.join("\n").length > 6000) break;
  }
  return lines.join("\n").slice(0, 6000);
});
await writeFile(`${OUT}/styles-sample.css`, styles);

console.log(JSON.stringify({
  screenshots: [`${OUT}/full-page.png`, `${OUT}/hero-viewport.png`],
  hero: heroData ? {
    rect: heroData.rect,
    background: heroData.background,
    h1: heroData.h1,
    imgCount: heroData.imgs.length,
    firstImg: heroData.imgs[0],
    firstCtas: heroData.ctas.slice(0, 5),
  } : null,
}, null, 2));

await browser.close();
