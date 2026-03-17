# Vienna Imperials — Web Platform: Review & Next Steps

**Date:** 2026-03-17
**Scope:** Member login optimization + Training calendar feature + Admin dashboard expansion

---

## Part 1: Current State Review

### Architecture Summary

| Layer | Technology | Notes |
|-------|-----------|-------|
| Frontend | Static HTML + Vanilla JS + Tailwind CSS | No framework, two main pages |
| Backend | Vercel Serverless Functions (Node.js) | **11 of 12 Hobby-plan functions used** |
| Database | Neon Serverless PostgreSQL | 4 tables: users, refresh_tokens, login_attempts, rankings_data |
| Auth | JWT (15min access) + Refresh tokens (7d) | HttpOnly cookies, bcrypt, rate limiting |
| Admin | Shared password → JWT | Hidden entry via `/#admin-access` |

### Vercel Function Budget (Critical Constraint)

```
USED (11/12):
  api/admin-login.js          api/auth/login.js
  api/admin/members.js        api/auth/logout.js
  api/auth/refresh.js         api/auth/register.js
  api/auth/verify.js          api/data/migrate.js
  api/member/stats.js         api/rankings.js
  api/signup.js

REMAINING: 1 slot
```

**Any new feature must consolidate endpoints.** The calendar/training system cannot add multiple new function files.

---

### Member Login Area — Current Issues & Optimizations

#### Issue 1: Verify + Refresh = Two Round Trips on Page Load
**Current flow:** `member.html` loads → calls `/api/auth/verify` → if 401, calls `/api/auth/refresh` → then calls `/api/member/stats`.
That's 2-3 sequential API calls before the user sees anything.

**Optimization:** Merge verify into stats. If `/api/member/stats` receives an expired access token but a valid refresh token, it should auto-refresh inline and return both the new token (via Set-Cookie) and the stats in one response. This eliminates the verify endpoint as a separate page-load call and **frees a function slot**.

#### Issue 2: member.html is a 1,149-Line Monolith
Login, register, pending, dashboard, leaderboard, session management, re-auth overlay — all in one file with inline `<script>` and `<style>` blocks.

**Optimization:** Extract JS into `member.js`. This makes the calendar feature addable without the file becoming unmanageable.

#### Issue 3: No "Forgot Password" Flow
Members who forget their password have no self-service recovery. Requires manual admin intervention.

**Status:** Lower priority than calendar. Flag for future.

#### Issue 4: Email Verification Not Implemented
The `is_email_verified` column exists but is never used. Anyone can register with any email.

**Status:** Lower priority. Flag for future.

#### Issue 5: Signup Endpoint Writes to /tmp
`/api/signup.js` saves to `/tmp/signups.csv` — ephemeral on Vercel, lost on cold starts.

**Optimization:** Move signup data to a database table.

---

## Part 2: Training Calendar Feature — Design

### Feature Overview

Members see upcoming training sessions and RSVP (attending / not attending). Admins see aggregated attendance in their dashboard, create sessions, and manage recurring schedules.

### Database Schema (New Tables)

```sql
-- Training sessions created by admin
CREATE TABLE IF NOT EXISTS training_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(200) NOT NULL,
    description TEXT,
    location VARCHAR(200),
    session_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    recurring_day INTEGER,                  -- 0=Sun..6=Sat (null if one-off)
    max_capacity INTEGER,                   -- optional cap
    is_cancelled BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Member attendance votes
CREATE TABLE IF NOT EXISTS training_attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES training_sessions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',  -- 'attending', 'not_attending', 'pending'
    responded_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(session_id, user_id)
);

CREATE INDEX idx_sessions_date ON training_sessions(session_date);
CREATE INDEX idx_attendance_session ON training_attendance(session_id);
CREATE INDEX idx_attendance_user ON training_attendance(user_id);
```

### API Design (Function-Budget Aware)

**Strategy:** Deprecate `api/auth/verify.js` (merge into stats) → frees 1 slot → use 2 slots total:

```
api/training.js        →  Member RSVP + read operations
api/admin/training.js  →  Admin CRUD + attendance reports
```

#### Member Endpoint: `api/training.js`

| Method | Query/Body | Purpose |
|--------|-----------|---------|
| `GET` | `?view=upcoming` | Upcoming sessions (next 4 weeks) with user's RSVP status |
| `GET` | `?view=session&id=<uuid>` | Single session + attendee list |
| `POST` | `{ action: 'rsvp', session_id, status }` | Set attendance: `attending` or `not_attending` |

#### Admin Endpoint: `api/admin/training.js`

