# RoleRadius – AI-Powered Job Portal

A full-stack job portal built with **Django REST Framework** + **React**, featuring a **TF-IDF cosine similarity** matching engine that ranks job–candidate compatibility in real time.

---

## 🗂️ Project Structure

```
roleradius/
├── backend/              # Django REST API
│   ├── accounts/         # Auth, user profiles, CV upload
│   ├── jobs/             # Job CRUD, search, save
│   ├── applications/     # Application lifecycle + pipeline
│   ├── matching/         # TF-IDF ML engine
│   ├── roleradius/       # Django settings, URL root
│   ├── requirements.txt
│   └── .env.example
└── frontend/             # React + Vite + Tailwind
    ├── src/
    │   ├── contexts/     # AuthContext (JWT)
    │   ├── services/     # Axios API service
    │   ├── pages/        # All route pages
    │   ├── components/   # Shared UI components
    │   └── hooks/        # useDebounce
    ├── package.json
    └── .env.example
```

---

## ⚙️ Backend Setup

### 1. Prerequisites
- Python 3.11+
- PostgreSQL 15+

### 2. Create & activate virtual environment
```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
```

### 3. Install dependencies
```bash
pip install -r requirements.txt
```

### 4. Configure environment
```bash
cp .env.example .env
# Edit .env with your database credentials and Cloudinary keys
```

### 5. Create PostgreSQL database
```bash
psql -U postgres
CREATE DATABASE roleradius_db;
\q
```

### 6. Run migrations
```bash
python manage.py makemigrations accounts jobs applications matching
python manage.py migrate
```

### 7. Create superuser
```bash
python manage.py createsuperuser
```

### 8. Run the development server
```bash
python manage.py runserver
# API available at http://localhost:8000
# Admin panel at http://localhost:8000/admin
```

---

## 🎨 Frontend Setup

### 1. Install dependencies
```bash
cd frontend
npm install
```

### 2. Configure environment
```bash
cp .env.example .env
# VITE_API_URL=http://localhost:8000/api
```

### 3. Run dev server
```bash
npm run dev
# App at http://localhost:5173
```

---

## 🔌 API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register/` | Register candidate or recruiter |
| POST | `/api/auth/login/` | Login → returns JWT tokens |
| POST | `/api/auth/logout/` | Blacklist refresh token |
| GET/PATCH | `/api/auth/me/` | Current user |
| GET/PATCH | `/api/auth/profile/candidate/` | Candidate profile |
| POST | `/api/auth/profile/candidate/cv/` | Upload CV (PDF/DOCX/TXT) |
| GET/PATCH | `/api/auth/profile/recruiter/` | Recruiter profile |
| POST | `/api/auth/password-reset/` | Request password reset email |
| POST | `/api/auth/password-reset/confirm/` | Confirm reset with token |
| GET | `/api/jobs/` | List jobs (search + filters) |
| GET | `/api/jobs/<id>/` | Job detail |
| POST | `/api/jobs/create/` | Create job (recruiter) |
| PATCH | `/api/jobs/<id>/update/` | Update job |
| DELETE | `/api/jobs/<id>/delete/` | Delete job |
| POST | `/api/jobs/<id>/toggle/` | Activate / pause job |
| POST | `/api/jobs/<id>/save/` | Save / unsave job |
| GET | `/api/jobs/saved/` | Candidate's saved jobs |
| POST | `/api/applications/apply/<job_id>/` | Apply to job |
| GET | `/api/applications/my/` | Candidate's applications |
| POST | `/api/applications/my/<id>/withdraw/` | Withdraw application |
| GET | `/api/applications/job/<job_id>/` | Recruiter views applicants |
| PATCH | `/api/applications/<id>/status/` | Update applicant status |
| GET | `/api/applications/recruiter/stats/` | Recruiter dashboard stats |
| GET | `/api/applications/my/stats/` | Candidate dashboard stats |
| GET | `/api/matching/jobs/` | AI-matched jobs for candidate |
| GET | `/api/matching/candidates/<job_id>/` | AI-matched candidates for job |

---

## 🤖 AI Matching Engine

Located in `backend/matching/engine.py`:

- Extracts text from candidate profile (headline, bio, skills, CV text)
- Extracts text from job (title, description, requirements, skills)
- Vectorises both using **TF-IDF** (bigrams, stop words removed)
- Computes **cosine similarity** → 0–100 match score
- Used when applying (stored on application), on candidate dashboard, and on recruiter job detail

---

## 🎯 Features

**Candidates**
- Register, login with JWT
- Upload CV (PDF/DOCX/TXT) — text extracted and indexed for ML
- View AI-matched jobs ranked by compatibility score
- Apply to jobs with optional cover letter
- Track application pipeline (Pending → Reviewing → Shortlisted → Interview → Offered)
- Save/unsave jobs

**Recruiters**
- Register with company name
- Post, edit, pause/activate job listings
- View and filter applicants per job, sorted by match score
- Move applicants through stages with one click
- Dashboard with aggregate stats

**General**
- Responsive design (Tailwind CSS)
- Full search + filters (type, location, work mode, salary range, experience)
- Password reset via email
- WCAG-friendly markup (labels, aria, focus rings)

---

## 🚀 Deployment Notes

- Set `DEBUG=False` in `.env`
- Set proper `SECRET_KEY` and `ALLOWED_HOSTS`
- Use `gunicorn roleradius.wsgi` for production
- Set Cloudinary keys for file uploads
- Configure real SMTP server for password reset emails
- Run `python manage.py collectstatic` before deploying

---

## 📦 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, Tailwind CSS, React Router v6 |
| Auth | JWT (djangorestframework-simplejwt) |
| Backend | Django 4.2, Django REST Framework |
| Database | PostgreSQL |
| File Storage | Cloudinary |
| ML Matching | scikit-learn (TF-IDF + Cosine Similarity) |
| CV Parsing | pdfminer.six, python-docx |
| Forms | react-hook-form |
| Notifications | react-hot-toast |
