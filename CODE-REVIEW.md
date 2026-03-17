# Full Codebase Review — Vienna Imperials Website

**Date:** 2026-03-17
**Reviewed by:** 5-agent review team (Architecture, Code Quality, Functionality, Performance, Security)

---

## 1. Architecture Review

**Overall Rating: 5/10** — Solid MVP foundation with technical debt brewing.

### Strengths
- Clear separation: `api/`, `lib/`, static files
- Auth endpoints grouped by type, admin endpoints isolated
- Shared utilities centralized in `lib/` (auth, cors, db, rate-limit, validation)

### Key Findings

**Monolithic client-side code** — `member.js` is 1000+ lines handling auth, view switching, dashboard rendering, leaderboard filtering, training RSVP, and UI state management. Needs splitting into modules (auth, dashboard, training, api-client, state).

**No data access layer** — Every API endpoint contains inline SQL. The same SELECT patterns are repeated across `login.js`, `stats.js`, `members.js`, etc. A user repository pattern would eliminate duplication and make schema changes manageable.

**Duplicated admin auth** — `requireAdmin()` is copy-pasted identically in `api/admin/members.js:5-23` and `api/admin/training.js:5-23` instead of being in `lib/auth.js`.

**Inconsistent API response formats** — Some endpoints return `{ error, code }`, others just `{ error }`. HTTP status codes vary for similar situations.

**Vercel function limit risk** — Each file under `api/` is a separate serverless function. At 12 functions (Hobby plan limit), growth will require consolidating endpoints with routing.

### Sustainability Assessment
Current architecture supports ~10-15 endpoints and <10k daily users. Will hit pain points at 3-6 months as `member.js` grows, auth duplication spreads, and inline SQL becomes unmaintainable.

---

## 2. Code Quality Review

### Critical Duplication

**`requireAdmin()` duplicated** across `api/admin/members.js` and `api/admin/training.js` — should be extracted to `lib/auth.js`.

**`DEFAULT_PLAYERS` array duplicated** in `api/rankings.js:5-16` and `api/member/stats.js:5-16` — should be in `lib/defaults.js`.

**Email regex duplicated** in `member.js:98`, `api/signup.js:5`, and `lib/validation.js:1`.

### Magic Numbers & Strings

Hardcoded values scattered everywhere without constants:
- Bcrypt salt rounds `12` (`register.js:39`)
- Rate limit window `15 * 60 * 1000` (`rate-limit.js:4`)
- Max attempts `5` (`rate-limit.js:5`)
- Training window `'28 days'` (`training.js:39`)
- Recurring session max `52` weeks (`admin/training.js:225`)
- Password min length `8` (`member.js:133`)
- Admin rate limit key `'_admin_login_'` (`admin-login.js:24`)

**Recommendation:** Create `lib/constants.js` with named exports for all these values.

### State Management

`member.js` uses bare global variables (`currentUser`, `rankingsData`, `lbFilter`, `lbSort`, `activeTab`, `trainingSessions`, `trainingLoaded`, `rsvpInFlight`) with no namespace protection and mixed concerns.

### Inconsistent Error Handling

No standardized error response utility. Each endpoint formats errors differently. Suggested fix: create `lib/errors.js` with `ApiError` class and `handleError` wrapper.

### Positive Observations
- Consistent use of async/await
- SQL injection protection via parameterized queries
- Clear logging prefixes (`AUTH:`, `TRAINING:`, `ADMIN:`)
- Good HTML escaping in leaderboard rendering

---

## 3. Functionality Review

### Critical

| # | Issue | File | Line |
|---|-------|------|------|
| 1 | **Unvalidated UUID in training RSVP** — session IDs not validated as UUIDs; any member can view attendee lists for ANY session by guessing IDs | `api/training.js` | 51-64 |
| 2 | **Static admin password with no rotation** — stored as env var bcrypt hash, no token revocation mechanism, no way to change without redeployment | `api/admin-login.js` | 16-21 |
| 3 | **Missing input validation on admin training create/update** — no length checks on title/description, no validation that start_time < end_time, no format validation on dates | `api/admin/training.js` | 154-170 |

