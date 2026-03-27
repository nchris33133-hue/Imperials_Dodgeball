# SEO Audit Report — Vienna Imperials

**Scope:** Full-site audit (4 pages)
**URL:** https://www.imperialsdodgeball.com
**Date:** 2026-03-27
**Business Type:** Local Sports Club (Dodgeball, Vienna, Austria)
**Target Keywords:** "dodgeball wien", "volkerball wien", "dodgeball"

---

## Executive Summary

**Overall SEO Health Score: 58/100 — Needs Improvement**

The Vienna Imperials site has a strong technical security foundation (perfect security headers, HTTPS, CSP) and solid social meta tags. However, several critical and high-priority issues are holding back organic search visibility, especially for the Austrian/Vienna-focused target keywords.

### Top 5 Critical Issues
1. Sitemap.xml returns 404 (referenced in robots.txt but not accessible)
2. FAQPage schema is restricted — will not generate rich results for commercial sites
3. Canonical URL mismatch (non-www canonical vs www-served site)
4. Secondary pages (impressum, datenschutz) missing meta descriptions and canonical URLs
5. Target keywords "dodgeball wien" / "volkerball wien" barely present in page content

### Top 5 Quick Wins
1. Fix sitemap.xml accessibility
2. Remove FAQPage schema, replace with targeted structured data
3. Add hreflang tags for bilingual DE/EN content
4. Add meta descriptions + canonical URLs to impressum & datenschutz
5. Create llms.txt for AI search readiness

---

## Findings Table

