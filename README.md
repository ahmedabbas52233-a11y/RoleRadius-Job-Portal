# Screenshots

This folder holds screenshots for the README.

## Required screenshots (1280×800px, PNG)

| Filename | What to capture |
|----------|----------------|
| `home.png` | Home page with job listings visible |
| `jobs.png` | Jobs listing page with filters open |
| `job-detail.png` | A job detail page showing full description |
| `dashboard.png` | Candidate dashboard — AI Matches tab with scores visible |
| `recruiter.png` | Recruiter dashboard with applicant list |
| `profile.png` | Profile page showing CV upload section |

## How to take them

```bash
# 1. Seed the database
python manage.py seed_jobs

# 2. Start both servers
python manage.py runserver   # Terminal 1
npm run dev                  # Terminal 2 (inside frontend/)

# 3. Open browser at http://localhost:5173
# 4. Log in as priya.sharma@email.com / demo1234 for the best AI match demo
# 5. Navigate to each page and take screenshots
```

## Best demo account for screenshots

- **priya.sharma@email.com** / `demo1234` — Data Scientist candidate
  - Her ML/NLP skills produce high match scores on DataVentures jobs
  - Go to **Dashboard → AI Matches tab** for the best AI screenshot