### High

| # | Issue | File | Line |
|---|-------|------|------|
| 4 | `ranking_player_name` not sanitized on admin member approval — potential stored XSS | `api/admin/members.js` | 59-82 |
| 5 | Frontend `api()` helper doesn't catch network errors — unhandled promise rejections when offline | `member.js` | 16-35 |
| 6 | Session expired overlay not truly modal — users can tab out and interact with expired-session page | `member.js` | 732-738 |
| 7 | Account status leaks in error messages enable user enumeration (`PENDING_APPROVAL`, `REJECTED` codes) | `api/auth/login.js` | 43-55 |

### Medium

| # | Issue | File | Line |
|---|-------|------|------|
| 8 | `parseInt()` on nullable DB counts could produce `NaN` in API responses | `api/training.js` | 129-134 |
| 9 | No cleanup job for expired refresh tokens — table grows indefinitely | `api/auth/refresh.js` | 20-48 |
| 10 | Signup CSV written to ephemeral `/tmp` in Vercel — data lost on function restart | `api/signup.js` | 37-46 |
| 11 | No logging when `ranking_player_name` doesn't match any player — silent data mismatch | `api/member/stats.js` | 52-62 |

---

## 4. Performance Review

### High Impact

| # | Issue | Est. Impact |
|---|-------|------------|
| 1 | **N+1 subqueries in training sessions** — two separate COUNT subqueries per session row; 10 sessions = 20+ extra queries. Use `COUNT(*) FILTER` instead. | `api/training.js:34-35` |
| 2 | **Missing database indexes** — no indexes on `is_cancelled`, `users.status`, or composite `(session_id, status)` on attendance table | `api/data/schema.sql` |
| 3 | **Unoptimized images** — `askoelogogross.jpg` (114KB JPEG), PNGs not minified, no WebP/AVIF alternatives, 207KB design guidelines PNG in prod | Root directory |
| 4 | **Puppeteer in dependencies** — 162MB+ package appears unused, dramatically increases cold start time | `package.json` |

### Medium Impact

| # | Issue | Est. Impact |
|---|-------|------------|
| 5 | **Blanket `no-store` on all API routes** — prevents caching even for mostly-static data like rankings (changes weekly) | `vercel.json:39-44` |
| 6 | **Two separate unthrottled scroll listeners** on index.html — recalculate DOM measurements 120+ times/sec | `index.html:2481-2491` |
| 7 | **Large inline CSS** — 444 lines in member.html, 2419 lines in index.html; not cacheable | Both HTML files |
| 8 | **Font loading not optimized** — 3 font families loaded with no preload on critical fonts | `member.html:11-13` |
| 9 | **No asset versioning** — tailwind.min.css cached 1 year but filename has no hash; updates require cache busting | `vercel.json:7-10` |
| 10 | **Duplicate rankings fetch** — stats endpoint and rankings endpoint both query `SELECT data FROM rankings_data WHERE id = 1` | `api/member/stats.js` + `api/rankings.js` |

### Low Impact

| # | Issue |
|---|-------|
| 11 | Expensive `feTurbulence` SVG filter for noise overlay recalculated on every repaint |
| 12 | Leaderboard re-sorts full array on every filter/search interaction (O(n log n), but n=10) |
| 13 | Inline onclick handlers recreated per training session card instead of event delegation |

---

## 5. Security Review

### Critical

| # | Risk | Issue |
|---|------|-------|
| 1 | **Exposed secrets in version control** — `.env` and `.env.local` committed with `DATABASE_URL`, `JWT_SECRET`, and `ADMIN_PASSWORD_HASH` in plaintext. Anyone with repo access can forge tokens, access the database, and impersonate admin. |
| 2 | **Missing CSRF protection** — No CSRF tokens on any state-changing endpoint. `SameSite=Strict` partially mitigates but is not sufficient for defense-in-depth. |
| 3 | **XSS via inline event handlers** — Session IDs embedded in `onclick="handleRsvp('${s.id}', ...)"` without attribute-context escaping. If an ID contains a quote character, arbitrary JS executes. (`member.js:589-599`) |

