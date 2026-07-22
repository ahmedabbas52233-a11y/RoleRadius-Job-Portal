# Changelog

All notable changes to RoleRadius are documented here.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).
Versioning follows [Semantic Versioning](https://semver.org/).

---

## [1.4.0] — Security, pipeline & matching overhaul

### Security

- **`PublicCandidateProfileView` was IsAuthenticated, not IsRecruiter** — any
  logged-in candidate could fetch any other candidate's full profile (email,
  phone, desired salary, education, experience) by ID. Now recruiter-only,
  and further scoped so a recruiter can only view a candidate who is either
  `open_to_work` or has actually applied to one of that recruiter's jobs.
- **Unvalidated `int()`/`float()` on query params in `matching/views.py`**
  (`?top=`, `?min_score=`) threw an unhandled `ValueError` → 500 on bad
  input. Now parsed defensively and clamped to a sane range.
- A real `.env` with live-looking Cloudinary credentials, a 24-char
  `SECRET_KEY`, and a weak DB password was present in the project export
  (never git-tracked, but exposed via the export itself). Regenerated with a
  fresh 67-char `SECRET_KEY` and blanked Cloudinary fields — **rotate your
  Cloudinary API secret**, it should be treated as compromised.

### Added

- **Hybrid match scoring** (`matching/engine.py`) — TF-IDF text similarity is
  now combined with structured signals the old version computed but never
  used: explicit skills overlap, location/work-mode compatibility,
  experience-level fit, and salary range overlap. Every match now returns
  *why* it scored the way it did (`matched_skills`, `missing_skills`,
  `location_compatible`, `experience_fit`, `salary_compatible`) instead of a
  bare percentage — surfaced in the AI Matches tab, the recruiter's matched
  candidates view, and on every application via a new `match_breakdown` field.
