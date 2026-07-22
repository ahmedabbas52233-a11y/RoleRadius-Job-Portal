"""
RoleRadius ML Matching Engine
Hybrid scoring: TF-IDF + cosine similarity for free-text relevance, combined
with structured compatibility signals computed directly from the job and
candidate fields that the text-only version used to ignore.

Why hybrid, not pure TF-IDF
---------------------------
Pure keyword/TF-IDF similarity over title+description+skills text has no
idea that a candidate is on the wrong continent, wants a salary the role
can't pay, or is a graduate applying to a Principal Engineer role -- none
of that is expressed in the free text both sides usually overlap on. Job
and CandidateProfile already capture this as structured fields (location,
work_mode, experience_level/experience_years, salary ranges) -- this
engine now actually uses them instead of leaving them on the table.

The final 0-100 score is a weighted blend:
    40% text similarity         (TF-IDF cosine over description/skills/cv text)
    25% explicit skills overlap (exact skill-list intersection, not fuzzy)
    15% location/work-mode compatibility
    10% experience-level fit
     5% job-type compatibility  (full-time/part-time/contract/etc.)
     5% salary range overlap
These weights are a deliberate, documented design choice -- not the only
valid one -- see WEIGHTS below if you want to retune them.

Each match also returns *why* it scored the way it did (matched_skills,
missing_skills, location_compatible, experience_fit, salary_compatible) so
the frontend can show a real explanation instead of a bare percentage.

Performance design
-------------------
Fitting a TfidfVectorizer is O(N) over the corpus. Both corpora (active
jobs / open-to-work candidates) are cached (Django's cache framework --
LocMemCache by default, swaps to Redis automatically if REDIS_URL is set,
see settings.py CACHES). Only IDs + sparse vectors are cached, never live
Django model instances, so the cache stays cheap to store and safe to
pickle under both backends.

Computing the *structured* signals needs a few extra columns (work_mode,
experience_level, location, salary_min/max, skills_required) that aren't
worth caching -- they're cheap, indexed-PK lookups (`WHERE id IN (...)`),
so each match request does one extra lightweight query against the
already-known corpus IDs. The expensive part (the TF-IDF fit) stays
cached; only this cheap part runs fresh every time, which is what keeps
results from ever being stale on the structured side.

Cache invalidation is signal-driven (see jobs/signals.py, accounts/signals.py)
so in practice the cache is almost always fresh; the TTL below is just a
safety net in case a signal is ever missed.
"""
from __future__ import annotations

import re
from typing import Optional

from django.core.cache import cache
from scipy.sparse import csr_matrix
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

CACHE_TTL = 600  # 10 minutes -- safety net on top of signal-driven invalidation
JOB_CORPUS_CACHE_KEY = 'matching:job_corpus:v3'
CANDIDATE_CORPUS_CACHE_KEY = 'matching:candidate_corpus:v3'

# Job.EXPERIENCE_CHOICES ordinal order, kept here as plain strings (not an
# import of jobs.models.Job) to avoid a needless cross-app import at module
# load time; the values themselves are the stable DB choice codes.
EXPERIENCE_BAND_ORDER = ['entry', 'mid', 'senior', 'lead', 'executive']

# Scoring weights -- must sum to 1.0 (checked by a test in matching/tests.py).
WEIGHTS = {
    'text': 0.40,
    'skills': 0.25,
    'location': 0.15,
    'experience': 0.10,
    'job_type': 0.05,
    'salary': 0.05,
}


def clean_text(text: str) -> str:
    """Normalise text for TF-IDF processing."""
    if not text:
        return ""
    text = text.lower()
    text = re.sub(r"[^\w\s]", " ", text)
    text = re.sub(r"\s+", " ", text).strip()
    return text


def _fit_transform(vectorizer: TfidfVectorizer, corpus: list[str]) -> csr_matrix:
    """Fit and transform corpus; always returns a csr_matrix."""
    return csr_matrix(vectorizer.fit_transform(corpus))


def invalidate_job_corpus_cache() -> None:
    """Call whenever a Job is created, updated, or deleted."""
    cache.delete(JOB_CORPUS_CACHE_KEY)


