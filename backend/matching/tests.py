"""
Matching engine tests.

NOTE on the MagicMock-based ComputeMatchScoreTests below: since
compute_match_score/compute_match_breakdown now also read structured
fields (skills, location, experience_years, salary), the fixtures give
those fields deliberately *neutral* values (empty lists / blank strings /
None) so each test isolates the text-similarity component. With every
structured signal neutral (0.5), the achievable score range collapses to
roughly 30%-70% (see WEIGHTS) -- the assertions below reflect that
range rather than the old 0-100 range a pure-text engine had.
"""
from unittest.mock import MagicMock
from django.test import TestCase

from matching.engine import (
    clean_text,
    compute_match_score,
    compute_match_breakdown,
    get_matched_jobs_for_candidate,
    get_matched_candidates_for_job,
    _fit_transform,
    _skills_overlap,
    _location_compatibility,
    _salary_compatibility,
    _job_type_compatibility,
    _experience_fit,
    _years_to_band,
    WEIGHTS,
)
from sklearn.feature_extraction.text import TfidfVectorizer

from accounts.models import User, CandidateProfile, RecruiterProfile
from jobs.models import Job


class CleanTextTests(TestCase):
    def test_lowercases_text(self):
        self.assertEqual(clean_text('PYTHON DEVELOPER'), 'python developer')

    def test_removes_punctuation(self):
        self.assertEqual(clean_text('python, django!'), 'python django')

    def test_empty_string_returns_empty(self):
        self.assertEqual(clean_text(''), '')

    def test_none_returns_empty(self):
        self.assertEqual(clean_text(None), '')

    def test_collapses_whitespace(self):
        result = clean_text('python   django   react')
        self.assertNotIn('   ', result)


class WeightsTests(TestCase):
    def test_weights_sum_to_one(self):
        self.assertAlmostEqual(sum(WEIGHTS.values()), 1.0, places=6)


class SkillsOverlapTests(TestCase):
    def test_no_required_skills_is_neutral(self):
        score, matched, missing = _skills_overlap([], ['Python'])
        self.assertEqual(score, 0.5)
        self.assertEqual(matched, [])
        self.assertEqual(missing, [])

    def test_full_overlap(self):
        score, matched, missing = _skills_overlap(['Python', 'Django'], ['python', 'django', 'react'])
        self.assertEqual(score, 1.0)
        self.assertEqual(set(matched), {'Python', 'Django'})
        self.assertEqual(missing, [])

    def test_partial_overlap(self):
        score, matched, missing = _skills_overlap(['Python', 'Django', 'AWS'], ['Python'])
        self.assertAlmostEqual(score, 1 / 3)
        self.assertEqual(matched, ['Python'])
        self.assertEqual(set(missing), {'Django', 'AWS'})

    def test_zero_overlap(self):
        score, matched, missing = _skills_overlap(['Python'], ['Excel'])
        self.assertEqual(score, 0.0)
        self.assertEqual(matched, [])
        self.assertEqual(missing, ['Python'])

    def test_case_insensitive(self):
        score, matched, missing = _skills_overlap(['PYTHON'], ['python']) 
        self.assertEqual(score, 1.0)


class LocationCompatibilityTests(TestCase):
    def test_remote_job_always_compatible(self):
        score, compat = _location_compatibility('London, UK', 'remote', 'Manchester, UK')
        self.assertEqual((score, compat), (1.0, True))

    def test_missing_location_is_unknown(self):
        score, compat = _location_compatibility('', 'onsite', '')
        self.assertEqual(score, 0.5)
        self.assertIsNone(compat)

    def test_matching_city_compatible(self):
        score, compat = _location_compatibility('London, UK', 'onsite', 'London, UK')
        self.assertEqual((score, compat), (1.0, True))

    def test_different_city_incompatible(self):
        score, compat = _location_compatibility('London, UK', 'onsite', 'Manchester, UK')
        self.assertEqual((score, compat), (0.0, False))


class SalaryCompatibilityTests(TestCase):
    def test_missing_job_salary_is_unknown(self):
        score, compat = _salary_compatibility(None, None, 50000, 60000)
        self.assertEqual(score, 0.5)
        self.assertIsNone(compat)

    def test_missing_candidate_salary_is_unknown(self):
        score, compat = _salary_compatibility(50000, 60000, None, None)
        self.assertEqual(score, 0.5)
        self.assertIsNone(compat)

    def test_overlapping_ranges_compatible(self):
        score, compat = _salary_compatibility(50000, 70000, 60000, 80000)
        self.assertEqual((score, compat), (1.0, True))

    def test_non_overlapping_ranges_incompatible(self):
        score, compat = _salary_compatibility(30000, 40000, 80000, 100000)
        self.assertEqual((score, compat), (0.2, False))


