from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from accounts.models import User, CandidateProfile, RecruiterProfile
from applications.models import Application, ApplicationStatusHistory
from jobs.models import Job


def make_candidate(email='cand@test.com'):
    u = User.objects.create_user(email=email, full_name='Cand', password='pass', role=User.CANDIDATE)
    CandidateProfile.objects.create(user=u)
    return u


def make_recruiter(email='rec@test.com'):
    u = User.objects.create_user(email=email, full_name='Rec', password='pass', role=User.RECRUITER)
    RecruiterProfile.objects.create(user=u, company_name='Acme')
    return u


def make_job(recruiter):
    return Job.objects.create(
        recruiter=recruiter, title='Dev', description='Build stuff',
        requirements='Some exp', skills_required=['Python'],
        location='London', job_type=Job.FULL_TIME,
        experience_level=Job.MID, work_mode=Job.REMOTE,
        company_name='Acme',
    )


def make_application(candidate, job, status_val=Application.PENDING):
    app = Application.objects.create(job=job, candidate=candidate, status=status_val)
    return app


class ApplyToJobTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.candidate = make_candidate()
        self.recruiter = make_recruiter()
        self.job = make_job(self.recruiter)

    def test_candidate_can_apply(self):
        self.client.force_authenticate(user=self.candidate)
        res = self.client.post(
            reverse('apply_to_job', kwargs={'job_id': self.job.pk}),
            {'cover_letter': 'I am great!'}, format='json'
        )
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertTrue(Application.objects.filter(candidate=self.candidate, job=self.job).exists())

    def test_cannot_apply_twice(self):
        self.client.force_authenticate(user=self.candidate)
        url = reverse('apply_to_job', kwargs={'job_id': self.job.pk})
        self.client.post(url, {}, format='json')
        res = self.client.post(url, {}, format='json')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_recruiter_cannot_apply(self):
        self.client.force_authenticate(user=self.recruiter)
        res = self.client.post(
            reverse('apply_to_job', kwargs={'job_id': self.job.pk}), {}, format='json'
        )
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    def test_anonymous_cannot_apply(self):
        res = self.client.post(
            reverse('apply_to_job', kwargs={'job_id': self.job.pk}), {}, format='json'
        )
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_apply_creates_history_entry(self):
        self.client.force_authenticate(user=self.candidate)
        self.client.post(
            reverse('apply_to_job', kwargs={'job_id': self.job.pk}), {}, format='json'
        )
        app = Application.objects.get(candidate=self.candidate, job=self.job)
        self.assertTrue(ApplicationStatusHistory.objects.filter(application=app).exists())


class WithdrawApplicationTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.candidate = make_candidate()
        self.recruiter = make_recruiter()
        self.job = make_job(self.recruiter)
        self.app = make_application(self.candidate, self.job)

    def test_candidate_can_withdraw_pending_application(self):
        self.client.force_authenticate(user=self.candidate)
        res = self.client.post(reverse('withdraw_application', kwargs={'pk': self.app.pk}))
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.app.refresh_from_db()
        self.assertEqual(self.app.status, Application.WITHDRAWN)

    def test_cannot_withdraw_rejected_application(self):
        self.app.status = Application.REJECTED
        self.app.save()
        self.client.force_authenticate(user=self.candidate)
        res = self.client.post(reverse('withdraw_application', kwargs={'pk': self.app.pk}))
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_other_candidate_cannot_withdraw(self):
        other = make_candidate(email='other@test.com')
        self.client.force_authenticate(user=other)
        res = self.client.post(reverse('withdraw_application', kwargs={'pk': self.app.pk}))
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)


class RecruiterUpdateStatusTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.candidate = make_candidate()
        self.recruiter = make_recruiter()
        self.job = make_job(self.recruiter)
        self.app = make_application(self.candidate, self.job)

    def test_recruiter_can_update_status(self):
        self.client.force_authenticate(user=self.recruiter)
        res = self.client.patch(
            reverse('update_status', kwargs={'pk': self.app.pk}),
            {'status': 'shortlisted'}, format='json'
        )
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.app.refresh_from_db()
        self.assertEqual(self.app.status, Application.SHORTLISTED)

    def test_status_update_creates_history_entry(self):
        self.client.force_authenticate(user=self.recruiter)
        self.client.patch(
            reverse('update_status', kwargs={'pk': self.app.pk}),
            {'status': 'interview'}, format='json'
        )
        history = ApplicationStatusHistory.objects.filter(
            application=self.app, to_status='interview'
        )
        self.assertTrue(history.exists())

    def test_other_recruiter_cannot_update_status(self):
        other_recruiter = make_recruiter(email='other_rec@test.com')
        self.client.force_authenticate(user=other_recruiter)
        res = self.client.patch(
            reverse('update_status', kwargs={'pk': self.app.pk}),
            {'status': 'shortlisted'}, format='json'
        )
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)


class DashboardStatsTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.candidate = make_candidate()
        self.recruiter = make_recruiter()
        self.job = make_job(self.recruiter)

    def test_candidate_stats_endpoint(self):
        make_application(self.candidate, self.job)
        self.client.force_authenticate(user=self.candidate)
        res = self.client.get(reverse('candidate_stats'))
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIn('total_applications', res.data)
        self.assertEqual(res.data['total_applications'], 1)

    def test_recruiter_stats_endpoint(self):
        make_application(self.candidate, self.job)
        self.client.force_authenticate(user=self.recruiter)
        res = self.client.get(reverse('recruiter_stats'))
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIn('total_applications', res.data)

    def test_candidate_cannot_access_recruiter_stats(self):
        self.client.force_authenticate(user=self.candidate)
        res = self.client.get(reverse('recruiter_stats'))
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)