def invalidate_candidate_corpus_cache() -> None:
    """Call whenever a CandidateProfile is created or updated."""
    cache.delete(CANDIDATE_CORPUS_CACHE_KEY)


# -- Structured compatibility signals ----------------------------------------

def _years_to_band(years: Optional[int]) -> Optional[str]:
    """Bucket raw years-of-experience into the same bands Job.experience_level uses.

    This is a heuristic, not a precise mapping -- "Lead/Principal" or
    "Executive" in the real world is about scope and title, not purely
    years on the job. Treat the executive boundary especially as approximate.
    """
    if years is None:
        return None
    if years < 2:
        return 'entry'
    if years < 5:
        return 'mid'
    if years < 8:
        return 'senior'
    if years < 12:
        return 'lead'
    return 'executive'


def _experience_fit(job_level: str, years: Optional[int]) -> tuple[float, str]:
    """Return (score 0-1, human label) for how a candidate's experience fits a job's level."""
    band = _years_to_band(years)
    if band is None or not job_level:
        return 0.5, 'unknown'
    try:
        band_idx = EXPERIENCE_BAND_ORDER.index(band)
        job_idx = EXPERIENCE_BAND_ORDER.index(job_level)
    except ValueError:
        return 0.5, 'unknown'
    diff = band_idx - job_idx
    if diff == 0:
        return 1.0, 'good fit'
    if diff == -1:
        return 0.55, 'slightly under-qualified'
    if diff == 1:
        return 0.70, 'slightly over-qualified'
    if diff <= -2:
        return 0.15, 'under-qualified'
    return 0.35, 'over-qualified'


def _location_compatibility(
    job_location: str, job_work_mode: str, candidate_location: str
) -> tuple[float, Optional[bool]]:
    """Return (score 0-1, True/False/None-unknown) for location fit.

    Remote jobs are always location-compatible. Otherwise compares the
    "city" segment (text before the first comma) of both locations,
    case-insensitively. Returns None (unknown, neutral score) when either
    side hasn't provided a location at all -- missing data shouldn't be
    punished the same as a confirmed mismatch.
    """
    if job_work_mode == 'remote':
        return 1.0, True
    j_loc = (job_location or '').strip().lower()
    c_loc = (candidate_location or '').strip().lower()
    if not j_loc or not c_loc:
        return 0.5, None
    j_city = j_loc.split(',')[0].strip()
    c_city = c_loc.split(',')[0].strip()
    if j_city and (j_city == c_city or j_city in c_loc or c_city in j_loc):
        return 1.0, True
    return 0.0, False


def _salary_compatibility(
    job_min: Optional[int], job_max: Optional[int],
    cand_min: Optional[int], cand_max: Optional[int],
) -> tuple[float, Optional[bool]]:
    """Return (score 0-1, True/False/None-unknown) for salary range overlap.

    None (neutral, unknown) when either side hasn't stated a number -- a
    job with no posted salary or a candidate with no stated expectation
    shouldn't be treated as a confirmed mismatch.
    """
    if job_min is None and job_max is None:
        return 0.5, None
    if cand_min is None and cand_max is None:
        return 0.5, None
    j_lo = job_min if job_min is not None else (job_max or 0)
    j_hi = job_max if job_max is not None else (job_min if job_min is not None else float('inf'))
    c_lo = cand_min if cand_min is not None else (cand_max or 0)
    c_hi = cand_max if cand_max is not None else (cand_min if cand_min is not None else float('inf'))
    if max(j_lo, c_lo) <= min(j_hi, c_hi):
        return 1.0, True
    return 0.2, False


def _job_type_compatibility(job_type: str, desired_job_types: list) -> tuple[float, Optional[bool]]:
    """Return (score 0-1, True/False/None-unknown) for job-type fit.

    None (neutral, unknown) when the candidate hasn't stated any
    preference at all -- an empty list means "didn't say," not "wants
    nothing," so it shouldn't be scored as a mismatch.
    """
    desired_job_types = desired_job_types if isinstance(desired_job_types, list) else []
    if not desired_job_types:
        return 0.5, None
    if job_type in desired_job_types:
        return 1.0, True
    return 0.0, False


