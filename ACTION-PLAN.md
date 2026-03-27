# SEO Action Plan — Vienna Imperials

**Date:** 2026-03-27
**Current Score:** 58/100
**Target Score:** 80+/100
**Target Keywords:** "dodgeball wien", "volkerball wien", "dodgeball"

---

## 1. Immediate Blockers (Fix Today)

### 1.1 Fix Sitemap.xml Accessibility
**Impact:** Critical | **Effort:** Low | **Category:** Technical
- The sitemap.xml exists in the repo but returns 404 when accessed
- **Check:** Is Vercel serving `/sitemap.xml`? The robots.txt references `https://imperialsdodgeball.com/sitemap.xml` (non-www) — if the site forces www, this URL may not resolve
- **Fix:** Ensure sitemap.xml is served at the www domain. Update robots.txt to use `https://www.imperialsdodgeball.com/sitemap.xml`
- **Also:** Update `<lastmod>` dates to reflect recent changes

### 1.2 Remove FAQPage Schema
**Impact:** Critical | **Effort:** Low | **Category:** Schema
- FAQPage schema has been restricted to government/healthcare authority sites since August 2023
- Google will ignore it for commercial sites — it's dead weight and may signal outdated SEO practices
- **Fix:** Delete the entire FAQPage JSON-LD block from `index.html` (lines 527-551 area)
- The FAQ content itself is excellent — keep it on the page, just remove the schema markup

### 1.3 Fix Canonical URL Mismatch
**Impact:** Critical | **Effort:** Low | **Category:** Technical
- Canonical says `https://imperialsdodgeball.com/` but the site is served from `https://www.imperialsdodgeball.com`
- This sends mixed signals to Google about the preferred version
- **Fix:** Change canonical to `https://www.imperialsdodgeball.com/` in `index.html` line 12
- Also update `og:url` (line 16) and all schema `url` properties to use `www`

---

## 2. Quick Wins (This Week)

### 2.1 Add Meta Descriptions to Secondary Pages
**Impact:** High | **Effort:** Low | **Category:** On-Page
- `impressum.html` and `datenschutz.html` have no meta descriptions
- **Fix:** Add to each `<head>`:
  ```html
  <!-- impressum.html -->
  <meta name="description" content="Impressum der Vienna Imperials — Pflichtangaben, Vereinsdaten und Haftungsausschluss. Legal notice for Vienna's premier dodgeball club." />
  <link rel="canonical" href="https://www.imperialsdodgeball.com/impressum.html" />

  <!-- datenschutz.html -->
  <meta name="description" content="Datenschutzerklarung der Vienna Imperials — DSGVO-konforme Informationen zu Datenerhebung und Ihren Rechten. Privacy policy for Vienna Imperials." />
  <link rel="canonical" href="https://www.imperialsdodgeball.com/datenschutz.html" />
  ```

### 2.2 Integrate Target Keywords Into Key Positions
**Impact:** High | **Effort:** Low | **Category:** Content/On-Page
- "Dodgeball Wien" and "Volkerball Wien" are target keywords but barely appear on the page
- **Title tag:** Consider `Vienna Imperials — Dodgeball Wien | Austria's Premier Foam Dodgeball Club`
- **Meta description:** Add "Dodgeball Wien" naturally: `"Vienna Imperials – Dodgeball Wien. Wiens erstes Dodgeball-Team..."`
- **H1 or hero subtitle:** Include "Wien" near "Dodgeball" in visible text
- **Body content:** Add a sentence mentioning "Volkerball" (German term) — e.g., "Also known as Volkerball in German-speaking countries..."
- **FAQ:** Add a question "Was ist der Unterschied zwischen Dodgeball und Volkerball?" to target that keyword

### 2.3 Add Hreflang Tags
**Impact:** High | **Effort:** Low | **Category:** Technical/International
- The site has bilingual DE/EN content but no hreflang signals
- **Fix:** Add to `index.html` `<head>`:
  ```html
  <link rel="alternate" hreflang="de-AT" href="https://www.imperialsdodgeball.com/" />
  <link rel="alternate" hreflang="en" href="https://www.imperialsdodgeball.com/" />
  <link rel="alternate" hreflang="x-default" href="https://www.imperialsdodgeball.com/" />
  ```

### 2.4 Create llms.txt
**Impact:** Medium | **Effort:** Low | **Category:** AI Readiness
- **Fix:** Create `/llms.txt` in the project root:
  ```
  # Vienna Imperials
  > Austria's first and premier foam dodgeball club, based in Vienna.

  ## About
  The Vienna Imperials are Vienna's leading foam dodgeball club. We run weekly social leagues, competitive seasons, and tournaments.

  ## Key Pages
  - Homepage: https://www.imperialsdodgeball.com/
  - Legal Notice: https://www.imperialsdodgeball.com/impressum.html
  - Privacy Policy: https://www.imperialsdodgeball.com/datenschutz.html

  ## Contact
  - Email: imperialsdodgeball@gmail.com
  - Instagram: https://www.instagram.com/imperialsdodgeball/
  - Location: Vienna, Austria
  ```

