"""
RoleRadius ML Matching Engine
Uses TF-IDF + Cosine Similarity to match candidates to jobs and vice versa.

Performance design
-------------------
Fitting a TfidfVectorizer is O(N) over the corpus and was previously repeated
on every single request to /api/matching/jobs/ and /api/matching/candidates/.
That meant every dashboard load re-read every active job (or every open-to-work
candidate) from the DB and re-fit a fresh vectorizer from scratch — wasted work,
since the job corpus and candidate corpus only change when someone posts a job
or edits their profile, not on every page view.

Both corpora are now cached (Django's cache framework — LocMemCache by default,
swaps to Redis automatically if REDIS_URL is set, see settings.py CACHES).
Only IDs + sparse vectors are cached, never live Django model instances, so the
cache stays cheap to store and safe to pickle under both backends. The actual
Job / CandidateProfile rows are re-fetched fresh from the DB by ID after the
top-N match has been computed, so results are never stale even if the cached
matrix is a few minutes old — the worst case is a newly-posted job not yet
appearing as a candidate's top match for up to CACHE_TTL seconds, not incorrect
data being served.

Cache invalidation is signal-driven (see jobs/signals.py, accounts/signals.py)
so in practice the cache is almost always fresh; the TTL below is just a safety
net in case a signal is ever missed.
"""
from __future__ import annotations

import re

from django.core.cache import cache
from scipy.sparse import csr_matrix
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

CACHE_TTL = 600  # 10 minutes — safety net on top of signal-driven invalidation
JOB_CORPUS_CACHE_KEY = 'matching:job_corpus:v1'
CANDIDATE_CORPUS_CACHE_KEY = 'matching:candidate_corpus:v1'


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


def _build_job_corpus():
    """Fit a vectorizer over every active job's text. Returns (vectorizer, matrix, job_ids)."""
    from jobs.models import Job

    jobs = list(
        Job.objects.filter(is_active=True)
        .only('id', 'title', 'description', 'requirements', 'skills_required', 'category')
    )
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
        .only('id', 'headline', 'bio', 'skills', 'cv_text', 'user__id', 'user__full_name')
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


def compute_match_score(candidate_user, job) -> float:
    """
    Compute a 0-100 match score between a single candidate and a single job.
    Used on application submit — a tiny 2-document fit, cheap enough to run
    fresh every time and not worth caching.
    """
    try:
        profile = candidate_user.candidate_profile
        candidate_text = clean_text(profile.get_skills_text())
        job_text = clean_text(job.get_combined_text())

        if not candidate_text or not job_text:
            return 0.0

        vectorizer = TfidfVectorizer(ngram_range=(1, 2), stop_words='english', max_features=5000)
        matrix: csr_matrix = _fit_transform(vectorizer, [candidate_text, job_text])

        score = cosine_similarity(matrix[0:1], matrix[1:2])[0][0]
        return round(float(score) * 100, 2)
    except Exception:
        return 0.0


def get_matched_jobs_for_candidate(
    candidate_user, top_n: int = 10, min_score: float = 10.0
) -> list[dict]:
    """
    Return a ranked list of jobs that best match a candidate's profile.
    Returns list of dicts: [{'job': <Job>, 'score': float}]

    The job corpus (vectorizer + matrix) is cached and shared across every
    candidate's request — only the candidate's own text is transformed fresh
    each call via vectorizer.transform(), which is O(1) relative to the
    corpus size (no re-fit).
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
        scores = cosine_similarity(candidate_vec, job_matrix)[0]

        ranked = sorted(
            ((job_ids[idx], round(float(score) * 100, 2)) for idx, score in enumerate(scores)),
            key=lambda pair: pair[1],
            reverse=True,
        )
        ranked = [(jid, score) for jid, score in ranked if score >= min_score][:top_n]
        if not ranked:
            return []

        top_ids = [jid for jid, _ in ranked]
        score_by_id = dict(ranked)
        jobs_by_id = {
            job.id: job
            for job in Job.objects.filter(id__in=top_ids, is_active=True)
            .select_related('recruiter__recruiter_profile')
        }

        results = [
            {'job': jobs_by_id[jid], 'score': score_by_id[jid]}
            for jid in top_ids
            if jid in jobs_by_id
        ]
        return results
    except Exception:
        return []


def get_matched_candidates_for_job(
    job, top_n: int = 20, min_score: float = 15.0
) -> list[dict]:
    """
    Return ranked candidates that best match a job's requirements.
    Returns list of dicts: [{'profile': <CandidateProfile>, 'score': float}]

    The candidate corpus is cached and shared across every job's request —
    only the job's own text is transformed fresh each call.
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
        scores = cosine_similarity(job_vec, candidate_matrix)[0]

        ranked = sorted(
            ((profile_ids[idx], round(float(score) * 100, 2)) for idx, score in enumerate(scores)),
            key=lambda pair: pair[1],
            reverse=True,
        )
        ranked = [(pid, score) for pid, score in ranked if score >= min_score][:top_n]
        if not ranked:
            return []

        top_ids = [pid for pid, _ in ranked]
        score_by_id = dict(ranked)
        profiles_by_id = {
            profile.id: profile
            for profile in CandidateProfile.objects.filter(id__in=top_ids, open_to_work=True)
            .select_related('user')
        }

        results = [
            {'profile': profiles_by_id[pid], 'score': score_by_id[pid]}
            for pid in top_ids
            if pid in profiles_by_id
        ]
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