# Curated skill-synonym map: canonical form -> known aliases (all lowercase).
# This is a hand-maintained list of common real-world aliases, NOT an
# exhaustive taxonomy and NOT ML-based synonym detection (e.g. embeddings) --
# that would be a much bigger, fuzzier undertaking with its own false-positive
# risks. This only normalizes well-known, unambiguous abbreviations/aliases
# that recruiters and candidates commonly use interchangeably. Extend this
# dict as new gaps are found; each entry is a deliberate, reviewable choice.
SKILL_SYNONYMS: dict[str, list[str]] = {
    'javascript': ['js', 'ecmascript'],
    'typescript': ['ts'],
    'python': ['py'],
    'kubernetes': ['k8s'],
    'postgresql': ['postgres', 'psql'],
    'node.js': ['nodejs', 'node'],
    'react.js': ['react', 'reactjs'],
    'vue.js': ['vue', 'vuejs'],
    'angular.js': ['angular', 'angularjs'],
    'amazon web services': ['aws'],
    'google cloud platform': ['gcp', 'google cloud'],
    'microsoft azure': ['azure'],
    'continuous integration/continuous deployment': ['ci/cd', 'cicd', 'ci cd'],
    'machine learning': ['ml'],
    'natural language processing': ['nlp'],
    'restful api': ['rest api', 'rest', 'restful'],
    'c#': ['csharp', 'c sharp'],
    'c++': ['cpp', 'c plus plus'],
    '.net': ['dotnet', 'dot net', '.net core', 'asp.net'],
    'objective-c': ['objective c', 'objc'],
    'html5': ['html'],
    'css3': ['css'],
    'sql server': ['mssql', 'microsoft sql server'],
    'mongodb': ['mongo'],
    'elasticsearch': ['elastic search'],
    'golang': ['go'],
    'sass': ['scss'],
    'power bi': ['powerbi'],
    'scikit-learn': ['sklearn', 'scikit learn'],
    'pytorch': ['torch'],
}


def _build_synonym_lookup() -> dict[str, str]:
    """Flatten SKILL_SYNONYMS into alias-or-canonical -> canonical, all lowercase."""
    lookup = {}
    for canonical, aliases in SKILL_SYNONYMS.items():
        lookup[canonical] = canonical
        for alias in aliases:
            lookup[alias] = canonical
    return lookup


_SKILL_SYNONYM_LOOKUP = _build_synonym_lookup()


def _canonicalize_skill(skill: str) -> str:
    """Map a lowercased, stripped skill string to its canonical form if known, else return as-is."""
    return _SKILL_SYNONYM_LOOKUP.get(skill, skill)


def _skills_overlap(required: list, candidate_skills: list) -> tuple[float, list[str], list[str]]:
    """Return (score 0-1, matched skills, missing skills) -- case-insensitive
    overlap after synonym canonicalization (see SKILL_SYNONYMS above), so
    e.g. a job requiring "JavaScript" matches a candidate who listed "JS".

    Neutral 0.5 when the job didn't list discrete required skills at all
    (relies on the text-similarity component instead in that case).
    """
    required = required if isinstance(required, list) else []
    candidate_skills = candidate_skills if isinstance(candidate_skills, list) else []
    # Map: canonical form -> the original required-skill string (for display).
    # If two required skills canonicalize to the same thing (e.g. "JS" and
    # "JavaScript" both required), the later one in the list wins the display
    # string -- a harmless, rare edge case since job posters shouldn't list
    # true duplicates anyway.
    req_canon = {
        _canonicalize_skill(s.strip().lower()): s
        for s in required if isinstance(s, str) and s.strip()
    }
    if not req_canon:
        return 0.5, [], []
    cand_canon = {
        _canonicalize_skill(s.strip().lower())
        for s in candidate_skills if isinstance(s, str) and s.strip()
    }
    matched = [orig for canon, orig in req_canon.items() if canon in cand_canon]
    missing = [orig for canon, orig in req_canon.items() if canon not in cand_canon]
    return len(matched) / len(req_canon), matched, missing


