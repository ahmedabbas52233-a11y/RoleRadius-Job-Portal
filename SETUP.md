## SETUP.md — Run this once to eliminate all Pylance / VS Code errors

### Why you're seeing red squiggles

There are 3 causes:

| Error type                        | Cause                                  | Fix                                   |
|-----------------------------------|----------------------------------------|---------------------------------------|
| `reportMissingImports` (red)      | Pylance is using system Python, not venv | Run steps below, then select venv    |
| `reportMissingModuleSource` (yellow) | Django ships .pyc stubs, not source  | Already suppressed in pyrightconfig.json |
| `@tailwind` / `@apply` CSS        | VS Code CSS validator doesn't know Tailwind | Already suppressed in settings.json |

---

## Step 1 — Create the virtual environment

```bash
cd roleradius/backend
python -m venv venv
```

**Windows:**
```bash
venv\Scripts\activate
```

**Mac / Linux:**
```bash
source venv/bin/activate
```

---

## Step 2 — Install all Python dependencies

```bash
pip install -r requirements.txt
```

This installs Django, DRF, simplejwt, scikit-learn, dj-database-url, python-docx,
pdfminer.six, cloudinary, etc. — everything Pylance was complaining it couldn't find.

**Also install Django + DRF type stubs for better IntelliSense:**
```bash
pip install django-stubs djangorestframework-stubs
```

---

## Step 3 — Tell VS Code to use the venv Python

1. Press **Ctrl + Shift + P** (or Cmd + Shift + P on Mac)
2. Type: `Python: Select Interpreter`
3. Choose the interpreter that shows `venv` in its path:
   - Windows: `.\backend\venv\Scripts\python.exe`
   - Mac/Linux: `./backend/venv/bin/python`

After selecting, **reload VS Code** (Ctrl+Shift+P → "Reload Window").

---

## Step 4 — Install the Tailwind CSS IntelliSense extension

1. Open the Extensions panel (Ctrl+Shift+X)
2. Search for **"Tailwind CSS IntelliSense"** by Tailwind Labs
3. Install it

This makes `@tailwind` and `@apply` recognised — the yellow warnings in index.css disappear.

---

## Step 5 — Run the database migrations

```bash
# Still inside backend/ with venv activated
cp .env.example .env
# Edit .env with your PostgreSQL credentials

python manage.py makemigrations accounts jobs applications matching
python manage.py migrate
python manage.py createsuperuser
```

---

## Step 6 — Install frontend dependencies

```bash
cd ../frontend
npm install
```

---

## Step 7 — Start both servers

**Terminal 1 (backend):**
```bash
cd backend
source venv/bin/activate   # or venv\Scripts\activate on Windows
python manage.py runserver
```

**Terminal 2 (frontend):**
```bash
cd frontend
npm run dev
```

---

## What each fix did

| File changed                          | What was fixed                                                   |
|---------------------------------------|------------------------------------------------------------------|
| `.vscode/settings.json`               | Points Pylance at venv; disables CSS validator; adds Tailwind    |
| `pyrightconfig.json`                  | Suppresses false-positive spmatrix + Django source warnings      |
| `backend/matching/engine.py`          | Casts `TfidfVectorizer` output to `csr_matrix` — fixes all 6 `reportIndexIssue` errors |
| `backend/roleradius/settings.py`      | Added `rest_framework_simplejwt.token_blacklist` to INSTALLED_APPS (logout was crashing) |
| `backend/applications/urls.py`        | Moved `my/stats/` before `my/<uuid:pk>/` (stats endpoint was returning 404) |
| `frontend/src/components/Navbar.jsx`  | Removed `@heroicons/react` import (package not installed — build was failing) |
