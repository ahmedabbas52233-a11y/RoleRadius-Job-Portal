from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from accounts.models import User, CandidateProfile, RecruiterProfile
from jobs.models import Job, SavedJob


def make_candidate(email='cand@test.com'):
    u = User.objects.create_user(email=email, full_name='Cand', password='pass123', role=User.CANDIDATE)
    CandidateProfile.objects.create(user=u)
    return u


def make_recruiter(email='rec@test.com', company='Acme'):
    u = User.objects.create_user(email=email, full_name='Rec', password='pass123', role=User.RECRUITER)
    RecruiterProfile.objects.create(user=u, company_name=company)
    return u


def make_job(recruiter, **kwargs):
    defaults = {
        'title': 'Software Engineer',
        'description': 'Build great software',
        'requirements': '3 years experience with Python',
        'skills_required': ['Python', 'Django'],
        'location': 'London, UK',
        'job_type': Job.FULL_TIME,
        'experience_level': Job.MID,
        'work_mode': Job.REMOTE,
        'company_name': 'Acme',
    }
    defaults.update(kwargs)
    return Job.objects.create(recruiter=recruiter, **defaults)


class JobListTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.recruiter = make_recruiter()
        self.job = make_job(self.recruiter)

    def test_job_list_is_public(self):
        res = self.client.get(reverse('job_list'))
        self.assertEqual(res.status_code, status.HTTP_200_OK)

    def test_inactive_jobs_hidden_from_list(self):
        self.job.is_active = False
        self.job.save()
        res = self.client.get(reverse('job_list'))
        self.assertEqual(res.data['count'], 0)

    def test_search_by_title(self):
        make_job(self.recruiter, title='Data Scientist', description='ML stuff', requirements='ML exp')
        res = self.client.get(reverse('job_list'), {'search': 'Data Scientist'})
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        titles = [j['title'] for j in res.data['results']]
        self.assertIn('Data Scientist', titles)

    def test_filter_by_work_mode(self):
        make_job(self.recruiter, title='Onsite Job', work_mode=Job.ONSITE)
        res = self.client.get(reverse('job_list'), {'work_mode': 'remote'})
        for job in res.data['results']:
            self.assertEqual(job['work_mode'], 'remote')

    def test_job_detail_increments_view_count(self):
        initial_views = self.job.views_count
        self.client.get(reverse('job_detail', kwargs={'pk': self.job.pk}))
        self.job.refresh_from_db()
        self.assertEqual(self.job.views_count, initial_views + 1)


class JobCreateTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.recruiter = make_recruiter()
        self.candidate = make_candidate()
        self.url = reverse('job_create')
        self.payload = {
    'title': 'New Role',
    'description': 'Great role',
    'requirements': 'Some exp',
    'skills_required': ['React'],
    'location': 'London',
    'job_type': 'full_time',
    'experience_level': 'mid',
    'work_mode': 'remote',
    'company_name': 'Acme', 
}

    def test_recruiter_can_create_job(self):
        self.client.force_authenticate(user=self.recruiter)
        res = self.client.post(self.url, self.payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res.data['title'], 'New Role')

    def test_candidate_cannot_create_job(self):
        self.client.force_authenticate(user=self.candidate)
        res = self.client.post(self.url, self.payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    def test_anonymous_cannot_create_job(self):
        res = self.client.post(self.url, self.payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)


class JobUpdateDeleteTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.recruiter = make_recruiter()
        self.other_recruiter = make_recruiter(email='other@test.com', company='Other')
        self.job = make_job(self.recruiter)

    def test_recruiter_can_update_own_job(self):
        self.client.force_authenticate(user=self.recruiter)
        res = self.client.patch(
            reverse('job_update', kwargs={'pk': self.job.pk}),
            {'title': 'Updated Title'}, format='json'
        )
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['title'], 'Updated Title')

    def test_recruiter_cannot_update_others_job(self):
        self.client.force_authenticate(user=self.other_recruiter)
        res = self.client.patch(
            reverse('job_update', kwargs={'pk': self.job.pk}),
            {'title': 'Hacked'}, format='json'
        )
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)

    def test_toggle_job_active_status(self):
        self.client.force_authenticate(user=self.recruiter)
        res = self.client.post(reverse('job_toggle', kwargs={'pk': self.job.pk}))
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertFalse(res.data['is_active'])


class SaveJobTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.candidate = make_candidate()
        self.recruiter = make_recruiter()
        self.job = make_job(self.recruiter)

    def test_candidate_can_save_job(self):
        self.client.force_authenticate(user=self.candidate)
        res = self.client.post(reverse('save_job', kwargs={'pk': self.job.pk}))
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertTrue(res.data['saved'])
        self.assertTrue(SavedJob.objects.filter(candidate=self.candidate, job=self.job).exists())

    def test_save_twice_unsaves(self):
        self.client.force_authenticate(user=self.candidate)
        self.client.post(reverse('save_job', kwargs={'pk': self.job.pk}))
        res = self.client.post(reverse('save_job', kwargs={'pk': self.job.pk}))
        self.assertFalse(res.data['saved'])

    def test_recruiter_cannot_save_job(self):
        self.client.force_authenticate(user=self.recruiter)
        res = self.client.post(reverse('save_job', kwargs={'pk': self.job.pk}))
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)