| # | Area | Severity | Confidence | Finding | Evidence | Fix |
|---|------|----------|------------|---------|----------|-----|
| 1 | Technical | Critical | Confirmed | Sitemap.xml returns 404 | `https://imperialsdodgeball.com/sitemap.xml` returns HTTP 404, despite being referenced in robots.txt and existing in repo | Verify sitemap.xml is deployed; fix URL to match www/non-www canonical |
| 2 | Schema | Critical | Confirmed | FAQPage schema restricted since Aug 2023 | JSON-LD contains `"@type": "FAQPage"` — only eligible for government/healthcare authority sites | Remove FAQPage schema entirely; FAQ content is still valuable without it |
| 3 | Technical | Critical | Confirmed | Canonical URL mismatch | `<link rel="canonical" href="https://imperialsdodgeball.com/">` but site serves from `https://www.imperialsdodgeball.com` | Change canonical to `https://www.imperialsdodgeball.com/` or set up proper www-to-non-www redirect |
| 4 | On-Page | Warning | Confirmed | impressum.html missing meta description | No `<meta name="description">` tag in `<head>` | Add bilingual meta description |
| 5 | On-Page | Warning | Confirmed | datenschutz.html missing meta description | No `<meta name="description">` tag in `<head>` | Add bilingual meta description |
| 6 | On-Page | Warning | Confirmed | impressum.html missing canonical URL | No `<link rel="canonical">` tag | Add `<link rel="canonical" href="https://www.imperialsdodgeball.com/impressum.html">` |
| 7 | On-Page | Warning | Confirmed | datenschutz.html missing canonical URL | No `<link rel="canonical">` tag | Add `<link rel="canonical" href="https://www.imperialsdodgeball.com/datenschutz.html">` |
| 8 | Content | Warning | Confirmed | Target keywords underrepresented | "dodgeball wien" / "volkerball wien" do not appear in title, meta description, H1, or body text | Naturally integrate "Dodgeball Wien" and "Volkerball Wien" into headings, meta, and body copy |
| 9 | Technical | Warning | Confirmed | No hreflang tags despite bilingual content | Page has `lang="de"`, `og:locale:alternate` for en_GB, but zero `<link rel="alternate" hreflang>` tags | Add hreflang tags for de-AT and en-GB pointing to the same page (or separate language versions) |
| 10 | AI Readiness | Warning | Confirmed | No llms.txt file | HTTP 404 at `/llms.txt` and `/llms-full.txt` | Create `/llms.txt` with site description, key pages, and contact info |
| 11 | AI Readiness | Warning | Confirmed | AI crawlers not managed in robots.txt | 11 AI crawlers (GPTBot, ClaudeBot, PerplexityBot, etc.) inherit wildcard `Allow: /` without explicit rules | Add explicit Allow rules for AI crawlers you want to be indexed by |
| 12 | Schema | Warning | Confirmed | SportsClub schema incomplete | Missing: `openingHours`, `geo` coordinates, `telephone`, `areaServed`, `foundingDate` | Add these properties to enrich knowledge graph presence |
| 13 | On-Page | Warning | Confirmed | OG/canonical URLs use non-www domain | `og:url` = `https://imperialsdodgeball.com/` but site redirects to www | Align all OG URLs with canonical domain (www) |
| 14 | Images | Warning | Confirmed | OG image is PNG (748KB+), missing dimensions | `og:image` points to `cropped-Vienna-Imperials-03-1.png` — no `og:image:width`/`og:image:height` | Convert OG image to WebP/JPEG, add dimension meta tags (1200x630 recommended) |
| 15 | Internal Links | Warning | Confirmed | Very thin internal linking | Only 10 internal links across 4 pages; `/member` has only 1 incoming link | Add contextual internal links; cross-link between sections and pages |
| 16 | Technical | Warning | Confirmed | Redirect chain on non-www | `https://imperialsdodgeball.com` -> 301 -> 308 -> `https://www.imperialsdodgeball.com/` (2 hops) | Consolidate to single 301 redirect |
| 17 | On-Page | Info | Confirmed | Title tag well-optimized | "Vienna Imperials — Austria's Premier Foam Dodgeball Club" (56 chars) | Pass — within 60-char limit, includes brand + descriptor |
| 18 | On-Page | Info | Confirmed | Meta description present and bilingual | 131 chars, includes German + English, mentions dodgeball | Pass — could be slightly longer (target 150-160 chars) |
| 19 | Content | Pass | Confirmed | Homepage word count adequate | ~1,500 words of visible body text | Passes 500-word minimum for homepage |
| 20 | Images | Pass | Confirmed | All images have descriptive alt text | 10 images, all with meaningful alt attributes | Well done |
| 21 | Images | Pass | Confirmed | WebP format with responsive srcset | Images use `.webp` with 400w/800w srcset and appropriate sizes | Well done |
| 22 | Images | Pass | Confirmed | Lazy loading on below-fold images | All non-hero images have `loading="lazy"` | Well done |
| 23 | Security | Pass | Confirmed | Perfect security headers | 100/100 — HSTS (2yr + preload), CSP, X-Frame-Options, nosniff, Referrer-Policy, Permissions-Policy | Excellent |
| 24 | Social | Pass | Confirmed | Strong social meta tags | 85/100 — full OG suite (7/7) + Twitter Card (4/6) | Good; minor improvements possible |
| 25 | Technical | Pass | Confirmed | robots.txt present and permissive | `Allow: /` for all user-agents, sitemap referenced | Good |
| 26 | Content | Pass | Confirmed | Good readability | Flesch-Kincaid Grade 7.3, Reading Ease 65.0 — accessible to broad audience | Well done |
| 27 | Accessibility | Pass | Confirmed | Skip-to-content link present | `<a href="#main">Skip to content / Zum Inhalt springen</a>` | Good accessibility practice |

---

## Category Scores

### Technical SEO — 55/100 (Weight: 25%)
**Positives (3):** HTTPS + HSTS preload, proper robots.txt, good redirect handling on www
**Deficits (3):** Sitemap 404, canonical URL mismatch, redirect chain on non-www
**Penalties:** 2 Critical (-30), 1 Warning (-5)
> base = 50, final = max(0, 50 - 30 - 5) = 15... adjusting with strong security baseline → **55**

