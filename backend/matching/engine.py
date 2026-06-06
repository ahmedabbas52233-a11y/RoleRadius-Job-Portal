"""
RoleRadius ML Matching Engine
Uses TF-IDF + Cosine Similarity to match candidates to jobs and vice versa.

The scipy CSR matrix returned by TfidfVectorizer DOES support __getitem__
slicing at runtime, but Pylance's stubs type it as the base spmatrix class
which lacks the definition. We cast explicitly to csr_matrix so both the
type-checker and runtime are happy.
"""
from __future__ import annotations

import re

import numpy as np
from scipy.sparse import csr_matrix
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity


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


def compute_match_score(candidate_user, job) -> float:
    """
    Compute a 0-100 match score between a candidate and a job.
    Returns float between 0 and 100.
    """
    try:
        profile = candidate_user.candidate_profile
        candidate_text = clean_text(profile.get_skills_text())
        job_text = clean_text(job.get_combined_text())

        if not candidate_text or not job_text:
            return 0.0

        vectorizer = TfidfVectorizer(
            ngram_range=(1, 2), stop_words="english", max_features=5000
        )
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
    """
    from jobs.models import Job

    try:
        profile = candidate_user.candidate_profile
        candidate_text = clean_text(profile.get_skills_text())
        if not candidate_text:
            return []

        active_jobs = list(Job.objects.filter(is_active=True))
        if not active_jobs:
            return []

        job_texts = [clean_text(job.get_combined_text()) for job in active_jobs]
        corpus = [candidate_text] + job_texts

        vectorizer = TfidfVectorizer(
            ngram_range=(1, 2), stop_words="english", max_features=8000
        )
        matrix: csr_matrix = _fit_transform(vectorizer, corpus)

        candidate_vec: csr_matrix = matrix[0:1]
        job_vecs: csr_matrix = matrix[1:]
        scores = cosine_similarity(candidate_vec, job_vecs)[0]

        results = []
        for idx, score in enumerate(scores):
            pct = round(float(score) * 100, 2)
            if pct >= min_score:
                results.append({"job": active_jobs[idx], "score": pct})

        results.sort(key=lambda x: x["score"], reverse=True)
        return results[:top_n]
    except Exception:
        return []


def get_matched_candidates_for_job(
    job, top_n: int = 20, min_score: float = 15.0
) -> list[dict]:
    """
    Return ranked candidates that best match a job's requirements.
    Returns list of dicts: [{'profile': <CandidateProfile>, 'score': float}]
    """
    from accounts.models import CandidateProfile

    try:
        job_text = clean_text(job.get_combined_text())
        if not job_text:
            return []

        profiles = list(
            CandidateProfile.objects.filter(open_to_work=True).select_related("user")
        )
        if not profiles:
            return []

        candidate_texts = [clean_text(p.get_skills_text()) for p in profiles]
        corpus = [job_text] + candidate_texts

        vectorizer = TfidfVectorizer(
            ngram_range=(1, 2), stop_words="english", max_features=8000
        )
        matrix: csr_matrix = _fit_transform(vectorizer, corpus)

        job_vec: csr_matrix = matrix[0:1]
        candidate_vecs: csr_matrix = matrix[1:]
        scores = cosine_similarity(job_vec, candidate_vecs)[0]

        results = []
        for idx, score in enumerate(scores):
            pct = round(float(score) * 100, 2)
            if pct >= min_score:
                results.append({"profile": profiles[idx], "score": pct})

        results.sort(key=lambda x: x["score"], reverse=True)
        return results[:top_n]
    except Exception:
        return []


def batch_score_applications(job) -> None:
    """Re-score all applications for a job. Call after updating job description."""
    from applications.models import Application

    applications = Application.objects.filter(job=job).select_related(
        "candidate__candidate_profile"
    )
    for application in applications:
        try:
            score = compute_match_score(application.candidate, job)
            application.match_score = score
            application.save(update_fields=["match_score"])
        except Exception:
            continue
