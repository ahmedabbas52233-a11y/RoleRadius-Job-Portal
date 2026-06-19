<div align="center">

# 🎯 RoleRadius

### AI-Powered Job Portal with TF-IDF Cosine Similarity Matching

[![Python](https://img.shields.io/badge/Python-3.12-3776AB?style=flat&logo=python&logoColor=white)](https://python.org)
[![Django](https://img.shields.io/badge/Django-4.2_LTS-092E20?style=flat&logo=django&logoColor=white)](https://djangoproject.com)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat&logo=react&logoColor=black)](https://react.dev)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-4169E1?style=flat&logo=postgresql&logoColor=white)](https://postgresql.org)
[![Tests](https://img.shields.io/badge/Tests-61_passing-22C55E?style=flat&logo=github-actions&logoColor=white)](https://github.com/ahmedabbas52233-a11y/roleradius/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![DOI](https://zenodo.org/badge/DOI/10.5281/zenodo.XXXXXXX.svg)](https://doi.org/10.5281/zenodo.XXXXXXX)

**Final Year Computer Science Dissertation Project**

[Live Demo](#) · [API Docs](http://localhost:8000/api/schema/swagger-ui/) · [Zenodo Paper](docs/zenodo-paper.html) · [Report Bug](https://github.com/ahmedabbas52233-a11y/RoleRadius-Job-Portal/issues)

---

| Home Page | Job Listings | AI Match Dashboard |
|:---------:|:------------:|:-----------------:|
| ![Home](docs/screenshots/home.png) | ![Jobs](docs/screenshots/jobs.png) | ![Dashboard](docs/screenshots/dashboard.png) |

| Job Detail | Recruiter Dashboard | Profile & CV Upload |
|:----------:|:-------------------:|:-------------------:|
| ![Detail](docs/screenshots/job-detail.png) | ![Recruiter](docs/screenshots/recruiter.png) | ![Profile](docs/screenshots/profile.png) |

> **Screenshot guide:** Log in as `priya.sharma@email.com` / `demo1234` for the best AI match demo — her Data Science skills produce high match scores on DataVentures jobs.

</div>

---

## 📋 Table of Contents

- [About the Project](#about)
- [Key Features](#features)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Manual Setup](#manual-setup)
  - [Docker Setup](#docker-setup)
- [Demo Accounts](#demo-accounts)
- [Running Tests](#running-tests)
- [API Documentation](#api-documentation)
- [Project Structure](#project-structure)
- [How the AI Matching Works](#how-ai-matching-works)
- [Deployment](#deployment)
- [GitHub Setup Guide](#github-setup-guide)
- [LinkedIn Announcement](#linkedin-announcement)
- [Citation](#citation)
- [Author](#author)
- [Contributing](#contributing)
- [License](#license)

---

## About the Project <a name="about"></a>

RoleRadius is a full-stack recruitment portal that applies **TF-IDF cosine similarity** to intelligently match job seekers with relevant vacancies. Built as a final year dissertation project, it demonstrates how natural language processing techniques from information retrieval can be applied to recruitment technology in a transparent, explainable, and computationally efficient way.

Unlike commercial platforms that use opaque proprietary algorithms, RoleRadius produces a **visible match score (0–100%)** for every candidate–job pair, calculated from the candidate's CV text, skills, headline, and biography against the job's title, description, requirements, and required skills.

### What makes it different

| Feature | RoleRadius | Typical open-source board |
|---------|-----------|--------------------------|
| AI/ML matching | ✅ TF-IDF cosine similarity | ❌ None |
| Match score transparency | ✅ 0–100% visible | ❌ N/A |
| CV text extraction | ✅ PDF, DOCX, TXT | ❌ None |
| Application pipeline | ✅ 7 stages with history | ⚠️ Basic |
| httpOnly cookie auth | ✅ XSS-safe | ❌ localStorage |
| Automated tests | ✅ 61 tests | ⚠️ Varies |
| Docker + CI/CD | ✅ Full | ❌ Rare |

---

## Key Features <a name="features"></a>

### For Candidates
- 🔍 **Search & filter** 95 diverse jobs by type, work mode, salary, experience level, location
- 🤖 **AI job matches** — personalised recommendations ranked by TF-IDF match score
- 📄 **CV upload** — PDF, DOCX, or TXT; text extracted and indexed for matching
- 📬 **Application tracking** — visual pipeline showing status across 7 stages
- 🔔 **Email notifications** — instantly notified when a recruiter moves your application
- 🔖 **Save jobs** for later review

### For Recruiters
- 📝 **Post jobs** with rich metadata: type, work mode, salary range, required skills
- 👥 **View applicants** ranked by AI match score (highest compatibility first)
- ⚡ **Move candidates** through the pipeline with one click
- 📊 **Dashboard stats** — total applications, shortlisted, interview, offers
- 🗑️ **Soft delete jobs** — preserves all application history
- 📧 **Automatic notifications** — candidates are emailed on every status change

### Platform Features
- 🔐 **Secure auth** — JWT in httpOnly cookies, account lockout after 5 failures, email verification
- 📖 **API docs** — auto-generated Swagger UI at `/api/schema/swagger-ui/`
- 🐳 **Docker** — one-command deployment
- ✅ **61 tests** — accounts, jobs, applications, ML engine
- 🚀 **CI/CD** — GitHub Actions runs tests on every push

---

## Tech Stack <a name="tech-stack"></a>

| Layer | Technology | Version |
|-------|-----------|---------|
| Backend | Django + DRF | 4.2 LTS / 3.15 |
| Authentication | djangorestframework-simplejwt | 5.4.0 |
| Account security | django-axes | 6.4.0 |
| Database | PostgreSQL | 15 |
| ML matching | scikit-learn (TF-IDF) | 1.4.2 |
| CV extraction | pdfminer.six + python-docx | — |
| API docs | drf-spectacular (Swagger) | 0.27.2 |
| Frontend | React 18 + Vite 5 | — |
| Styling | Tailwind CSS | 3.3 |
| File storage | Cloudinary / local fallback | — |
| Container | Docker + Compose | — |
| CI/CD | GitHub Actions | — |

---

## Getting Started <a name="getting-started"></a>

### Prerequisites <a name="prerequisites"></a>

- Python **3.12+**
- Node.js **18+**
- PostgreSQL **15+**
- Git

### Manual Setup <a name="manual-setup"></a>

**Step 1 — Clone the repository**
```bash
git clone https://github.com/ahmedabbas52233-a11y/roleradius.git
cd roleradius
```

**Step 2 — Backend**
```bash
cd backend

# Create and activate virtual environment
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate

# Install dependencies (setuptools first — required for Python 3.12)
pip install --upgrade pip
pip install setuptools
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your PostgreSQL credentials
```

**Step 3 — Create the database**
```sql
-- In psql or pgAdmin:
CREATE DATABASE roleradius_db;
```

**Step 4 — Run migrations and seed data**
```bash
python manage.py makemigrations accounts jobs applications matching
python manage.py migrate
python manage.py createsuperuser
python manage.py seed_jobs        # Creates 95 jobs across 8 companies
```

**Step 5 — Start the backend**
```bash
python manage.py runserver
# API: http://localhost:8000
# Swagger: http://localhost:8000/api/schema/swagger-ui/
# Admin: http://localhost:8000/admin
```

**Step 6 — Frontend (new terminal)**
```bash
cd frontend
npm install
cp .env.example .env             # VITE_API_URL=/api
npm run dev
# App: http://localhost:5173
```

---

### Docker Setup <a name="docker-setup"></a>

Run the **entire stack** (PostgreSQL + Django + React) with a single command:

```bash
docker compose up --build
```

| Service | URL |
|---------|-----|
| React frontend | http://localhost:5173 |
| Django API | http://localhost:8000 |
| Swagger UI | http://localhost:8000/api/schema/swagger-ui/ |
| Django Admin | http://localhost:8000/admin |

To seed data inside Docker:
```bash
docker compose exec backend python manage.py seed_jobs
```

---

## Demo Accounts <a name="demo-accounts"></a>

After running `python manage.py seed_jobs`, these accounts are ready:

### Recruiters (password: `demo1234`)
| Email | Company | Jobs Posted |
|-------|---------|-------------|
| hr@techcorp.com | TechCorp Solutions | 18 |
| talent@dataventures.io | DataVentures | 14 |
| careers@healthtechuk.com | HealthTech UK | 11 |
| jobs@financehub.co.uk | FinanceHub | 10 |
| hello@creativeagency.co.uk | CreativeAgency | 7 |
| jobs@learnpath.co.uk | LearnPath | 12 |
| careers@pixelforge.games | PixelForge Studios | 10 |
| talent@ecosystems.green | EcoSystems | 13 |

### Candidates (password: `demo1234`)
| Email | Skills | Best for demo |
|-------|--------|---------------|
| alex.chen@email.com | React, Django, Python | Software Engineering jobs |
| priya.sharma@email.com | ML, NLP, scikit-learn | **Best AI match demo** |
| tom.walker@email.com | AWS, Kubernetes, DevOps | Infrastructure jobs |

> **Best demo:** Log in as `priya.sharma@email.com`, go to **Dashboard → AI Matches tab** to see her match scores against DataVentures' Data Scientist and NLP roles.

---

## Running Tests <a name="running-tests"></a>

```bash
cd backend
python manage.py test --verbosity=2
```

Expected output:
```
Found 61 test(s).
...............................................................
----------------------------------------------------------------------
Ran 61 tests in X.XXXs
OK
```

| Test module | Tests | Coverage area |
|-------------|-------|---------------|
| accounts | 18 | Auth, profiles, password reset, email verification |
| jobs | 14 | CRUD, permissions, search filters, save/unsave |
| applications | 14 | Apply, withdraw, status pipeline, stats |
| matching | 15 | TF-IDF scores, edge cases, error safety |
| **Total** | **61** | |

---

## API Documentation <a name="api-documentation"></a>

Interactive Swagger UI available at: **http://localhost:8000/api/schema/swagger-ui/**

Key endpoint groups:

| Group | Base path | Key endpoints |
|-------|-----------|---------------|
| Auth | `/api/auth/` | register, login, logout, verify-email, profile |
| Jobs | `/api/jobs/` | list, detail, create, update, save |
| Applications | `/api/applications/` | apply, my apps, withdraw, status update |
| Matching | `/api/matching/` | matched jobs, matched candidates |
| Health | `/api/health/` | `{"status": "ok"}` |

Full API reference: [`docs/zenodo-paper.html`](docs/zenodo-paper.html) — Table 5.

---

## Project Structure <a name="project-structure"></a>

```
roleradius/
├── backend/
│   ├── accounts/         # Auth, profiles, CV upload, email verification
│   │   ├── models.py     # User (UUID PK), CandidateProfile, RecruiterProfile
│   │   ├── views.py      # Register, login, logout, CV upload, password reset
│   │   ├── serializers.py
│   │   ├── permissions.py  # Shared IsCandidate / IsRecruiter
│   │   ├── authentication.py  # CookieJWTAuthentication
│   │   ├── signals.py    # Welcome email on registration
│   │   ├── throttles.py  # Rate limiting classes
│   │   ├── utils.py      # CV extraction, cookie helpers
│   │   └── tests.py      # 18 tests
│   ├── jobs/             # Job listings
│   │   ├── models.py     # Job (soft delete, 6 indexes), SavedJob
│   │   ├── views.py      # List (N+1 fixed), create, update, toggle, save
│   │   ├── signals.py    # Job alerts to matching candidates
│   │   └── tests.py      # 14 tests
│   ├── applications/     # Application lifecycle
│   │   ├── models.py     # Application (7 statuses), ApplicationStatusHistory
│   │   ├── views.py      # Apply (@atomic), withdraw, status update
│   │   ├── signals.py    # Status change notifications
│   │   └── tests.py      # 14 tests
│   ├── matching/         # AI engine
│   │   ├── engine.py     # TF-IDF cosine similarity
│   │   ├── views.py      # Matched jobs / candidates endpoints
│   │   └── tests.py      # 15 tests
│   └── roleradius/       # Django settings, URLs, pagination
├── frontend/
│   └── src/
│       ├── contexts/     # AuthContext (cookie-based, StrictMode-safe)
│       ├── services/     # api.js (Axios + no-loop interceptor)
│       ├── components/   # Navbar, JobCard, SearchFilters, ConfirmDialog,
│       │                 # ErrorBoundary, EmailVerificationBanner
│       └── pages/        # 14 route pages (all lazy-loaded)
├── .github/workflows/    # GitHub Actions CI
├── docs/                 # zenodo-paper.html, guides, screenshots
├── docker-compose.yml
├── CITATION.cff
├── CONTRIBUTING.md
├── CHANGELOG.md
├── LICENSE
└── SECURITY.md
```

---

## How the AI Matching Works <a name="how-ai-matching-works"></a>

1. **Candidate text** is built from: `headline + bio + skills (joined) + cv_text`
2. **Job text** is built from: `title + description + requirements + skills_required + category`
3. Both texts are normalised: lowercased, punctuation removed, whitespace collapsed
4. A `TfidfVectorizer` with `ngram_range=(1,2)` and `max_features=8000` vectorises both
5. `cosine_similarity` computes the dot product of the normalised TF-IDF vectors
6. The result (0.0–1.0) is multiplied by 100 and rounded to produce a **0–100% score**

**Example scores** (from seed data):
- Priya Sharma (NLP/ML skills) vs DataVentures Data Scientist: ~72%
- Priya Sharma vs Senior Full-Stack Developer: ~18%
- Tom Walker (AWS/DevOps) vs DevOps Platform Engineer: ~68%

The score is computed at application time and stored on the `Application` record for instant display, ranked sort in the recruiter view, and the candidate AI matches dashboard.

---

## Deployment <a name="deployment"></a>

### Environment variables

Copy `.env.example` to `.env` and configure:

```env
SECRET_KEY=your-production-secret-key-minimum-50-chars
DEBUG=False
ALLOWED_HOSTS=yourdomain.com,www.yourdomain.com
DATABASE_URL=postgresql://user:password@host:5432/dbname

# Cloudinary (for file uploads in production)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Email (Gmail App Password recommended)
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_HOST_USER=your@gmail.com
EMAIL_HOST_PASSWORD=your_app_password
DEFAULT_FROM_EMAIL=noreply@roleradius.com
FRONTEND_URL=https://yourdomain.com

# CORS
CORS_ALLOWED_ORIGINS=https://yourdomain.com
CSRF_TRUSTED_ORIGINS=https://yourdomain.com
```

### Production checklist
- [ ] `DEBUG=False`
- [ ] Strong `SECRET_KEY` (50+ random characters)
- [ ] PostgreSQL with connection pooling
- [ ] Cloudinary configured for file uploads
- [ ] SMTP email configured
- [ ] `python manage.py collectstatic`
- [ ] Run behind Nginx or a platform like Railway/Render/Heroku
- [ ] HTTPS enabled (required for httpOnly secure cookies)

---

## GitHub Setup Guide <a name="github-setup-guide"></a>

### Repository description
Set this in your repo **About** section (gear icon):
```
AI-powered job portal with TF-IDF cosine similarity matching — Django REST + React 18
```

### Repository topics
Add these topics for discoverability:
```
job-portal  django  react  tfidf  nlp  machine-learning  python
full-stack  postgresql  docker  final-year-project  open-source
recruitment  cosine-similarity  information-retrieval  django-rest-framework
```

### Creating the v1.0.0 release

1. Go to **Releases** → **Create a new release**
2. Tag: `v1.0.0` (create new tag on publish)
3. Title: `RoleRadius v1.0.0 — Initial Release`
4. Use the [CHANGELOG.md](CHANGELOG.md) content as the release notes
5. Click **Publish release**

### Connecting to Zenodo for a DOI
See [`docs/ZENODO_GUIDE.md`](docs/ZENODO_GUIDE.md) for step-by-step instructions.

---

## LinkedIn Announcement <a name="linkedin-announcement"></a>

Use this template when sharing your project on LinkedIn:

---

**Option A — Technical audience**
```
🚀 Final Year Project: RoleRadius — AI-Powered Job Portal

Excited to share my dissertation project: a full-stack job portal that uses
TF-IDF cosine similarity to match candidates with relevant jobs!

🤖 Key features:
• AI matching engine producing visible 0–100% compatibility scores
• Full application pipeline with automated email notifications
• CV text extraction from PDF, DOCX, and TXT
• httpOnly cookie JWT auth (no localStorage XSS vulnerability)
• 61 automated tests + Docker + GitHub Actions CI/CD

🛠 Built with:
Django REST Framework · React 18 · PostgreSQL · scikit-learn · Tailwind CSS

This project demonstrates that NLP techniques from information retrieval can
make recruitment more transparent and explainable — candidates see exactly
why they matched a role.

🔗 GitHub: github.com/ahmedabbas52233-a11y/roleradius
📄 Zenodo DOI: doi.org/10.5281/zenodo.XXXXXXX

#FinalYearProject #Django #React #MachineLearning #Python #NLP #TechProject
#ComputerScience #FullStack #OpenSource #JobPortal #TF-IDF
```

**Option B — Broader audience**
```
I just published my final year project — a job portal that actually tells you
WHY you're a good fit for a role.

Most job boards just show you listings. RoleRadius shows you a match score
(like 73%) based on your actual skills, CV content, and job requirements —
using the same text similarity algorithm Google uses for document search.

I built the whole thing: the AI engine, the backend API, the frontend,
tests, Docker, and CI/CD. It's open source — anyone can study, fork, or
deploy it.

Check it out 👇
github.com/ahmedabbas52233-a11y/roleradius

#FinishedProduct #CS #FinalYearProject #OpenSource #AI
```

---

## Citation <a name="citation"></a>

If you use RoleRadius in academic work, please cite it:

**BibTeX:**
```bibtex
@software{hussain2026roleradius,
  author    = {Hussain, Ahmad Abbas},
  title     = {{RoleRadius: An Open-Source AI-Powered Job Portal
                with TF-IDF Cosine Similarity Candidate Matching}},
  month     = jun,
  year      = 2026,
  publisher = {Zenodo},
  version   = {1.0.0},
  doi       = {10.5281/zenodo.XXXXXXX},
  url       = {https://doi.org/10.5281/zenodo.XXXXXXX}
}
```

**Harvard:**
> Hussain, A. A. (2026) *RoleRadius: An Open-Source AI-Powered Job Portal* (Version 1.0.0) [Software]. Zenodo. https://doi.org/10.5281/zenodo.XXXXXXX

---

## Author <a name="author"></a>

**Ahmad Abbas Hussain**

[![GitHub](https://img.shields.io/badge/GitHub-ahmedabbas52233--a11y-181717?style=flat&logo=github)](https://github.com/ahmedabbas52233-a11y)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-ahmad--abbas--h-0A66C2?style=flat&logo=linkedin)](https://www.linkedin.com/in/ahmad-abbas-h-7000151a3)
[![Email](https://img.shields.io/badge/Email-Ahmedabbas52233%40gmail.com-EA4335?style=flat&logo=gmail)](mailto:Ahmedabbas52233@gmail.com)

---

## Contributing <a name="contributing"></a>

Contributions are welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md) before submitting a pull request.

---

## License <a name="license"></a>

Released under the [MIT License](LICENSE).

Copyright © 2026 Ahmad Abbas Hussain.

---

<div align="center">

⭐ **Star this repo if it helped you** ⭐

Made with ❤️ as a Final Year Dissertation Project

</div>
