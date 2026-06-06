from unittest.mock import MagicMock, patch
from django.test import TestCase

from matching.engine import (
    clean_text,
    compute_match_score,
    get_matched_jobs_for_candidate,
    _fit_transform,
)
from sklearn.feature_extraction.text import TfidfVectorizer


class CleanTextTests(TestCase):
    def test_lowercases_text(self):
        self.assertEqual(clean_text('PYTHON DEVELOPER'), 'python developer')

    def test_removes_punctuation(self):
        self.assertEqual(clean_text('python, django!'), 'python  django ')

    def test_empty_string_returns_empty(self):
        self.assertEqual(clean_text(''), '')

    def test_none_returns_empty(self):
        self.assertEqual(clean_text(None), '')

    def test_collapses_whitespace(self):
        result = clean_text('python   django   react')
        self.assertNotIn('   ', result)


class ComputeMatchScoreTests(TestCase):
    def _make_profile(self, text):
        profile = MagicMock()
        profile.get_skills_text.return_value = text
        return profile

    def _make_user(self, text):
        user = MagicMock()
        user.candidate_profile = self._make_profile(text)
        return user

    def _make_job(self, text):
        job = MagicMock()
        job.get_combined_text.return_value = text
        return job

    def test_identical_text_scores_high(self):
        text = 'python django react javascript developer software engineer'
        user = self._make_user(text)
        job = self._make_job(text)
        score = compute_match_score(user, job)
        self.assertGreater(score, 80)

    def test_completely_unrelated_text_scores_low(self):
        user = self._make_user('python backend developer django rest api')
        job = self._make_job('chef cook restaurant kitchen food catering')
        score = compute_match_score(user, job)
        self.assertLess(score, 20)

    def test_empty_candidate_profile_returns_zero(self):
        user = self._make_user('')
        job = self._make_job('python django developer')
        score = compute_match_score(user, job)
        self.assertEqual(score, 0.0)

    def test_empty_job_description_returns_zero(self):
        user = self._make_user('python django developer')
        job = self._make_job('')
        score = compute_match_score(user, job)
        self.assertEqual(score, 0.0)

    def test_returns_float(self):
        user = self._make_user('python developer')
        job = self._make_job('python engineer')
        score = compute_match_score(user, job)
        self.assertIsInstance(score, float)

    def test_score_between_0_and_100(self):
        user = self._make_user('react frontend developer javascript html css')
        job = self._make_job('react engineer frontend html css javascript')
        score = compute_match_score(user, job)
        self.assertGreaterEqual(score, 0.0)
        self.assertLessEqual(score, 100.0)

    def test_partial_match_scores_between_extremes(self):
        user = self._make_user('python django developer backend api')
        job = self._make_job('python developer frontend react html')
        score = compute_match_score(user, job)
        self.assertGreater(score, 0.0)
        self.assertLess(score, 100.0)

    def test_exception_returns_zero(self):
        """Any unexpected error should return 0 rather than crash."""
        user = MagicMock()
        user.candidate_profile.get_skills_text.side_effect = Exception('DB error')
        job = self._make_job('python developer')
        score = compute_match_score(user, job)
        self.assertEqual(score, 0.0)


class FitTransformTests(TestCase):
    def test_returns_csr_matrix(self):
        from scipy.sparse import csr_matrix
        vectorizer = TfidfVectorizer()
        result = _fit_transform(vectorizer, ['hello world', 'foo bar baz'])
        self.assertIsInstance(result, csr_matrix)

    def test_shape_matches_corpus(self):
        vectorizer = TfidfVectorizer()
        corpus = ['doc one', 'doc two', 'doc three']
        matrix = _fit_transform(vectorizer, corpus)
        self.assertEqual(matrix.shape[0], 3)