- **Hired / Offer Declined pipeline stages** — `Application` previously had
  no way to record an actual hire or a declined offer; withdrawing an
  `offered` application now correctly records `offer_declined` instead of a
  generic `withdrawn`. Status changes are now validated against an explicit
  transition map (e.g. you can't mark someone "Hired" who was never "Offered").
- **Recruiters can now actually review a candidate** — the applicant list
  previously showed only a headline and 4 skill tags with no way to open a
  CV. Added a CV download link, a full read-only candidate profile page,
  private recruiter notes, a rejection-reason prompt, an interview-date
  picker, and a visible status-change history timeline.
- **Bulk application actions** — `PATCH /api/applications/bulk-update/` plus
  a multi-select UI on the recruiter dashboard.
- **Talent search / sourcing** — `GET /api/auth/candidates/search/` plus a
  "Find Talent" page, so recruiters can browse open-to-work candidates
  directly instead of only ever seeing inbound applicants.
- **Self-service account deletion** (`POST /api/auth/me/delete/`) with
  password confirmation — a GDPR-style "right to erasure" control that
  didn't exist before.
- Missing `.eslintrc.cjs` — `npm run lint` referenced a config that never
  existed and silently couldn't run.

### Fixed

- `batch_score_applications()` existed in `matching/engine.py` but was never
  called from anywhere — `Application.match_score` went stale the moment a
  recruiter edited a job. `JobUpdateView` now calls it after every save.
- `Application.Meta.indexes` declared three composite indexes
  (`app_candidate_status_idx`, `app_job_status_idx`, `app_job_score_idx`)
  that had never actually been migrated — they existed in the model but not
  in the database. New migration closes the gap.
- A handful of pre-existing ESLint errors (unescaped apostrophes, an empty
  `catch {}` block) that `npm run lint` would have caught once it could run.

---

## [1.3.0] — Performance & completeness pass

### Added

- **Cached ML matching corpus** — `matching/engine.py` no longer re-fits a TF-IDF
  vectorizer on every single request. The job corpus and candidate corpus are
  each fitted once and cached (Django cache framework; LocMemCache by default,
  auto-upgrades to Redis if `REDIS_URL` is set), with signal-driven invalidation
  on any `Job` or `CandidateProfile` change. Dashboard "AI Matches" loads now
  transform a single query against a pre-fitted matrix instead of rebuilding
  the whole vectorizer from scratch per request.
- **`EditJob.jsx` fully implemented** — was a stub. Now fetches the job, prefills
  every field including skills, and PATCHes changes through `jobsAPI.update()`.
- **In-flight GET request dedup** in `frontend/src/services/api.js` — concurrent
  identical GET calls collapse into a single network round-trip. No response
  caching involved, so nothing can ever be served stale.
- **Vite vendor chunk splitting** — React/Router, UI libs, and framer-motion
  build into separate cacheable chunks so a feature deploy doesn't force
  visitors to re-download the entire vendor bundle.
- `django-redis` added as an optional dependency — activates automatically only
  if `REDIS_URL` is present in the environment.

### Changed

- `RecruiterDashboardStatsView` / `CandidateDashboardStatsView` — replaced
  7 separate per-status `.count()` queries with a single aggregate
  `.values('status').annotate(count=Count('id'))` query.
- `Application` model — added composite indexes matching actual query
  patterns: `(candidate, status)`, `(job, status)`, `(job, -match_score)`.
  **Requires running `python manage.py makemigrations applications` before
  deploying this version.**
- `JobCard.jsx` wrapped in `React.memo` — skips re-render when the `job` prop
  reference is unchanged (e.g. toggling unrelated UI state no longer
  re-renders every card on the page).
- Company logo `<img>` tags now use `loading="lazy" decoding="async"`.
- `nginx.conf` — added `gzip_vary`, `gzip_proxied`, explicit `gzip_comp_level 6`,
  and a hard `no-cache` rule on `index.html` so deploys can never strand a
  returning visitor on a stale app shell.

---

## [1.0.0] — 2026-06-07

### Added — Backend

- Custom `User` model with UUID primary keys and `role` field (candidate/recruiter)
- `CandidateProfile` model: skills (JSON), CV file, CV extracted text, work preferences
- `RecruiterProfile` model: company info, industry, size, logo
- `Job` model: full metadata (type, work mode, experience level, salary, skills JSON), soft delete via `deleted_at`, 6 composite DB indexes
- `Application` model: 7-stage status pipeline with `match_score` float field
- `ApplicationStatusHistory` model: immutable audit log of every status change
- `PasswordResetToken` model: single-use UUID tokens with 2-hour expiry
- JWT authentication via `djangorestframework-simplejwt` 5.4.0 (Python 3.12 compatible)
- httpOnly cookie authentication via custom `CookieJWTAuthentication` backend
- Account lockout via `django-axes` (5 failures → 30-minute lockout)
- Rate limiting: 5 login/min, 3 password-reset/min, 10 register/hour
- Email verification: signed tokens via `django.core.signing` (24-hour expiry)
- CV upload with text extraction: PDF (`pdfminer.six`), DOCX (`python-docx`), TXT
- File storage: Cloudinary in production, automatic `FileSystemStorage` fallback in dev
- TF-IDF cosine similarity matching engine (`matching/engine.py`)
- Job alerts: Django signal emails open-to-work candidates when a matching job is posted
- Status notifications: Django signal emails candidates on every recruiter status update
- Shared `accounts/permissions.py` (eliminates `IsCandidate`/`IsRecruiter` duplication)
- `accounts/utils.py`: CV extraction, email helpers, cookie helpers
- API documentation auto-generated by `drf-spectacular` at `/api/schema/swagger-ui/`
- Health check endpoint at `/api/health/`
- Custom `StandardPagination` with client-controlled `page_size` (max 100)
- `apps.py` for all four Django apps with `ready()` signal wiring
- 61 automated tests across `accounts`, `jobs`, `applications`, `matching`
- `seed_jobs` management command: 95 jobs across 8 companies and 5 job types
- `FIX_ENVIRONMENT.md`: troubleshooting guide for Python 3.12 / pkg_resources error
- `PYTHONUTF8=1` in `manage.py` to prevent Unicode errors on Windows

### Added — Frontend

- React 18 SPA with Vite 5 build tooling
- All 14 pages: Home, Jobs, JobDetail, Login, Register, ForgotPassword, ResetPassword, VerifyEmail, CandidateDashboard, RecruiterDashboard, PostJob, EditJob, Profile, NotFound
- `AuthContext` with `useRef` StrictMode guard (prevents duplicate `me()` calls)
- `api.js` with cookie-based auth — zero `localStorage` usage
- Auto-refresh interceptor that skips auth endpoints to prevent infinite 401 loops
- `ErrorBoundary` component: catches render errors, shows friendly fallback
- Route-level code splitting via `React.lazy()` and `Suspense`
- `EmailVerificationBanner`: dismissible amber banner for unverified users
- `ConfirmDialog`: reusable confirmation modal for destructive actions
- Delete job with confirmation dialog in `RecruiterDashboard`
- Skip-navigation link for keyboard and screen reader users
- Debounced search with URL-synced filters in Jobs page

### Added — Infrastructure

- `docker-compose.yml`: three-service stack (PostgreSQL, Django, React) with healthchecks
- `backend/Dockerfile` and `frontend/Dockerfile`
- `.github/workflows/ci.yml`: GitHub Actions CI running 61 tests + React build on push
- `LOGGING` config: console handler + file handler at `logs/roleradius.log`
- Production security headers (HSTS, SSL redirect, X-Frame-Options) via `if not DEBUG`
- `.gitignore`, `CITATION.cff`, `LICENSE` (MIT), `CONTRIBUTING.md`, `SECURITY.md`
- `docs/zenodo-paper.html`: academic software paper with figures, charts, tables
- `docs/ZENODO_GUIDE.md`: step-by-step Zenodo publication guide

### Fixed

- `pkg_resources` crash on Python 3.12: upgraded `djangorestframework-simplejwt` 5.3.0 → 5.4.0 and added `setuptools` to requirements
- `AxesBackendRequestParameterRequired`: `LoginSerializer.validate()` now passes `request` to `authenticate()`
- `UnicodeEncodeError` on Windows: replaced `→` with `->` in signal log messages; added `PYTHONUTF8=1`
- CV upload `Empty file` error: local `FileSystemStorage` fallback when Cloudinary not configured
- Infinite 401 loop: refresh interceptor no longer calls `window.location.href`; auth endpoints excluded from retry logic
- React StrictMode double `me()` calls: `useRef` guard in `AuthContext`
- URL ordering bug: `my/stats/` moved above `my/<uuid:pk>/` in `applications/urls.py`
- Token blacklist crash on logout: added `rest_framework_simplejwt.token_blacklist` to `INSTALLED_APPS`
- Build failure: removed `@heroicons/react` import from `Navbar.jsx` (package not installed)

---

## [Unreleased]

Planned improvements for future versions:

- Celery + Redis for async ML matching (removes blocking from request thread)
- Pre-computed match score cache table (removes O(N) memory load)
- Content Security Policy headers via `django-csp`
- End-to-end tests with Playwright
- Full WCAG 2.1 AA audit and remediation
- "Similar jobs" section on job detail page
- CSV export for recruiter applicant lists
- Analytics dashboard with recharts for recruiters