class JobTypeCompatibilityTests(TestCase):
    def test_no_stated_preference_is_neutral(self):
        score, compat = _job_type_compatibility('full_time', [])
        self.assertEqual(score, 0.5)
        self.assertIsNone(compat)

    def test_job_type_in_preferences_is_compatible(self):
        score, compat = _job_type_compatibility('contract', ['full_time', 'contract'])
        self.assertEqual((score, compat), (1.0, True))

    def test_job_type_not_in_preferences_is_incompatible(self):
        score, compat = _job_type_compatibility('internship', ['full_time'])
        self.assertEqual((score, compat), (0.0, False))

    def test_non_list_preferences_treated_as_no_preference(self):
        """Defensive: a malformed non-list value shouldn't crash, just falls back to neutral."""
        score, compat = _job_type_compatibility('full_time', None)
        self.assertEqual(score, 0.5)
        self.assertIsNone(compat)


class ExperienceFitTests(TestCase):
    def test_years_to_band(self):
        self.assertEqual(_years_to_band(1), 'entry')
        self.assertEqual(_years_to_band(3), 'mid')
        self.assertEqual(_years_to_band(6), 'senior')
        self.assertEqual(_years_to_band(10), 'lead')
        self.assertEqual(_years_to_band(20), 'executive')
        self.assertIsNone(_years_to_band(None))

    def test_exact_band_match_is_good_fit(self):
        score, label = _experience_fit('mid', 3)
        self.assertEqual(score, 1.0)
        self.assertEqual(label, 'good fit')

    def test_far_under_qualified(self):
        score, label = _experience_fit('executive', 1)
        self.assertEqual(label, 'under-qualified')

    def test_far_over_qualified(self):
        score, label = _experience_fit('entry', 20)
        self.assertEqual(label, 'over-qualified')

    def test_missing_years_is_unknown(self):
        score, label = _experience_fit('mid', None)
        self.assertEqual(score, 0.5)
        self.assertEqual(label, 'unknown')


class ComputeMatchScoreTests(TestCase):
    """Isolate the text-similarity component by keeping structured fields neutral (see module docstring)."""

    def _make_profile(self, text):
        profile = MagicMock()
        profile.get_skills_text.return_value = text
        profile.skills = []
        profile.location = ''
        profile.experience_years = None
        profile.desired_salary_min = None
        profile.desired_salary_max = None
        profile.desired_job_types = []
        return profile

    def _make_user(self, text):
        user = MagicMock()
        user.candidate_profile = self._make_profile(text)
        return user

    def _make_job(self, text):
        job = MagicMock()
        job.get_combined_text.return_value = text
        job.skills_required = []
        job.location = ''
        job.work_mode = 'onsite'
        job.experience_level = ''
        job.salary_min = None
        job.salary_max = None
        job.job_type = 'full_time'
        return job

    def test_identical_text_scores_high(self):
        text = 'python django react javascript developer software engineer'
        user = self._make_user(text)
        job = self._make_job(text)
        score = compute_match_score(user, job)
        self.assertGreater(score, 65)  # ceiling with neutral structured data is 70

    def test_completely_unrelated_text_scores_low(self):
        user = self._make_user('python backend developer django rest api')
        job = self._make_job('chef cook restaurant kitchen food catering')
        score = compute_match_score(user, job)
        self.assertLess(score, 35)  # floor with neutral structured data is 30

    def test_empty_candidate_profile_scores_at_neutral_floor(self):
        """No text on either side means zero text contribution; structured
        signals are still neutral, so the score sits at the 30 floor
        rather than collapsing to a hard zero."""
        user = self._make_user('')
        job = self._make_job('python django developer')
        score = compute_match_score(user, job)
        self.assertAlmostEqual(score, 30.0, delta=0.5)

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
        self.assertGreater(score, 30.0)
        self.assertLess(score, 70.0)

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