def _structured_signals(job, profile) -> dict:
    """Compute every structured compatibility signal between one job and one candidate profile."""
    skills_score, matched_skills, missing_skills = _skills_overlap(
        job.skills_required, profile.skills
    )
    location_score, location_compatible = _location_compatibility(
        job.location, job.work_mode, profile.location
    )
    experience_score, experience_fit = _experience_fit(
        job.experience_level, profile.experience_years
    )
    job_type_score, job_type_compatible = _job_type_compatibility(
        job.job_type, profile.desired_job_types
    )
    salary_score, salary_compatible = _salary_compatibility(
        job.salary_min, job.salary_max, profile.desired_salary_min, profile.desired_salary_max
    )
    return {
        'skills_score': skills_score,
        'matched_skills': matched_skills,
        'missing_skills': missing_skills,
        'location_score': location_score,
        'location_compatible': location_compatible,
        'experience_score': experience_score,
        'experience_fit': experience_fit,
        'job_type_score': job_type_score,
        'job_type_compatible': job_type_compatible,
        'salary_score': salary_score,
        'salary_compatible': salary_compatible,
    }


def _combine(text_sim: float, signals: dict) -> float:
    """Blend text similarity (0-1) with structured signals (0-1 each) into a 0-100 score."""
    combined = (
        WEIGHTS['text'] * text_sim
        + WEIGHTS['skills'] * signals['skills_score']
        + WEIGHTS['location'] * signals['location_score']
        + WEIGHTS['experience'] * signals['experience_score']
        + WEIGHTS['job_type'] * signals['job_type_score']
        + WEIGHTS['salary'] * signals['salary_score']
    )
    return round(combined * 100, 2)


# -- Job corpus (for "find jobs for this candidate") -------------------------

# Columns needed for both the text corpus *and* structured scoring, loaded
# once via .only() so structured scoring never triggers per-object deferred
# field queries (which would silently turn this into an N+1).
_JOB_FIELDS = [
    'id', 'title', 'description', 'requirements', 'skills_required', 'category',
    'work_mode', 'experience_level', 'location', 'salary_min', 'salary_max', 'job_type',
]
_CANDIDATE_FIELDS = [
    'id', 'headline', 'bio', 'skills', 'cv_text',
    'location', 'experience_years', 'desired_salary_min', 'desired_salary_max',
    'desired_job_types', 'user__id', 'user__full_name',
]


def _build_job_corpus():
    """Fit a vectorizer over every active job's text. Returns (vectorizer, matrix, job_ids)."""
    from jobs.models import Job

    jobs = list(Job.objects.filter(is_active=True).only(*_JOB_FIELDS))
    if not jobs:
        return None, None, []

    job_ids = [job.id for job in jobs]
    job_texts = [clean_text(job.get_combined_text()) for job in jobs]

    vectorizer = TfidfVectorizer(ngram_range=(1, 2), stop_words='english', max_features=8000)
    matrix = _fit_transform(vectorizer, job_texts)
    return vectorizer, matrix, job_ids


def _get_job_corpus():
    """Return cached (vectorizer, matrix, job_ids), rebuilding on cache miss."""
    cached = cache.get(JOB_CORPUS_CACHE_KEY)
    if cached is not None:
        return cached['vectorizer'], cached['matrix'], cached['job_ids']

    vectorizer, matrix, job_ids = _build_job_corpus()
    if vectorizer is not None:
        cache.set(
            JOB_CORPUS_CACHE_KEY,
            {'vectorizer': vectorizer, 'matrix': matrix, 'job_ids': job_ids},
            CACHE_TTL,
        )
    return vectorizer, matrix, job_ids


def _build_candidate_corpus():
    """Fit a vectorizer over every open-to-work candidate's text. Returns (vectorizer, matrix, profile_ids)."""
    from accounts.models import CandidateProfile

    profiles = list(
        CandidateProfile.objects.filter(open_to_work=True)
        .select_related('user')
        .only(*_CANDIDATE_FIELDS)
    )
    if not profiles:
        return None, None, []

    profile_ids = [profile.id for profile in profiles]
    candidate_texts = [clean_text(p.get_skills_text()) for p in profiles]

    vectorizer = TfidfVectorizer(ngram_range=(1, 2), stop_words='english', max_features=8000)
    matrix = _fit_transform(vectorizer, candidate_texts)
    return vectorizer, matrix, profile_ids