### High

| # | Risk | Issue |
|---|------|-------|
| 4 | **CSP allows `unsafe-inline`** — Both `script-src` and `style-src` include `'unsafe-inline'`, defeating XSS protection. (`vercel.json:32-35`) |
| 5 | **Missing admin input validation** — Training session create/update accepts unsanitized title, description, location with no length limits or format validation. (`api/admin/training.js:155-162`) |
| 6 | **Overly permissive CORS** — `Access-Control-Allow-Credentials: true` set even when origin doesn't match whitelist. (`lib/cors.js`) |
| 7 | **Information leakage** — Login error messages reveal account existence and approval status, enabling user enumeration. (`api/auth/login.js:43-55`) |
| 8 | **No admin account lockout** — All admin login attempts share one rate limit counter with no escalating lockout. (`api/admin-login.js:23-29`) |

### Medium

| # | Risk | Issue |
|---|------|-------|
| 9 | Unused `puppeteer` dependency — massive attack surface for no benefit |
| 10 | No dependency security scanning in CI pipeline |
| 11 | HSTS correctly configured but should verify preload submission |

### Positive Security Findings
- Parameterized SQL queries throughout (no SQL injection)
- bcrypt with cost factor 12 for password hashing
- Rate limiting on auth endpoints
- HttpOnly + Secure + SameSite=Strict cookies
- Refresh token rotation on use
- HSTS with preload configured

---

## Unified Action Plan

### 1. Critical Fixes — Address Immediately

| # | What | Where | Why |
|---|------|-------|-----|
| 1 | **Rotate all secrets and purge from git** | `.env`, `.env.local` | Database credentials, JWT secret, and admin hash are committed in plaintext — anyone with repo access has full system control |
| 2 | **Remove XSS vector in RSVP buttons** | `member.js:589-599` | Inline `onclick` with interpolated IDs allows DOM-based XSS |
| 3 | **Add authorization to attendee list** | `api/training.js:51-75` | Any authenticated member can view attendee lists for any session by guessing UUID |
| 4 | **Validate admin training inputs** | `api/admin/training.js:154-197` | No length limits, format validation, or sanitization on session creation |

**Fix for #1:** Purge git history, rotate all credentials, move to Vercel env vars only:
```bash
git filter-branch --force --index-filter \
  'git rm --cached --ignore-unmatch .env .env.local' \
  --prune-empty --tag-name-filter cat -- --all
```

**Fix for #2:** Replace inline handlers with data attributes + event delegation:
```javascript
// BEFORE (vulnerable):
onclick="handleRsvp('${s.id}', 'attending')"

// AFTER (safe):
<button class="rsvp-btn" data-session-id="${s.id}" data-status="attending">

document.addEventListener('click', (e) => {
  if (e.target.classList.contains('rsvp-btn')) {
    handleRsvp(e.target.dataset.sessionId, e.target.dataset.status);
  }
});
```

### 2. High-Impact Improvements

| # | What | Where | Why |
|---|------|-------|-----|
| 5 | **Extract `requireAdmin()` to `lib/auth.js`** | `api/admin/members.js`, `api/admin/training.js` | Identical 19-line function duplicated; bug fixes need coordinating across files |
| 6 | **Add missing database indexes** | `api/data/schema.sql` | Queries on `is_cancelled`, `users.status`, and `(session_id, status)` are unindexed |
| 7 | **Fix N+1 attendance subqueries** | `api/training.js:34-35` | Two COUNT subqueries per session row; replace with `COUNT(*) FILTER` or single JOIN with GROUP BY |
| 8 | **Remove puppeteer dependency** | `package.json` | 162MB+ unused package inflates deploy size and cold start time |
| 9 | **Add CSRF tokens** | All POST/PATCH/DELETE endpoints | No CSRF protection beyond SameSite cookies |
| 10 | **Remove `unsafe-inline` from CSP** | `vercel.json`, `member.html`, `index.html` | CSP currently doesn't protect against XSS |
| 11 | **Unify error responses** | All API endpoints | Inconsistent formats make client error handling fragile |

