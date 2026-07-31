<div align="center">

# 🎯 RoleRadius

**An AI-powered job portal that matches candidates to vacancies using hybrid TF-IDF cosine similarity plus structured compatibility signals — built as a final-year Computer Science dissertation project.**

[![CI](https://github.com/ahmedabbas52233-a11y/RoleRadius-Job-Portal/actions/workflows/ci.yml/badge.svg)](https://github.com/ahmedabbas52233-a11y/RoleRadius-Job-Portal/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Python 3.12](https://img.shields.io/badge/python-3.12-blue.svg)](backend/requirements.txt)
[![Django 4.2](https://img.shields.io/badge/django-4.2-darkgreen.svg)](backend/requirements.txt)
[![React 18](https://img.shields.io/badge/react-18-61DAFB.svg)](frontend/package.json)

[Features](#-features) · [Matching Engine](#-how-the-matching-engine-works) · [Setup](#-getting-started) · [API Docs](#-api-documentation) · [Testing](#-running-tests)

</div>

---

## 📖 About

RoleRadius is a full-stack recruitment platform with two sides: a **candidate
experience** (browse jobs, apply, track applications, get AI-ranked job
matches) and a **recruiter experience** (post jobs, manage an applicant
pipeline through structured interview rounds, source candidates directly,
and collaborate as a team). The core of the project — and its academic
contribution — is the matching engine, which combines classic
information-retrieval techniques with structured candidate/job compatibility
signals to produce ranked, *explainable* matches rather than an opaque score.

It's built with production-shaped concerns in mind, not just a tutorial demo:
JWT authentication via httpOnly cookies, role-based authorization scoped to
recruiting teams, rate limiting and account lockout, a CI pipeline that runs
the full test suite and a security scan on every push, and a documented,
signal-driven caching layer for the matching corpus.

## 📸 Screenshots

<<<<<<< Updated upstream
| | |
|---|---|
| **Home** | **Job Listings** |
| ![Home page](docs/screenshots/Home-Page.png) | ![Job Listings](docs/screenshots/Jobs-Listings.png) |
| **Job Detail** | **AI-Matched Jobs** |
| ![Job Details](docs/screenshots/Job-Details.png) | ![AI Matches](docs/screenshots/AI-Matched-Jobs.png) |
| **Candidate Dashboard** | **Recruiter Dashboard** |
| ![Candidates Dashboard](docs/screenshots/Dashboard-1.png) | ![Recruiter Dashboard](docs/screenshots/Recruiter-Dashboard.png) |
| **Interview Rounds** | **Talent Search** |
| `[ 📸 screenshot placeholder — docs/screenshots/interview-rounds.png ]` | ![Talent Search](docs/screenshots/Talent-search.png) |
| **Team / Company Settings** | **Profile / CV** |
| `[ 📸 screenshot placeholder — docs/screenshots/team-settings.png ]` | `[ 📸 screenshot placeholder — docs/screenshots/profile-cv.png ]` |

## ✨ Features

**For candidates**
- Browse and filter jobs by location, salary, work mode, experience level, and job type
- AI-ranked **"Matches for you"** with a transparent breakdown — which required skills matched (including common synonyms like JS/JavaScript or k8s/Kubernetes), which are missing, and whether location, experience level, job type, and salary actually line up
- Apply with a cover letter and CV upload (PDF/DOCX text extraction feeds directly into matching)
- Track every application through a full pipeline — *Pending → Reviewing → Shortlisted → Interview → Offered → Hired* (or Rejected / Offer Declined / Withdrawn) — with a visible status-change history timeline
- See your own structured interview schedule (round type, date, outcome) as a recruiter adds rounds
- Save jobs, manage your profile including job-type preferences, and delete your account and all associated data on request

**For recruiters**
- Post, edit, pause, and delete job listings
- Review applicants with full profile access, CV download, private notes, and a structured rejection-reason flow
- Run applicants through **multi-round structured interviews** — add rounds (screen/technical/onsite/final), assign an interviewer, record a private 1–5 scorecard and feedback, and set a pass/fail outcome per round
- Move applicants through the pipeline individually or in bulk, with every transition validated against a real state machine (no marking someone "Hired" who was never "Offered")
- **Source candidates directly** — paginated search across every candidate who's opted in to being discovered, not just inbound applicants
- **Work as a team** — create or join a company via a shareable join code; every recruiter on the same team can view, edit, and manage each other's job postings and applicants, with clear attribution of who originally posted each job
- Dashboard stats: active jobs, total applications, pipeline breakdown — automatically covering the whole team's jobs once you're on one

**Platform**
- Role-based access control (candidate / recruiter), enforced server-side on every endpoint — never just a client-side route guard
- Team-based job access via a single reusable `Job.objects.manageable_by(user)` query, so permission logic can't drift out of sync between endpoints
- JWT auth delivered via httpOnly, `SameSite=Lax` cookies (not readable by JS, mitigating XSS token theft)
- Rate limiting and brute-force lockout (`django-axes`) on auth endpoints
- Cached matching corpus with signal-driven invalidation (no stale scores after a profile or job edit)
- 160+ automated backend tests + ESLint-clean, production-building frontend, enforced in CI

## 🧠 How the Matching Engine Works

Most "AI matching" job boards stop at keyword overlap. RoleRadius's engine
(`backend/matching/engine.py`) combines two layers:

1. **Text similarity** — a TF-IDF vectorizer fit over job descriptions and
   candidate profiles/CVs, scored by cosine similarity. This is the
   classic information-retrieval half: it rewards distinctive shared
   vocabulary ("Kubernetes", "PostgreSQL") and downweights common words.
2. **Structured compatibility signals** — computed directly from fields a
   pure-text approach ignores entirely:
   - Skills overlap, with a curated synonym map so "JS" matches "JavaScript",
     "k8s" matches "Kubernetes", "AWS" matches "Amazon Web Services", etc.
     (not exhaustive, not ML-based — a maintained list of common real-world
     aliases; see `SKILL_SYNONYMS` in `matching/engine.py`)
   - Location / work-mode compatibility (remote jobs are always compatible)
   - Experience-level fit (years-of-experience banded against the job's stated level)
   - Job-type compatibility (full-time/part-time/contract/freelance/internship)
   - Salary range overlap

The layers combine into a single 0–100 score:

| Component | Weight |
|---|---|
| Text similarity | 40% |
| Skills overlap | 25% |
| Location compatibility | 15% |
| Experience-level fit | 10% |
| Job-type compatibility | 5% |
| Salary overlap | 5% |

Every match returns *why* it scored the way it did (`matched_skills`,
`missing_skills`, `location_compatible`, `experience_fit`,
`job_type_compatible`, `salary_compatible`) — surfaced directly in the UI —
rather than a bare, unexplained percentage. The TF-IDF corpus is cached and
invalidated via Django signals whenever a job or profile changes, so the
expensive vectorizer fit isn't repeated on every request while still never
serving a stale corpus.

## 👥 Team-Based Recruiting

Recruiters aren't limited to working solo. Any recruiter can create a
Company (getting a shareable join code back) or join one a teammate already
created. Once on the same team:

- Every job posted by any teammate becomes visible and manageable to the
  whole team — view applicants, move them through the pipeline, add
  interview rounds, edit or pause the listing
- The job list and dashboard stats automatically expand to cover the whole
  team's jobs, not just your own
- Each job clearly shows who actually posted it, so shared visibility never
  means losing track of ownership
- Leaving a team is a single action and immediately reverts you to
  solo-recruiter visibility — nothing is deleted, and you can rejoin later
  with the same code

This is implemented as a single reusable access rule
(`Job.objects.manageable_by(user)`) rather than duplicated permission checks
scattered across endpoints, specifically to prevent team-access logic from
drifting out of sync between different parts of the API over time.

## 🛠️ Tech Stack

| | |
|---|---|
| **Backend** | Django 4.2 · Django REST Framework · `djangorestframework-simplejwt` · PostgreSQL · scikit-learn (TF-IDF) · `django-axes` · `django-csp` · Gunicorn · WhiteNoise |
| **Frontend** | React 18 · Vite · React Router · Tailwind CSS · Axios · `react-hot-toast` · `lucide-react` |
| **Infra** | Docker / Docker Compose · GitHub Actions CI · Railway-ready (`railway.json`) · Cloudinary (optional media storage) · Redis (optional cache backend) |
| **Testing** | Django `TestCase` + DRF `APIClient` (160+ tests across accounts, jobs, applications, matching) · ESLint |

## 🏗️ Architecture

```
┌──────────────┐   HTTPS / JSON over   ┌────────────────────┐   Django ORM   ┌────────────┐
│  React (Vite)│ ────────────────────▶ │  Django REST API   │ ─────────────▶ │ PostgreSQL │
│     SPA      │ ◀──────────────────── │     (Gunicorn)      │ ◀───────────── │            │
└──────────────┘  JWT in httpOnly      └────────────────────┘                └────────────┘
                      cookies                    │
                                                  ▼
                                          ┌────────────────┐
                                          │  Django cache  │  (LocMemCache, or
                                          │ (TF-IDF corpus)│   Redis if configured)
                                          └────────────────┘
```

The backend is split into four focused Django apps:

| App | Responsibility |
|---|---|
| `accounts` | Users, candidate/recruiter profiles, auth, teams/companies, talent search |
| `jobs` | Job postings, filtering, saved jobs, team-based access rules |
| `applications` | The application pipeline, status transitions, interview rounds, bulk actions |
| `matching` | The scoring engine — no models of its own, just logic other apps call into |

## 🚀 Getting Started

=======
> **Note:** Replace the placeholders below with real screenshots once
> captured — drop image files into `docs/screenshots/` using the same
> filenames referenced here, or update the paths to match whatever you save.

| | |
|---|---|
| **Home** | **Job Listings** |
| `[ 📸 screenshot placeholder — docs/screenshots/home.png ]` | `[ 📸 screenshot placeholder — docs/screenshots/job-listings.png ]` |
| **Job Detail** | **AI-Matched Jobs** |
| `[ 📸 screenshot placeholder — docs/screenshots/job-detail.png ]` | `[ 📸 screenshot placeholder — docs/screenshots/ai-matches.png ]` |
| **Candidate Dashboard** | **Recruiter Dashboard** |
| `[ 📸 screenshot placeholder — docs/screenshots/candidate-dashboard.png ]` | `[ 📸 screenshot placeholder — docs/screenshots/recruiter-dashboard.png ]` |
| **Interview Rounds** | **Talent Search** |
| `[ 📸 screenshot placeholder — docs/screenshots/interview-rounds.png ]` | `[ 📸 screenshot placeholder — docs/screenshots/talent-search.png ]` |
| **Team / Company Settings** | **Profile / CV** |
| `[ 📸 screenshot placeholder — docs/screenshots/team-settings.png ]` | `[ 📸 screenshot placeholder — docs/screenshots/profile-cv.png ]` |

Once you have real images, swap a placeholder cell for:
```markdown
![Home page](docs/screenshots/home.png)
```

## ✨ Features

**For candidates**
- Browse and filter jobs by location, salary, work mode, experience level, and job type
- AI-ranked **"Matches for you"** with a transparent breakdown — which required skills matched (including common synonyms like JS/JavaScript or k8s/Kubernetes), which are missing, and whether location, experience level, job type, and salary actually line up
- Apply with a cover letter and CV upload (PDF/DOCX text extraction feeds directly into matching)
- Track every application through a full pipeline — *Pending → Reviewing → Shortlisted → Interview → Offered → Hired* (or Rejected / Offer Declined / Withdrawn) — with a visible status-change history timeline
- See your own structured interview schedule (round type, date, outcome) as a recruiter adds rounds
- Save jobs, manage your profile including job-type preferences, and delete your account and all associated data on request

**For recruiters**
- Post, edit, pause, and delete job listings
- Review applicants with full profile access, CV download, private notes, and a structured rejection-reason flow
- Run applicants through **multi-round structured interviews** — add rounds (screen/technical/onsite/final), assign an interviewer, record a private 1–5 scorecard and feedback, and set a pass/fail outcome per round
- Move applicants through the pipeline individually or in bulk, with every transition validated against a real state machine (no marking someone "Hired" who was never "Offered")
- **Source candidates directly** — paginated search across every candidate who's opted in to being discovered, not just inbound applicants
- **Work as a team** — create or join a company via a shareable join code; every recruiter on the same team can view, edit, and manage each other's job postings and applicants, with clear attribution of who originally posted each job
- Dashboard stats: active jobs, total applications, pipeline breakdown — automatically covering the whole team's jobs once you're on one

**Platform**
- Role-based access control (candidate / recruiter), enforced server-side on every endpoint — never just a client-side route guard
- Team-based job access via a single reusable `Job.objects.manageable_by(user)` query, so permission logic can't drift out of sync between endpoints
- JWT auth delivered via httpOnly, `SameSite=Lax` cookies (not readable by JS, mitigating XSS token theft)
- Rate limiting and brute-force lockout (`django-axes`) on auth endpoints
- Cached matching corpus with signal-driven invalidation (no stale scores after a profile or job edit)
- 160+ automated backend tests + ESLint-clean, production-building frontend, enforced in CI

## 🧠 How the Matching Engine Works

Most "AI matching" job boards stop at keyword overlap. RoleRadius's engine
(`backend/matching/engine.py`) combines two layers:

1. **Text similarity** — a TF-IDF vectorizer fit over job descriptions and
   candidate profiles/CVs, scored by cosine similarity. This is the
   classic information-retrieval half: it rewards distinctive shared
   vocabulary ("Kubernetes", "PostgreSQL") and downweights common words.
2. **Structured compatibility signals** — computed directly from fields a
   pure-text approach ignores entirely:
   - Skills overlap, with a curated synonym map so "JS" matches "JavaScript",
     "k8s" matches "Kubernetes", "AWS" matches "Amazon Web Services", etc.
     (not exhaustive, not ML-based — a maintained list of common real-world
     aliases; see `SKILL_SYNONYMS` in `matching/engine.py`)
   - Location / work-mode compatibility (remote jobs are always compatible)
   - Experience-level fit (years-of-experience banded against the job's stated level)
   - Job-type compatibility (full-time/part-time/contract/freelance/internship)
   - Salary range overlap

The layers combine into a single 0–100 score:

| Component | Weight |
|---|---|
| Text similarity | 40% |
| Skills overlap | 25% |
| Location compatibility | 15% |
| Experience-level fit | 10% |
| Job-type compatibility | 5% |
| Salary overlap | 5% |

Every match returns *why* it scored the way it did (`matched_skills`,
`missing_skills`, `location_compatible`, `experience_fit`,
`job_type_compatible`, `salary_compatible`) — surfaced directly in the UI —
rather than a bare, unexplained percentage. The TF-IDF corpus is cached and
invalidated via Django signals whenever a job or profile changes, so the
expensive vectorizer fit isn't repeated on every request while still never
serving a stale corpus.

## 👥 Team-Based Recruiting

Recruiters aren't limited to working solo. Any recruiter can create a
Company (getting a shareable join code back) or join one a teammate already
created. Once on the same team:

- Every job posted by any teammate becomes visible and manageable to the
  whole team — view applicants, move them through the pipeline, add
  interview rounds, edit or pause the listing
- The job list and dashboard stats automatically expand to cover the whole
  team's jobs, not just your own
- Each job clearly shows who actually posted it, so shared visibility never
  means losing track of ownership
- Leaving a team is a single action and immediately reverts you to
  solo-recruiter visibility — nothing is deleted, and you can rejoin later
  with the same code

This is implemented as a single reusable access rule
(`Job.objects.manageable_by(user)`) rather than duplicated permission checks
scattered across endpoints, specifically to prevent team-access logic from
drifting out of sync between different parts of the API over time.

## 🛠️ Tech Stack

| | |
|---|---|
| **Backend** | Django 4.2 · Django REST Framework · `djangorestframework-simplejwt` · PostgreSQL · scikit-learn (TF-IDF) · `django-axes` · `django-csp` · Gunicorn · WhiteNoise |
| **Frontend** | React 18 · Vite · React Router · Tailwind CSS · Axios · `react-hot-toast` · `lucide-react` |
| **Infra** | Docker / Docker Compose · GitHub Actions CI · Railway-ready (`railway.json`) · Cloudinary (optional media storage) · Redis (optional cache backend) |
| **Testing** | Django `TestCase` + DRF `APIClient` (160+ tests across accounts, jobs, applications, matching) · ESLint |

## 🏗️ Architecture

```
┌──────────────┐   HTTPS / JSON over   ┌────────────────────┐   Django ORM   ┌────────────┐
│  React (Vite)│ ────────────────────▶ │  Django REST API   │ ─────────────▶ │ PostgreSQL │
│     SPA      │ ◀──────────────────── │     (Gunicorn)      │ ◀───────────── │            │
└──────────────┘  JWT in httpOnly      └────────────────────┘                └────────────┘
                      cookies                    │
                                                  ▼
                                          ┌────────────────┐
                                          │  Django cache  │  (LocMemCache, or
                                          │ (TF-IDF corpus)│   Redis if configured)
                                          └────────────────┘
```

The backend is split into four focused Django apps:

| App | Responsibility |
|---|---|
| `accounts` | Users, candidate/recruiter profiles, auth, teams/companies, talent search |
| `jobs` | Job postings, filtering, saved jobs, team-based access rules |
| `applications` | The application pipeline, status transitions, interview rounds, bulk actions |
| `matching` | The scoring engine — no models of its own, just logic other apps call into |

## 🚀 Getting Started

>>>>>>> Stashed changes
### Option A — Docker Compose (recommended)

```bash
git clone https://github.com/ahmedabbas52233-a11y/RoleRadius-Job-Portal.git
cd RoleRadius-Job-Portal
docker compose up --build
```

The API will be available at `http://localhost:8000` and the frontend at
`http://localhost:5173` (or `http://localhost` for the production compose
profile, served via Nginx).

### Option B — Manual setup

**Backend**

```bash
cd backend
python -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env               # fill in your own SECRET_KEY and DB credentials
python manage.py migrate
python manage.py seed_jobs         # optional — seeds demo jobs and accounts
python manage.py runserver
```

**Frontend**

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

### Demo accounts

After running `seed_jobs`, every seeded account uses the password `demo1234`. For
example:

| Email | Role |
|---|---|
| `priya.sharma@email.com` | Candidate (Data Scientist — strong AI match demo) |

See `backend/jobs/management/commands/seed_jobs.py` for the full list.

## 🧪 Running Tests

```bash
# Backend
cd backend
python manage.py test

# Frontend
cd frontend
npm run lint
npm run build
```

CI (`.github/workflows/ci.yml`) runs the Django test suite, a
`makemigrations --check` drift guard, a security scan, ESLint, and a
production build on every push — see badge above.

## 📚 API Documentation

Interactive API docs are auto-generated via `drf-spectacular` once the
backend is running:

- Swagger UI: `http://localhost:8000/api/schema/swagger-ui/`
- ReDoc: `http://localhost:8000/api/schema/redoc/`
- Raw OpenAPI schema: `http://localhost:8000/api/schema/`

## 📁 Project Structure

```
RoleRadius-Job-Portal/
├── backend/
│   ├── accounts/        # users, profiles, auth, teams/companies, talent search
│   ├── applications/    # application pipeline, interview rounds
│   ├── jobs/             # job postings, team-based access
│   ├── matching/         # TF-IDF + structured-signal scoring engine
│   └── roleradius/       # Django project settings/urls
├── frontend/
│   └── src/
│       ├── components/   # shared UI (JobCard, MatchBreakdown, InterviewRoundsManager, etc.)
│       ├── contexts/     # AuthContext
│       ├── pages/        # route-level views
│       └── services/     # API client
├── docs/screenshots/      # README screenshots (see placeholders above)
└── docker-compose.yml
```

## 🔒 Security

See [SECURITY.md](SECURITY.md) for the project's security policy and how to
report a vulnerability. Notable design choices: JWT delivered via httpOnly
cookies (not `localStorage`, to limit XSS blast radius), `SameSite=Lax`
cookie scoping, server-side role and team-membership checks on every
endpoint (never just a client-side route guard), and rate-limited/
lockout-protected auth endpoints.

## 🤝 Contributing

Contributions are welcome — see [CONTRIBUTING.md](CONTRIBUTING.md) for the
workflow, coding conventions, and how to run the test suite before opening a PR.

## 📄 Citing This Project

If you reference RoleRadius in academic work, please cite it using the
metadata in [`CITATION.cff`](CITATION.cff) (GitHub also exposes a "Cite this
repository" button in the sidebar generated from that file).

## 📜 License

Distributed under the MIT License. See [LICENSE](LICENSE) for details.

---

<div align="center">

Built by **Ahmad Abbas Hussain** as a final-year Computer Science dissertation project.

</div>