def _get_candidate_corpus():
    """Return cached (vectorizer, matrix, profile_ids), rebuilding on cache miss."""
    cached = cache.get(CANDIDATE_CORPUS_CACHE_KEY)
    if cached is not None:
        return cached['vectorizer'], cached['matrix'], cached['profile_ids']

    vectorizer, matrix, profile_ids = _build_candidate_corpus()
    if vectorizer is not None:
        cache.set(
            CANDIDATE_CORPUS_CACHE_KEY,
            {'vectorizer': vectorizer, 'matrix': matrix, 'profile_ids': profile_ids},
            CACHE_TTL,
        )
    return vectorizer, matrix, profile_ids


# -- Public API ----------------------------------------------------------------

def compute_match_breakdown(candidate_user, job) -> dict:
    """
    Compute a full explainable match between one candidate and one job:
    {'score': float 0-100, 'matched_skills': [...], 'missing_skills': [...],
     'location_compatible': bool|None, 'experience_fit': str, 'salary_compatible': bool|None}

    Used on application submit and for explainability in serializers -- a
    tiny 2-document TF-IDF fit, cheap enough to run fresh every time.
    """
    try:
        profile = candidate_user.candidate_profile
        candidate_text = clean_text(profile.get_skills_text())
        job_text = clean_text(job.get_combined_text())

        text_sim = 0.0
        if candidate_text and job_text:
            vectorizer = TfidfVectorizer(ngram_range=(1, 2), stop_words='english', max_features=5000)
            matrix: csr_matrix = _fit_transform(vectorizer, [candidate_text, job_text])
            text_sim = float(cosine_similarity(matrix[0:1], matrix[1:2])[0][0])

        signals = _structured_signals(job, profile)
        score = _combine(text_sim, signals)
        return {
            'score': score,
            'matched_skills': signals['matched_skills'],
            'missing_skills': signals['missing_skills'],
            'location_compatible': signals['location_compatible'],
            'experience_fit': signals['experience_fit'],
            'job_type_compatible': signals['job_type_compatible'],
            'salary_compatible': signals['salary_compatible'],
        }
    except Exception:
        return {
            'score': 0.0, 'matched_skills': [], 'missing_skills': [],
            'location_compatible': None, 'experience_fit': 'unknown',
            'job_type_compatible': None, 'salary_compatible': None,
        }


def compute_match_score(candidate_user, job) -> float:
    """Compute just the 0-100 hybrid match score (used to populate Application.match_score)."""
    return compute_match_breakdown(candidate_user, job)['score']


