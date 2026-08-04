# Site Optimization Plan (2026-08-04)

Follow-up from the optimization pass. Audit basis: Lighthouse (SEO 100, A11y 93, LCP 0.6 s, CLS 0), Shopify theme-check (3 errors fixed, 46 warnings remain), asset inventory.

**Status 2026-08-04: Section 1 complete and live (commit f6d57b1). The gold-contrast item from Section 2 was also fixed on owner instruction ("fix all"): text gold darkened to #8A6A1F, 5.05:1. Bonus: IBM Plex is now self-hosted from theme assets, replacing the render-blocking Google Fonts CSS.**

## Section 1: Will fix

1. **Delete unused heavy assets from the theme** (local + live via Assets API):
   - `ip6-how-to-take.png` (2.4 MB, unreferenced)
   - `ip6-pets-dogs.png` (1.6 MB, unreferenced)
   - `ip6-founder.png` (2.4 MB, superseded by `ip6-founder.jpg`)
2. **Recompress the remaining heavy JPGs** (no dimension change, quality ~82):
   - `ip6-pet-powder.jpg` (346 KB), `ip6-pet-powder-framed.jpg` (212 KB), `ip6-pet-caps-framed.jpg` (189 KB), `ip6-pet-caps-front.jpg` (168 KB), `ip6-pet-life2.jpg` (164 KB), `ip6-family.jpg` (160 KB). Skip `ip6-pet-label.jpg` (fine text, recompression risks legibility).
3. **Powder page copy bug:** Supplement Facts note says "Capsules use a plant-based (cellulose) shell" on the powder PDP. Make the sentence conditional on the `powder` tag.
4. **Actionable theme-check warnings:** remaining hardcoded routes in custom sections/snippets; remove or wire up the orphaned `ip6-product-card.liquid` snippet.
5. **Commit all pending theme changes to git** (copy removals + optimization pass are live but uncommitted).

## Section 2: Deferred / left open

- **Gold text contrast (~3.5:1 vs 4.5:1 AA)** on `.ip6-eyebrow` / `.ip6-textlink`. CSS marks it as an accepted brand deviation in the locked design system. Fix would be darkening `--teal`/`--gold-deep` to ~#8A6A1F. Owner decision: brand color vs. WCAG AA.
- **Product label images** still show "Veterinarian Recommended" and printed mg amounts. Needs new label artwork, not a theme change.
- **Lighthouse best-practices flags from the password/preview bar** (third-party cookies, untitled iframe). Not fixable; disappear when the store goes live without password.
- **Subscribe & Save is illustrative** until Recharge is installed. Blocked: app installs need owner approval (existing blocker list: Recharge/reviews apps, domain connection, payments, publish/remove password).
- **Horizon base-theme warnings** from theme-check (~40, in stock Horizon files like `search-modal.liquid`). Editing stock theme files complicates future theme updates; leave unless they cause a real defect.

Items in Section 1 get executed on approval; Section 2 stays parked until the owner unblocks or decides.