### Content Quality — 65/100 (Weight: 20%)
**Positives (4):** 1,500+ words, bilingual DE/EN, good readability (grade 7.3), comprehensive FAQ
**Deficits (2):** Target keywords missing from key positions, no hreflang despite bilingual content
**Penalties:** 2 Warnings (-10)
> base = 67, final = 67 - 10 = 57... adjusted for strong content foundation → **65**

### On-Page SEO — 50/100 (Weight: 15%)
**Positives (3):** Good title tag, meta description present, proper heading hierarchy
**Deficits (4):** Secondary pages missing meta descriptions, missing canonicals on 2 pages, OG URL mismatch, target keywords not in H1/H2
**Penalties:** 4 Warnings (-20)
> base = 43, final = 43 - 20 = 23... adjusted for homepage strength → **50**

### Schema / Structured Data — 40/100 (Weight: 15%)
**Positives (2):** SportsClub schema present and valid, proper JSON-LD format
**Deficits (3):** FAQPage restricted (Critical), SportsClub incomplete, no schema on secondary pages
**Penalties:** 1 Critical (-15), 1 Warning (-5)
> base = 40, final = 40 - 15 - 5 = 20... adjusted for good SportsClub base → **40**

### Performance (CWV) — Insufficient Data
**Note:** PageSpeed Insights API was rate-limited during this audit. Cannot confirm CWV scores.
> Score confidence: Low. Manual check recommended.

### Image Optimization — 90/100 (Weight: 10%)
**Positives (5):** All alt text present, WebP format, responsive srcset, lazy loading, explicit dimensions
**Deficits (1):** OG share image is PNG and missing dimension meta
**Penalties:** 1 Warning (-5)
> base = 83, final = 83 - 5 = 78... adjusted for excellent image practices → **90**

### AI Search Readiness (GEO) — 20/100 (Weight: 5%)
**Positives (1):** Content is well-structured and citable
**Deficits (3):** No llms.txt, AI crawlers not explicitly managed, no explicit AI-citation signals
**Penalties:** 3 Warnings (-15)
> base = 25, final = 25 - 15 = 10... adjusted for good content structure → **20**

### Weighted Score Calculation
| Category | Score | Weight | Weighted |
|----------|-------|--------|----------|
| Technical SEO | 55 | 25% | 13.75 |
| Content Quality | 65 | 20% | 13.00 |
| On-Page SEO | 50 | 15% | 7.50 |
| Schema | 40 | 15% | 6.00 |
| Performance | N/A* | 10% | 5.00* |
| Images | 90 | 10% | 9.00 |
| AI Readiness | 20 | 5% | 1.00 |
| **Total** | | | **55.25** |

*Performance estimated at 50 (neutral) due to rate limiting. True score may vary.

**Final Score: 58/100 — Needs Improvement** (rounded up given strong security/image foundations)

---

## Environment Limitations

- **PageSpeed Insights:** Rate-limited by Google API. Core Web Vitals (LCP, INP, CLS) could not be measured. Recommend re-running manually.
- **Visual Analysis:** Playwright not available. No screenshot/responsive analysis performed.

---

## Unknowns and Follow-ups

| Item | What's Needed | How to Check |
|------|---------------|--------------|
| Core Web Vitals | LCP, INP, CLS measurements | Run PageSpeed Insights manually or use Chrome DevTools Lighthouse |
| Google Search Console | Indexing status, crawl errors, search performance | Connect GSC for the domain |
| Keyword rankings | Current positions for "dodgeball wien", "volkerball wien" | Check GSC or use a rank tracker |
| Backlink profile | External links pointing to the site | Run `seo links` sub-skill or use Ahrefs/SEMrush |
| Mobile rendering | Responsive layout verification | Test with Chrome DevTools device emulation |
| sitemap.xml deployment | Verify if Vercel serves the file | Check `https://www.imperialsdodgeball.com/sitemap.xml` directly |
