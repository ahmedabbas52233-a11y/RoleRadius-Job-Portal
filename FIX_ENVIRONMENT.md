# Fix: ModuleNotFoundError: No module named 'pkg_resources'

## What went wrong

You are on **Python 3.12**. Python 3.12 no longer bundles `setuptools` automatically
in virtual environments. The old version of `djangorestframework-simplejwt` (5.3.0)
imported from `pkg_resources`, which lives inside `setuptools`.

**Two things changed in `requirements.txt`:**
1. `setuptools>=69.0.3` added (the package that provides `pkg_resources`)
2. `djangorestframework-simplejwt` upgraded from `5.3.0` → `5.4.0`
   (5.4.0 uses `importlib.metadata` instead of `pkg_resources` — the proper fix)

---

## Exact commands to fix everything — run these now

Open a terminal in your project root and run **in order**:

```powershell
# 1. Navigate into backend and activate your venv
cd "D:\Projects\Computing Project\roleradius\backend"
.venv\Scripts\activate

# 2. Upgrade pip itself first (avoids edge-case install errors on Python 3.12)
python -m pip install --upgrade pip

# 3. Install setuptools immediately — this fixes pkg_resources right now
pip install setuptools

# 4. Reinstall all packages from the updated requirements.txt
#    (upgrades simplejwt to 5.4.0 and pins all other versions correctly)
pip install -r requirements.txt

# 5. Verify Django can start without errors
python -c "import django; print('Django OK:', django.__version__)"
python -c "import rest_framework_simplejwt; print('SimpleJWT OK')"

# 6. Run migrations (creates all database tables)
python manage.py makemigrations accounts jobs applications matching
python manage.py migrate

# 7. Create your admin account
python manage.py createsuperuser

# 8. Seed the database with demo data (20 jobs, 5 user accounts)
python manage.py seed_jobs

# 9. Start the server
python manage.py runserver
```

---

## Seed command demo accounts

After running `seed_jobs`, you can log in with:

| Role       | Email                       | Password  |
|------------|-----------------------------|-----------|
| Recruiter  | hr@techcorp.com             | demo1234  |
| Recruiter  | talent@dataventures.io      | demo1234  |
| Candidate  | alex.chen@email.com         | demo1234  |
| Candidate  | priya.sharma@email.com      | demo1234  |
| Candidate  | tom.walker@email.com        | demo1234  |

---

## Start the frontend (separate terminal)

```powershell
cd "D:\Projects\Computing Project\roleradius\frontend"
npm install
npm run dev
```

App opens at: http://localhost:5173  
API runs at:  http://localhost:8000  
API Docs:     http://localhost:8000/api/schema/swagger-ui/  
Django Admin: http://localhost:8000/admin

---

## If you hit any other errors

**`psycopg2` error** — PostgreSQL isn't running or DB doesn't exist:
```powershell
# In psql or pgAdmin, create the database:
psql -U postgres -c "CREATE DATABASE roleradius_db;"
```

**`cloudinary` warning** — Fine for local dev, just means file uploads won't work
without Cloudinary keys. Images will fall back gracefully.

**Port already in use** — Another process is on port 8000:
```powershell
python manage.py runserver 8001
# Then update VITE_API_URL in frontend/.env to http://localhost:8001/api
```