### 2.5 Consolidate www/non-www Redirect
**Impact:** Medium | **Effort:** Low | **Category:** Technical
- `https://imperialsdodgeball.com` takes 2 hops (301 + 308) to reach `https://www.imperialsdodgeball.com/`
- **Fix:** Configure Vercel to do a single 301 from non-www to www (check Vercel dashboard redirect settings)

---

## 3. Strategic Improvements (This Month)

### 3.1 Enrich SportsClub Schema
**Impact:** High | **Effort:** Medium | **Category:** Schema
- Add missing properties to the SportsClub JSON-LD:
  ```json
  "telephone": "+43-XXX-XXXXXXX",
  "openingHoursSpecification": [
    {
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": "Thursday",
      "opens": "18:00",
      "closes": "21:00"
    }
  ],
  "geo": {
    "@type": "GeoCoordinates",
    "latitude": 48.XXXXX,
    "longitude": 16.XXXXX
  },
  "areaServed": {
    "@type": "City",
    "name": "Vienna"
  },
  "foundingDate": "2025",
  "memberOf": {
    "@type": "SportsOrganization",
    "name": "ASKO"
  }
  ```

### 3.2 Strengthen Internal Linking
**Impact:** High | **Effort:** Medium | **Category:** Internal Links
- Only 10 internal links across 4 pages; `/member` has only 1 incoming link
- **Fix:**
  - Add contextual links from FAQ answers to relevant sections (e.g., "Check the Rankings section" -> link to `#rankings`)
  - Add a "Member Area" link in the footer alongside Impressum/Datenschutz
  - Cross-link from impressum/datenschutz to each other and back to homepage sections

### 3.3 Manage AI Crawlers in robots.txt
**Impact:** Medium | **Effort:** Low | **Category:** AI Readiness
- 11 AI crawlers inherit wildcard rules without explicit management
- **Fix:** Add explicit rules:
  ```
  User-agent: GPTBot
  Allow: /

  User-agent: ClaudeBot
  Allow: /

  User-agent: PerplexityBot
  Allow: /

  User-agent: Google-Extended
  Allow: /

  User-agent: Applebot-Extended
  Allow: /
  ```

### 3.4 Optimize OG Share Image
**Impact:** Low | **Effort:** Medium | **Category:** Social/Images
- Current OG image is PNG format — potentially large file size
- **Fix:** Create a 1200x630 optimized share image (WebP or JPEG), add dimension meta tags:
  ```html
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  ```

### 3.5 Add "Volkerball" Content Section
**Impact:** High | **Effort:** Medium | **Category:** Content/Keywords
- The German-speaking audience searches for "Volkerball Wien" — this term doesn't appear on the site at all
- **Fix:** Add a paragraph in the About section or a FAQ entry explaining the relationship between dodgeball and Volkerball
- Example: "Dodgeball ist international als Volkerball bekannt — bei uns spielen wir die moderne Foam-Variante nach internationalen Regeln."

---

## 4. Maintenance / Backlog

### 4.1 Set Up Google Search Console
- Essential for monitoring indexing, crawl errors, and keyword performance
- Submit the fixed sitemap.xml once it's accessible

### 4.2 Measure Core Web Vitals
- PageSpeed Insights was rate-limited during this audit
- Run manually: check LCP < 2.5s, INP < 200ms, CLS < 0.1

### 4.3 Consider Adding a Google Business Profile
- For "dodgeball wien" local searches, a GBP listing would significantly boost visibility
- Include training location, hours, photos, and category

### 4.4 Add WebSite Schema with SearchAction
- Helps Google understand the site structure
- Only worthwhile if the site has internal search (not currently present)

### 4.5 Update Sitemap lastmod Dates
- Current dates are 2026-03-15 / 2026-03-21 — keep these current when content changes

---

## Priority Summary

| Priority | Items | Est. Score Impact |
|----------|-------|-------------------|
| Immediate (today) | 1.1, 1.2, 1.3 | +10-12 pts |
| Quick Wins (this week) | 2.1-2.5 | +8-12 pts |
| Strategic (this month) | 3.1-3.5 | +5-8 pts |
| Maintenance (ongoing) | 4.1-4.5 | +3-5 pts |

**Projected score after all fixes: 80-85/100 (Good)**