class EndToEndHybridMatchTests(TestCase):
    """Exercise the full hybrid pipeline against real (saved) model instances."""

    def setUp(self):
        self.recruiter = User.objects.create_user(
            email='rec@hybrid.test', password='testpass123',
            full_name='Recruiter', role=User.RECRUITER,
        )
        RecruiterProfile.objects.create(user=self.recruiter, company_name='HybridCo')

        self.candidate = User.objects.create_user(
            email='cand@hybrid.test', password='testpass123',
            full_name='Candidate', role=User.CANDIDATE,
        )
        self.profile = CandidateProfile.objects.create(
            user=self.candidate,
            headline='Backend Developer',
            bio='Experienced backend engineer.',
            skills=['Python', 'Django', 'PostgreSQL'],
            location='London, UK',
            experience_years=4,
            desired_salary_min=55000,
            desired_salary_max=70000,
            desired_job_types=['full_time'],
            open_to_work=True,
        )

    def _make_job(self, **overrides):
        defaults = dict(
            recruiter=self.recruiter, title='Backend Engineer', company_name='HybridCo',
            description='Build APIs with Python and Django.',
            requirements='Python, Django, PostgreSQL',
            skills_required=['Python', 'Django', 'PostgreSQL'],
            work_mode='onsite', experience_level='mid', location='London, UK',
            salary_min=55000, salary_max=75000, job_type='full_time',
        )
        defaults.update(overrides)
        return Job.objects.create(**defaults)

    def test_strong_match_reports_full_explainability(self):
        job = self._make_job()
        breakdown = compute_match_breakdown(self.candidate, job)
        self.assertGreater(breakdown['score'], 70)
        self.assertEqual(set(breakdown['matched_skills']), {'Python', 'Django', 'PostgreSQL'})
        self.assertEqual(breakdown['missing_skills'], [])
        self.assertTrue(breakdown['location_compatible'])
        self.assertEqual(breakdown['experience_fit'], 'good fit')
        self.assertTrue(breakdown['job_type_compatible'])
        self.assertTrue(breakdown['salary_compatible'])

    def test_remote_job_ignores_location_mismatch(self):
        job = self._make_job(work_mode='remote', location='Remote (UK)')
        breakdown = compute_match_breakdown(self.candidate, job)
        self.assertTrue(breakdown['location_compatible'])

    def test_onsite_job_in_different_city_flagged_incompatible(self):
        job = self._make_job(location='Manchester, UK')
        breakdown = compute_match_breakdown(self.candidate, job)
        self.assertFalse(breakdown['location_compatible'])

    def test_seniority_mismatch_flagged(self):
        job = self._make_job(experience_level='executive')
        breakdown = compute_match_breakdown(self.candidate, job)
        self.assertIn('under-qualified', breakdown['experience_fit'])

    def test_job_type_mismatch_flagged(self):
        """Candidate only wants full-time; a contract role should be flagged incompatible."""
        job = self._make_job(job_type='contract')
        breakdown = compute_match_breakdown(self.candidate, job)
        self.assertFalse(breakdown['job_type_compatible'])

    def test_job_type_unstated_preference_is_neutral(self):
        """A candidate who never set a job-type preference shouldn't be penalized either way."""
        self.profile.desired_job_types = []
        self.profile.save()
        job = self._make_job(job_type='contract')
        breakdown = compute_match_breakdown(self.candidate, job)
        self.assertIsNone(breakdown['job_type_compatible'])

    def test_get_matched_jobs_for_candidate_includes_breakdown_fields(self):
        from matching.engine import invalidate_job_corpus_cache
        self._make_job()
        invalidate_job_corpus_cache()
        results = get_matched_jobs_for_candidate(self.candidate, top_n=5, min_score=0)
        self.assertEqual(len(results), 1)
        self.assertIn('matched_skills', results[0])
        self.assertIn('location_compatible', results[0])
        self.assertIn('experience_fit', results[0])
        self.assertIn('job_type_compatible', results[0])

    def test_get_matched_candidates_for_job_includes_breakdown_fields(self):
        from matching.engine import invalidate_candidate_corpus_cache
        job = self._make_job()
        invalidate_candidate_corpus_cache()
        results = get_matched_candidates_for_job(job, top_n=5, min_score=0)
        self.assertEqual(len(results), 1)
        self.assertIn('matched_skills', results[0])
        self.assertIn('location_compatible', results[0])
        self.assertIn('job_type_compatible', results[0])
