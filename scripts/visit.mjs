import { chromium } from "playwright";
import { writeFile, mkdir } from "node:fs/promises";

const URL = process.argv[2] ?? "http://localhost:3058/";
const OUT = "scripts/screenshots";

await mkdir(OUT, { recursive: true });

const browser = await chromium.launch();
const results = [];

for (const viewport of [
  { name: "desktop", width: 1440, height: 900 },
  { name: "mobile", width: 390, height: 844 },
]) {
  const ctx = await browser.newContext({ viewport });
  const page = await ctx.newPage();
  const consoleErrors = [];
  const failedRequests = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(msg.text());
  });
  page.on("requestfailed", (req) => {
    failedRequests.push(`${req.method()} ${req.url()} — ${req.failure()?.errorText}`);
  });

  const start = Date.now();
  const response = await page.goto(URL, { waitUntil: "networkidle", timeout: 30000 });
  const loadMs = Date.now() - start;

  const title = await page.title();
  const h1 = (await page.locator("h1").first().textContent().catch(() => null))?.trim();
  const h2Count = await page.locator("h2").count();
  const imgCount = await page.locator("img").count();
  const brokenImages = await page.$$eval("img", (imgs) =>
    imgs
      .filter((i) => i.complete && i.naturalWidth === 0)
      .map((i) => i.getAttribute("src") ?? i.getAttribute("srcset") ?? ""),
  );
  const visibleCtas = await page.$$eval("a, button", (els) =>
    els
      .filter((el) => {
        const r = el.getBoundingClientRect();
        const style = window.getComputedStyle(el);
        return r.width > 0 && r.height > 0 && style.visibility !== "hidden" && style.display !== "none";
      })
      .slice(0, 40)
      .map((el) => el.textContent?.trim().replace(/\s+/g, " "))
      .filter(Boolean),
  );

  const shotPath = `${OUT}/${viewport.name}.png`;
  await page.screenshot({ path: shotPath, fullPage: true });

  results.push({
    viewport: viewport.name,
    dimensions: `${viewport.width}x${viewport.height}`,
    status: response?.status(),
    loadMs,
    title,
    h1,
    h2Count,
    imgCount,
    brokenImages: brokenImages.slice(0, 5),
    consoleErrors: consoleErrors.slice(0, 10),
    failedRequests: failedRequests.slice(0, 10),
    firstCtas: visibleCtas.slice(0, 12),
    screenshot: shotPath,
  });

  await ctx.close();
}

await browser.close();

const report = JSON.stringify(results, null, 2);
await writeFile(`${OUT}/report.json`, report);
console.log(report);
