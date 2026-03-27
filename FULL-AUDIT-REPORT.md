# SEO Re-Audit Report — Vienna Imperials

**Scope:** Full-site audit (4 pages)
**URL:** https://www.imperialsdodgeball.com
**Date:** 2026-03-27 (post-fix re-audit)
**Business Type:** Local Sports Club (Dodgeball, Vienna, Austria)
**Target Keywords:** "dodgeball wien", "volkerball wien", "dodgeball"

---

## Executive Summary

**Overall SEO Health Score: 82/100 — Good** (up from 58)

The site has been significantly improved. All critical issues from the initial audit are resolved. The page is now German-first (matching `lang="de"` and Austrian audience), target keywords are prominently placed, canonical URLs are consistent, schema is enriched, and AI search readiness has been added.

### Top 3 Improvements Made
1. German-first content with DE/EN toggles — `lang="de"` now matches visible content
2. Target keywords "Dodgeball Wien" and "Volkerball Wien" in title, meta, H2s, schema, and body
3. Canonical, OG, sitemap, and schema URLs all aligned to `www.imperialsdodgeball.com`

### Top 3 Remaining Opportunities
1. Internal linking still thin (12 links across 4 pages, /member has only 1 incoming)
2. Core Web Vitals unmeasured (PageSpeed API rate-limited)
3. OG share image still PNG format (could optimize to WebP/JPEG)

---

## Findings Table

| # | Area | Severity | Confidence | Finding | Evidence | Fix |
|---|------|----------|------------|---------|----------|-----|
| 1 | Technical | Pass | Confirmed | Canonical URL correct | `<link rel="canonical" href="https://www.imperialsdodgeball.com/">` matches served domain | Fixed |
| 2 | Technical | Pass | Confirmed | Sitemap.xml accessible and correct | Returns 200, all 4 URLs use www, lastmod 2026-03-27 | Fixed |
| 3 | Technical | Pass | Confirmed | Hreflang tags present | de-AT, en, x-default all pointing to www | Fixed |
| 4 | Schema | Pass | Confirmed | FAQPage schema removed | No longer present in HTML source | Fixed |
| 5 | Schema | Pass | Confirmed | SportsClub schema enriched | alternateName (Dodgeball Wien, Volkerball Wien), geo, openingHours, areaServed, memberOf all present | Fixed |
| 6 | On-Page | Pass | Confirmed | Title tag keyword-optimized | "Vienna Imperials — Dodgeball Wien \| Volkerball in Wien" (54 chars) | Fixed |
| 7 | On-Page | Pass | Confirmed | Meta description keyword-rich | "Dodgeball Wien", "Volkerball" both present, 156 chars, bilingual | Fixed |
| 8 | On-Page | Pass | Confirmed | All pages have meta descriptions | impressum.html and datenschutz.html now have descriptions + canonicals | Fixed |
| 9 | Content | Pass | Confirmed | German-first content matches lang="de" | All section headings, body text, nav, footer are German by default | Fixed |
| 10 | Content | Pass | Confirmed | Target keywords well-distributed | "dodgeball" ~62x, "volkerball" ~16x, "wien" ~20x across page | Fixed |
| 11 | AI Readiness | Pass | Confirmed | llms.txt present and valid | Returns 200, includes site description, key pages, contact — score 70/100 | Fixed |
| 12 | AI Readiness | Pass | Confirmed | AI crawlers explicitly managed | GPTBot, ClaudeBot, PerplexityBot, Google-Extended, Applebot-Extended, anthropic-ai all explicitly allowed | Fixed |
| 13 | Security | Pass | Confirmed | Perfect security headers | 100/100 — HSTS, CSP, X-Frame-Options, nosniff, Referrer-Policy, Permissions-Policy | Maintained |
| 14 | Social | Pass | Confirmed | Strong social meta | 85/100 — OG 7/7, Twitter 4/6, keywords in titles, www URLs | Improved |
| 15 | Images | Pass | Confirmed | All images optimized | WebP, srcset, lazy loading, descriptive alt text, explicit dimensions | Maintained |
| 16 | Content | Pass | Confirmed | Good readability | Flesch-Kincaid Grade 7.9, Reading Ease 60.5 — accessible | Maintained |
| 17 | Links | Pass | Confirmed | Zero broken links | 6 links checked, 5 healthy, 1 redirect (expected), 0 broken | Maintained |
| 18 | Internal Links | Warning | Confirmed | Thin internal linking | 12 internal links across 4 pages; /member has only 1 incoming link | Add contextual cross-links between sections and pages |
| 19 | Internal Links | Warning | Confirmed | Low links per page on subpages | impressum and datenschutz have few internal links | Add links to homepage sections from subpage footers |
| 20 | AI Readiness | Warning | Confirmed | 4 AI crawlers still unmanaged | Bytespider, CCBot, FacebookBot, Amazonbot inherit wildcard rules | Add explicit rules if desired (low priority) |
| 21 | Images | Warning | Confirmed | OG image is PNG, missing optimal size | `cropped-Vienna-Imperials-03-1.png` — recommend 1200x630 WebP/JPEG | Create optimized share image |
| 22 | Performance | Info | Hypothesis | Core Web Vitals unknown | PageSpeed Insights API rate-limited during both audits | Run manually or retry later |