| Method | Query/Body | Purpose |
|--------|-----------|---------|
| `GET` | `?view=overview&range=week\|month` | All sessions with attendance counts |
| `GET` | `?view=detail&id=<uuid>` | Session detail: who's attending/not/no-response |
| `GET` | `?view=matrix` | Attendance matrix (members × sessions) |
| `POST` | `{ action: 'create', title, date, ... }` | Create session |
| `POST` | `{ action: 'update', id, ... }` | Edit session |
| `POST` | `{ action: 'cancel', id }` | Cancel session |
| `POST` | `{ action: 'generate', recurring_day, weeks, ... }` | Auto-generate recurring sessions |
| `DELETE` | `?id=<uuid>` | Delete session |

### Member UI — Calendar View

New tab in member dashboard alongside Stats and Rankings:

```
┌─────────────────────────────────────────────────┐
│  [My Stats]   [Rankings]   [Training Calendar]  │
├─────────────────────────────────────────────────┤
│                                                  │
│  ── Upcoming Sessions ──────────────────────     │
│                                                  │
│  📅 Thu 19 Mar — Thursday Training               │
│     19:00–21:00 · Sporthalle Leopoldstadt       │
│     8 attending · 3 not attending               │
│     [ ✓ Attending ] [ ✗ Not Attending ]         │
│                                                  │
│  📅 Thu 26 Mar — Thursday Training               │
│     19:00–21:00 · Sporthalle Leopoldstadt       │
│     5 attending · 1 not attending               │
│     [ ✓ Attending ] [ ✗ Not Attending ]         │
│                                                  │
│  📅 Sat 29 Mar — Match Day Practice             │
│     CANCELLED                                    │
│                                                  │
└─────────────────────────────────────────────────┘
```

**UX rules:**
- Default: list upcoming sessions (next 4 weeks)
- Two RSVP buttons per session: Attending (green) / Not Attending (red)
- Current selection highlighted, unselected = pending
- Show attendance count per session
- Cancelled sessions grayed out, no RSVP buttons
- Past sessions read-only (no RSVP changes after session date)
- Members can see who else is attending (display names only)

### Admin UI — Training Dashboard

New tab in admin section of `index.html`:

```
┌─────────────────────────────────────────────────┐
│  [Rankings] [Member Approvals] [Training]       │
├─────────────────────────────────────────────────┤
│                                                  │
│  [ + Create Session ]  [ Generate Recurring ]   │
│                                                  │
│  ┌───────────────────────────────────────────┐  │
│  │ Thu 19 Mar — Thursday Training            │  │
│  │ 19:00–21:00 · Sporthalle Leopoldstadt     │  │
│  │                                           │  │
│  │ ✅ Attending (8)  ❌ Not (3)  ⏳ None (4) │  │
│  │                                           │  │
│  │ Attending: Anna, Max, Julia, ...          │  │
│  │ Not Attending: Tom, Sara, Lukas           │  │
│  │ No Response: Chris, Petra, Alex, Nina     │  │
│  │                                           │  │
│  │ [Edit] [Cancel] [Delete]                  │  │
│  └───────────────────────────────────────────┘  │
│                                                  │
│  ── Attendance Matrix ───────────────────────── │
│                                                  │
│  Member        │ 19 Mar │ 26 Mar │ 2 Apr │      │
│  ──────────────┼────────┼────────┼───────┤      │
│  Anna Müller   │   ✅   │   ✅   │  ⏳   │      │
│  Max Schmidt   │   ✅   │   ❌   │  ⏳   │      │
│  Tom Weber     │   ❌   │   ✅   │  ✅   │      │
│                                                  │
│  Overall Attendance Rate: 73%                   │
│                                                  │
└─────────────────────────────────────────────────┘
```

**Admin capabilities:**
- Create individual sessions (title, date, time, location, capacity)
- Generate recurring sessions ("every Thursday for 8 weeks")
- Cancel sessions (preserves history, members see CANCELLED)
- Per-session breakdown: attending / not attending / no response with names
- Cross-session attendance matrix
- Attendance rate statistics

---

## Part 3: Implementation Plan

### Phase 1 — Optimize Existing (Pre-requisites)

| # | Task | Files | Priority |
|---|------|-------|----------|
| 1.1 | **Merge verify into stats** — `/api/member/stats.js` accepts refresh token, auto-refreshes if access token expired. Deprecate `/api/auth/verify.js` to free a function slot. | `api/member/stats.js`, `api/auth/verify.js` | HIGH |
| 1.2 | **Extract member.html JS** into `member.js` — Move all `<script>` content. Update CSP in `vercel.json`. | `member.html`, `member.js`, `vercel.json` | HIGH |
| 1.3 | **Add tab navigation to member dashboard** — Stats / Rankings / Calendar tabs. Rankings table moves to its own tab. | `member.html`, `member.js` | HIGH |

### Phase 2 — Database & API

