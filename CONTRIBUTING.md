# Contributing to RoleRadius

Thank you for considering contributing! This guide explains how to get
involved, what the standards are, and how to submit changes.

---

## Ways to contribute

- **Bug reports** — Found something broken? Open an issue.
- **Feature requests** — Have an idea? Describe it in an issue first.
- **Pull requests** — Fix a bug or build a feature.
- **Documentation** — Improve the README, add docstrings, fix typos.
- **Tests** — Add missing test cases or improve existing ones.

---

## Getting started

### 1. Fork and clone
```bash
git clone https://github.com/YOUR_USERNAME/roleradius.git
cd roleradius
```

### 2. Set up the backend
```bash
cd backend
python -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env              # fill in your local DB credentials
python manage.py migrate
python manage.py seed_jobs
python manage.py runserver
```

### 3. Set up the frontend
```bash
cd frontend
npm install
npm run dev
```

---

## Before opening a pull request

### Run the tests
```bash
cd backend
python manage.py test --verbosity=2
```
All 61 tests must pass. If you add a feature, add tests for it.

### Check for obvious issues
```bash
# Backend: check for import errors
python manage.py check

# Frontend: check for lint errors
cd frontend && npm run lint
```

---

## Coding standards

### Python / Django
- Follow [PEP 8](https://peps.python.org/pep-0008/)
- Add type hints to new functions (see `matching/engine.py` for examples)
- Write docstrings for new classes and non-trivial functions
- Use `select_related` / `prefetch_related` — no N+1 queries
- New endpoints need at least one test for the happy path and one for
  an unauthorised access attempt

### JavaScript / React
- Functional components with hooks only — no class components
- Use `lucide-react` for icons — do not add new icon libraries
- Tailwind utility classes only — no custom CSS unless unavoidable
- New pages must be lazy-loaded via `React.lazy()` in `App.jsx`
- Handle loading and error states in every data-fetching component

---

## Branching strategy

| Branch | Purpose |
|--------|---------|
| `main` | Stable, always deployable |
| `develop` | Integration branch for features |
| `feature/your-feature-name` | Your feature |
| `fix/your-bug-name` | Your bug fix |

Always branch from `develop`, not `main`.

```bash
git checkout develop
git pull origin develop
git checkout -b feature/job-alerts-improvements
```

---

## Commit message format

Use [Conventional Commits](https://www.conventionalcommits.org/):

```
type(scope): short description

Longer explanation if needed.

Fixes #123
```

| Type | When to use |
|------|------------|
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation only |
| `test` | Adding or fixing tests |
| `refactor` | Code change with no new feature or fix |
| `chore` | Build, config, dependency changes |

**Examples:**
```
feat(matching): add bigram support to TF-IDF vectoriser
fix(auth): pass request to authenticate() to satisfy django-axes
docs(readme): add Zenodo badge and citation section
test(applications): add test for double-apply prevention
```

---

## Pull request checklist

Before submitting your PR, confirm:

- [ ] All 61 existing tests pass (`python manage.py test`)
- [ ] New functionality has corresponding tests
- [ ] No new Pylance errors introduced
- [ ] Frontend builds without errors (`npm run build`)
- [ ] `CHANGELOG.md` updated under `[Unreleased]`
- [ ] PR description explains what and why, not just how

---

## Code of Conduct

Be respectful. Constructive criticism is welcome; personal attacks are not.
All contributors are expected to follow the
[Contributor Covenant](https://www.contributor-covenant.org/version/2/1/code_of_conduct/).

---

## Questions?

Open a [GitHub Discussion](https://github.com/ahmedabbas52233-a11y/roleradius/discussions)
or email **Ahmedabbas52233@gmail.com**.