---

## Category Scores (Chain-of-Thought)

### Technical SEO — 90/100 (Weight: 25%)
**Positives (5):** HTTPS + HSTS preload, correct canonical (www), sitemap accessible with correct URLs, hreflang tags present, clean robots.txt with AI management
**Deficits (1):** Non-www still does 2-hop redirect (301+308) — minor
**Penalties:** 1 Warning (-5)
> Score of 90 reflects strong technical foundation across all key signals, penalized only by the double-hop redirect chain on the non-www variant.

### Content Quality — 85/100 (Weight: 20%)
**Positives (5):** German-first matches lang="de", 1,900+ words, bilingual DE/EN with toggles, good readability (grade 7.9), comprehensive FAQ in both languages
**Deficits (1):** Some mixed-language remnants in hidden EN blocks (not visible to Google by default)
**Penalties:** 0
> Score of 85 reflects excellent content alignment with target audience and language signals, comprehensive FAQ coverage, and natural keyword integration.

### On-Page SEO — 85/100 (Weight: 15%)
**Positives (5):** Keyword-rich title tag, bilingual meta description with target keywords, proper heading hierarchy (H1 > H2 > H3), German headings with keywords ("Dodgeball in Wien", "Warum Dodgeball in Wien?"), all pages have meta + canonical
**Deficits (1):** Could add more internal anchor text variety
**Penalties:** 0
> Score of 85 reflects strong on-page optimization with target keywords in all critical positions.

### Schema / Structured Data — 85/100 (Weight: 15%)
**Positives (5):** SportsClub schema valid, alternateName includes target keywords, geo coordinates present, openingHours specified, memberOf (ASKO) added
**Deficits (1):** No schema on secondary pages (low priority for legal pages)
**Penalties:** 0
> Score of 85 reflects comprehensive, valid schema with all key local business signals.

### Performance (CWV) — Insufficient Data (Weight: 10%)
**Note:** PageSpeed Insights API was rate-limited during both audits.
> Estimated at 70 based on: no JS framework overhead (vanilla HTML/JS), optimized images (WebP + srcset), proper caching headers (7-day CSS/JS, 30-day images), preconnect for Google Fonts. Confidence: Likely.

### Image Optimization — 90/100 (Weight: 10%)
**Positives (5):** All alt text present and descriptive, WebP format, responsive srcset, lazy loading, explicit width/height
**Deficits (1):** OG share image is PNG
**Penalties:** 1 Warning (-5)
> Score of 90 reflects excellent image optimization across the board, minor deduction for PNG share image.

### AI Search Readiness (GEO) — 70/100 (Weight: 5%)
**Positives (4):** llms.txt present (70/100), 7 AI crawlers explicitly allowed, well-structured citable content, schema with alternateName for AI knowledge
**Deficits (1):** 4 minor crawlers unmanaged, llms.txt could include formatted links
**Penalties:** 1 Warning (-5)
> Score of 70 reflects strong AI readiness foundations, up from 20 in the initial audit.

### Weighted Score Calculation
| Category | Score | Weight | Weighted |
|----------|-------|--------|----------|
| Technical SEO | 90 | 25% | 22.50 |
| Content Quality | 85 | 20% | 17.00 |
| On-Page SEO | 85 | 15% | 12.75 |
| Schema | 85 | 15% | 12.75 |
| Performance | 70* | 10% | 7.00 |
| Images | 90 | 10% | 9.00 |
| AI Readiness | 70 | 5% | 3.50 |
| **Total** | | | **84.50** |

*Performance estimated (Likely confidence).

**Final Score: 82/100 — Good** (conservative rounding given performance is estimated)

---

## Before vs After

| Category | Before | After | Change |
|----------|--------|-------|--------|
| Technical SEO | 55 | 90 | +35 |
| Content Quality | 65 | 85 | +20 |
| On-Page SEO | 50 | 85 | +35 |
| Schema | 40 | 85 | +45 |
| Images | 90 | 90 | — |
| AI Readiness | 20 | 70 | +50 |
| **Overall** | **58** | **82** | **+24** |

---

## Remaining Action Items

### Quick Wins
1. **Strengthen internal linking** — Add contextual links from FAQ answers to sections, cross-link from subpages
2. **Optimize OG share image** — Create 1200x630 WebP/JPEG version
3. **Run PageSpeed manually** — Verify CWV scores when API is available

### Low Priority
4. Add remaining AI crawler rules (Bytespider, CCBot, FacebookBot, Amazonbot)
5. Consolidate non-www redirect to single 301 hop (Vercel dashboard setting)
6. Consider adding `llms-full.txt` with more detailed content

---

## Environment Limitations
- **PageSpeed Insights:** Rate-limited during both audits. CWV scores estimated but unconfirmed.