def get_matched_jobs_for_candidate(
    candidate_user, top_n: int = 10, min_score: float = 10.0
) -> list[dict]:
    """
    Return a ranked list of jobs that best match a candidate's profile.
    Returns list of dicts: [{'job': <Job>, 'score': float, 'matched_skills': [...],
    'missing_skills': [...], 'location_compatible': bool|None,
    'experience_fit': str, 'salary_compatible': bool|None}]
    """
    from jobs.models import Job

    try:
        profile = candidate_user.candidate_profile
        candidate_text = clean_text(profile.get_skills_text())
        if not candidate_text:
            return []

        vectorizer, job_matrix, job_ids = _get_job_corpus()
        if vectorizer is None:
            return []

        candidate_vec: csr_matrix = csr_matrix(vectorizer.transform([candidate_text]))
        text_scores = cosine_similarity(candidate_vec, job_matrix)[0]

        # Cheap indexed lookup for the structured fields the cached corpus
        # doesn't carry -- see module docstring on why this isn't cached too.
        jobs_struct = {
            job.id: job
            for job in Job.objects.filter(id__in=job_ids, is_active=True).only(*_JOB_FIELDS)
        }

        ranked = []
        for idx, jid in enumerate(job_ids):
            job = jobs_struct.get(jid)
            if job is None:
                continue  # gone inactive since the corpus was cached
            signals = _structured_signals(job, profile)
            score = _combine(float(text_scores[idx]), signals)
            ranked.append((jid, score, signals))

        ranked.sort(key=lambda t: t[1], reverse=True)
        ranked = [r for r in ranked if r[1] >= min_score][:top_n]
        if not ranked:
            return []

        top_ids = [jid for jid, _, _ in ranked]
        info_by_id = {jid: (score, signals) for jid, score, signals in ranked}
        jobs_by_id = {
            job.id: job
            for job in Job.objects.filter(id__in=top_ids, is_active=True)
            .select_related('recruiter__recruiter_profile')
        }

        results = []
        for jid in top_ids:
            if jid not in jobs_by_id:
                continue
            score, signals = info_by_id[jid]
            results.append({
                'job': jobs_by_id[jid],
                'score': score,
                'matched_skills': signals['matched_skills'],
                'missing_skills': signals['missing_skills'],
                'location_compatible': signals['location_compatible'],
                'experience_fit': signals['experience_fit'],
                'job_type_compatible': signals['job_type_compatible'],
                'salary_compatible': signals['salary_compatible'],
            })
        return results
    except Exception:
        return []


def get_matched_candidates_for_job(
    job, top_n: int = 20, min_score: float = 15.0
) -> list[dict]:
    """
    Return ranked candidates that best match a job's requirements.
    Returns list of dicts: [{'profile': <CandidateProfile>, 'score': float,
    'matched_skills': [...], 'missing_skills': [...], 'location_compatible': bool|None,
    'experience_fit': str, 'salary_compatible': bool|None}]
    """
    from accounts.models import CandidateProfile

    try:
        job_text = clean_text(job.get_combined_text())
        if not job_text:
            return []

        vectorizer, candidate_matrix, profile_ids = _get_candidate_corpus()
        if vectorizer is None:
            return []

        job_vec: csr_matrix = csr_matrix(vectorizer.transform([job_text]))
        text_scores = cosine_similarity(job_vec, candidate_matrix)[0]

        profiles_struct = {
            profile.id: profile
            for profile in CandidateProfile.objects.filter(
                id__in=profile_ids, open_to_work=True
            ).select_related('user').only(*_CANDIDATE_FIELDS)
        }

        ranked = []
        for idx, pid in enumerate(profile_ids):
            profile = profiles_struct.get(pid)
            if profile is None:
                continue  # opted out of open_to_work since the corpus was cached
            signals = _structured_signals(job, profile)
            score = _combine(float(text_scores[idx]), signals)
            ranked.append((pid, score, signals))

        ranked.sort(key=lambda t: t[1], reverse=True)
        ranked = [r for r in ranked if r[1] >= min_score][:top_n]
        if not ranked:
            return []

        top_ids = [pid for pid, _, _ in ranked]
        info_by_id = {pid: (score, signals) for pid, score, signals in ranked}
        profiles_by_id = {
            profile.id: profile
            for profile in CandidateProfile.objects.filter(id__in=top_ids, open_to_work=True)
            .select_related('user')
        }

        results = []
        for pid in top_ids:
            if pid not in profiles_by_id:
                continue
            score, signals = info_by_id[pid]
            results.append({
                'profile': profiles_by_id[pid],
                'score': score,
                'matched_skills': signals['matched_skills'],
                'missing_skills': signals['missing_skills'],
                'location_compatible': signals['location_compatible'],
                'experience_fit': signals['experience_fit'],
                'job_type_compatible': signals['job_type_compatible'],
                'salary_compatible': signals['salary_compatible'],
            })
        return results
    except Exception:
        return []


def batch_score_applications(job) -> None:
    """Re-score all applications for a job. Call after updating job description."""
    from applications.models import Application

    applications = Application.objects.filter(job=job).select_related(
        'candidate__candidate_profile'
    )
    for application in applications:
        try:
            score = compute_match_score(application.candidate, job)
            application.match_score = score
            application.save(update_fields=['match_score'])
        except Exception:
            continue
