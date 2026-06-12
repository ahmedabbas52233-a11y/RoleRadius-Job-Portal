from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from accounts.models import User, CandidateProfile, RecruiterProfile, PasswordResetToken


def make_candidate(email='candidate@test.com', password='testpass123'):
    user = User.objects.create_user(
        email=email, full_name='Test Candidate',
        password=password, role=User.CANDIDATE
    )
    CandidateProfile.objects.create(user=user)
    return user


def make_recruiter(email='recruiter@test.com', password='testpass123', company='Acme'):
    user = User.objects.create_user(
        email=email, full_name='Test Recruiter',
        password=password, role=User.RECRUITER
    )
    RecruiterProfile.objects.create(user=user, company_name=company)
    return user


class RegistrationTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.url = reverse('register')

    def test_candidate_registration_returns_tokens(self):
        data = {
            'email': 'new@test.com', 'full_name': 'New User',
            'password': 'testpass123', 'confirm_password': 'testpass123',
            'role': 'candidate',
        }
        res = self.client.post(self.url, data)
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertIn('access', res.data)
        self.assertIn('refresh', res.data)

    def test_candidate_registration_creates_profile(self):
        data = {
            'email': 'cand2@test.com', 'full_name': 'Cand Two',
            'password': 'testpass123', 'confirm_password': 'testpass123',
            'role': 'candidate',
        }
        self.client.post(self.url, data)
        user = User.objects.get(email='cand2@test.com')
        self.assertTrue(CandidateProfile.objects.filter(user=user).exists())

    def test_recruiter_registration_requires_company_name(self):
        data = {
            'email': 'rec@test.com', 'full_name': 'Recruiter',
            'password': 'testpass123', 'confirm_password': 'testpass123',
            'role': 'recruiter',
            # company_name intentionally omitted
        }
        res = self.client.post(self.url, data)
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_recruiter_registration_with_company_creates_profile(self):
        data = {
            'email': 'rec2@test.com', 'full_name': 'Recruiter Two',
            'password': 'testpass123', 'confirm_password': 'testpass123',
            'role': 'recruiter', 'company_name': 'Acme Corp',
        }
        res = self.client.post(self.url, data)
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        user = User.objects.get(email='rec2@test.com')
        self.assertTrue(RecruiterProfile.objects.filter(user=user).exists())

    def test_mismatched_passwords_rejected(self):
        data = {
            'email': 'x@test.com', 'full_name': 'X',
            'password': 'testpass123', 'confirm_password': 'wrong',
            'role': 'candidate',
        }
        res = self.client.post(self.url, data)
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_duplicate_email_rejected(self):
        make_candidate()
        data = {
            'email': 'candidate@test.com', 'full_name': 'Dup',
            'password': 'testpass123', 'confirm_password': 'testpass123',
            'role': 'candidate',
        }
        res = self.client.post(self.url, data)
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_short_password_rejected(self):
        data = {
            'email': 'short@test.com', 'full_name': 'Short',
            'password': '123', 'confirm_password': '123',
            'role': 'candidate',
        }
        res = self.client.post(self.url, data)
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)


class LoginTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.url = reverse('login')
        self.user = make_candidate()
        # Clear axes lockout records between tests
        try:
            from axes.models import AccessAttempt
            AccessAttempt.objects.all().delete()
        except Exception:
            pass

    def test_login_returns_tokens(self):
        res = self.client.post(self.url, {'email': 'candidate@test.com', 'password': 'testpass123'})
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIn('access', res.data)
        self.assertIn('refresh', res.data)
        self.assertEqual(res.data['user']['email'], 'candidate@test.com')

    def test_wrong_password_returns_400(self):
        res = self.client.post(self.url, {'email': 'candidate@test.com', 'password': 'wrongpass'})
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_unknown_email_returns_400(self):
        res = self.client.post(self.url, {'email': 'nobody@test.com', 'password': 'testpass123'})
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)


class MeViewTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = make_candidate()
        self.client.force_authenticate(user=self.user)

    def test_get_me_returns_user_data(self):
        res = self.client.get(reverse('me'))
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['email'], self.user.email)

    def test_unauthenticated_me_returns_401(self):
        self.client.force_authenticate(user=None)
        res = self.client.get(reverse('me'))
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)


class CandidateProfileTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = make_candidate()
        self.client.force_authenticate(user=self.user)

    def test_get_profile(self):
        res = self.client.get(reverse('candidate_profile'))
        self.assertEqual(res.status_code, status.HTTP_200_OK)

    def test_update_profile_skills(self):
        data = {'headline': 'Senior Dev', 'skills': ['Python', 'React', 'Django']}
        res = self.client.patch(reverse('candidate_profile'), data, format='json')
        self.assertEqual(res.status_code, status.HTTP_200_OK)

    def test_recruiter_cannot_access_candidate_profile(self):
        recruiter = make_recruiter()
        self.client.force_authenticate(user=recruiter)
        res = self.client.get(reverse('candidate_profile'))
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)


class PasswordResetTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = make_candidate()

    def test_reset_request_always_returns_200(self):
        """Should return 200 even for unknown email (prevent enumeration)."""
        res = self.client.post(reverse('password_reset'), {'email': 'nobody@test.com'})
        self.assertEqual(res.status_code, status.HTTP_200_OK)

    def test_valid_token_resets_password(self):
        token_obj = PasswordResetToken.objects.create(user=self.user)
        res = self.client.post(reverse('password_reset_confirm'), {
            'token': str(token_obj.token),
            'new_password': 'newstrongpass1',
            'confirm_password': 'newstrongpass1',
        })
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password('newstrongpass1'))

    def test_used_token_is_rejected(self):
        token_obj = PasswordResetToken.objects.create(user=self.user, used=True)
        res = self.client.post(reverse('password_reset_confirm'), {
            'token': str(token_obj.token),
            'new_password': 'newstrongpass1',
            'confirm_password': 'newstrongpass1',
        })
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