| # | Task | Files | Priority |
|---|------|-------|----------|
| 2.1 | **Add training tables to schema** — `training_sessions` + `training_attendance` with indexes. | `api/data/schema.sql` | HIGH |
| 2.2 | **Run migration** via `/api/data/migrate`. | `api/data/migrate.js` | HIGH |
| 2.3 | **Build `api/training.js`** — Member-facing: upcoming sessions, RSVP. | `api/training.js` (new) | HIGH |
| 2.4 | **Build `api/admin/training.js`** — Admin CRUD, attendance reports, recurring generation. | `api/admin/training.js` (new) | HIGH |

### Phase 3 — Member Calendar UI

| # | Task | Files | Priority |
|---|------|-------|----------|
| 3.1 | **Calendar tab** — Upcoming sessions list with RSVP buttons. | `member.js` | HIGH |
| 3.2 | **RSVP interaction** — Attend/not-attend → POST, optimistic UI. | `member.js` | HIGH |
| 3.3 | **Attendee list** — Expandable per-session showing who's coming. | `member.js` | MEDIUM |
| 3.4 | **"You haven't responded" banner** — Nudge for sessions without RSVP. | `member.js` | MEDIUM |

### Phase 4 — Admin Training Dashboard

| # | Task | Files | Priority |
|---|------|-------|----------|
| 4.1 | **Training tab in admin** section of `index.html`. | `index.html` | HIGH |
| 4.2 | **Session creation modal** — Title, date, time, location, capacity. | `index.html` | HIGH |
| 4.3 | **Recurring session generator** — "Generate weekly for X weeks" button. | `index.html` | MEDIUM |
| 4.4 | **Per-session attendance cards** — Attending/not/no-response with names. | `index.html` | HIGH |
| 4.5 | **Attendance matrix view** — Members × sessions table. | `index.html` | MEDIUM |
| 4.6 | **Cancel / Edit / Delete** controls per session. | `index.html` | MEDIUM |
| 4.7 | **Attendance stats** — Overall rate %, per-member rate. | `index.html` | LOW |

### Phase 5 — Polish

| # | Task | Priority |
|---|------|----------|
| 5.1 | Timezone handling (Europe/Vienna) | HIGH |
| 5.2 | Empty states ("No upcoming sessions", "Create your first session") | MEDIUM |
| 5.3 | Mobile-responsive calendar and attendance views | HIGH |
| 5.4 | Past sessions become read-only | HIGH |
| 5.5 | Rate-limit RSVP toggling | LOW |

---

## Part 4: Decisions Needed Before Building

### Decision 1: Free Up a Function Slot?
- **Option A:** 1 consolidated `api/training.js` for everything (member + admin)
- **Option B:** Deprecate `api/auth/verify.js` (merge into stats), get 2 slots for separate member + admin endpoints
- **Recommended:** Option B — cleaner separation, verify is redundant if stats handles inline refresh

### Decision 2: Recurring Sessions — Template or Pre-Generated?
- **Option A:** Store a template, generate sessions on-the-fly per query
- **Option B:** Admin clicks "Generate" → concrete rows for next X weeks
- **Recommended:** Option B — simpler, each session editable/cancellable independently

### Decision 3: Can Members See Who's Attending?
- **Option A:** Members see only counts ("8 attending, 3 not attending")
- **Option B:** Members see display names of attendees
- **Recommended:** Option B — sports club, knowing who's coming is useful

### Decision 4: RSVP Default
- **Option A:** Default "pending" (no response) — explicit opt-in
- **Option B:** Default "attending" — opt-out model
- **Recommended:** Option A — explicit opt-in gives accurate counts

### Decision 5: Historical Data
- **Option A:** Delete past sessions after X days
- **Option B:** Keep all, use for attendance stats
- **Recommended:** Option B — historical data powers the admin attendance matrix

---

## Part 5: Build Order

```
Phase 1: Optimize
  1.1  Merge verify → stats (free function slot)
  1.2  Extract member.js
  1.3  Add tab navigation shell

Phase 2: Backend
  2.1  Schema: training tables
  2.2  Run migration
  2.3  api/training.js (member)
  2.4  api/admin/training.js (admin)

Phase 3: Member UI
  3.1  Calendar tab + session list
  3.2  RSVP buttons
  3.3  Attendee list
  3.4  Response nudge banner

Phase 4: Admin UI
  4.1  Training tab
  4.2  Session creation
  4.3  Recurring generator
  4.4  Attendance cards
  4.5  Attendance matrix
  4.6  Cancel/Edit/Delete
  4.7  Stats

Phase 5: Polish
  5.1–5.5
```

Each phase is independently deployable. Phase 1 should be completed before Phase 2 starts (frees the function slot). Phases 3 and 4 can be built in parallel once Phase 2 is done.