**Fix for #11:**
```javascript
// lib/errors.js
class ApiError extends Error {
  constructor(statusCode, message, code = 'SERVER_ERROR') {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
  }
}

function handleError(err, res) {
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({ error: err.message, code: err.code });
  }
  console.error('Unhandled error:', err);
  return res.status(500).json({ error: 'Internal server error', code: 'SERVER_ERROR' });
}

module.exports = { ApiError, handleError };
```

### 3. Quick Wins

| # | What | Where | Why |
|---|------|-------|-----|
| 12 | **Create `lib/constants.js`** | New file, referenced everywhere | Eliminates magic numbers/strings across ~15 files |
| 13 | **Extract `DEFAULT_PLAYERS` to shared module** | `api/rankings.js`, `api/member/stats.js` | Same 10-player array duplicated in two files |
| 14 | **Optimize images to WebP** | Root directory | 300KB+ unnecessary weight; `askoelogogross.jpg` alone is 114KB |
| 15 | **Remove accidental files from repo** | `Screenshot 2026-03-13 171002.png`, `imperials-design-guidelines.png` | 274KB of non-production assets served to CDN |
| 16 | **Combine scroll listeners** | `index.html:2481-2491` | Two unthrottled listeners recalculating DOM 120+ times/sec |
| 17 | **Add network error handling to `api()` helper** | `member.js:16-35` | Unhandled promise rejections when offline |
| 18 | **Add `parseInt` fallbacks** | `api/training.js:129-134` | `parseInt(null)` returns `NaN` in API responses |
| 19 | **Fix login enumeration** | `api/auth/login.js:43-55` | Return generic error for all auth failures; don't reveal pending/rejected status |

### 4. Strategic Refactors

| # | What | Where | Why |
|---|------|-------|-----|
| 20 | **Modularize `member.js`** | `member.js` (1000+ lines) | Monolithic file handling auth, dashboard, training, leaderboard, and state — unmaintainable at current size |
| 21 | **Create data repository layer** | New `lib/repositories/` | Inline SQL duplicated across endpoints; schema changes require coordinating 10+ files |
| 22 | **Extract inline CSS to external stylesheets** | `member.html` (444 lines), `index.html` (2419 lines) | Not cacheable when inline; blocks rendering |
| 23 | **Add granular API cache headers** | `vercel.json` | Blanket `no-store` prevents caching even for weekly-updated rankings data |
| 24 | **Consolidate endpoints for Vercel function limit** | `api/` directory | Approaching 12-function Hobby plan limit; add lightweight routing per domain |
| 25 | **Move signup storage from `/tmp` to database** | `api/signup.js:37-46` | CSV written to ephemeral Vercel filesystem — data lost on restart |

### 5. Nice-to-Haves

| # | What | Where | Why |
|---|------|-------|-----|
| 26 | Preload critical fonts (Bebas Neue) | `member.html:11-13` | Reduces FOUT by 100-200ms |
| 27 | Replace SVG noise filter with static PNG | `member.html:44-52`, `index.html:91-99` | `feTurbulence` is GPU-expensive on budget devices |
| 28 | Add asset filename hashing for long-term caching | `vercel.json`, build config | Currently caching `tailwind.min.css` for 1 year without hash-based busting |
| 29 | Add expired refresh token cleanup job | `api/auth/refresh.js` | Table grows indefinitely; add periodic `DELETE WHERE expires_at < NOW()` |
| 30 | Implement event delegation for RSVP buttons | `member.js:588-598` | Currently recreating handlers per card; delegation is more efficient |
| 31 | Add automated dependency scanning to CI | `package.json` | No `npm audit` in build pipeline |
| 32 | Document coding standards | Project root | Mixed naming conventions across layers are intentional but undocumented |
