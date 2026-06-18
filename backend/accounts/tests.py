"""
Account tests: auth, profiles, CV upload, password reset.
61 total tests across all apps.
"""
from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from .models import User, CandidateProfile, RecruiterProfile


def make_candidate(**kwargs):
    defaults = dict(email='candidate@test.com', full_name='Test Candidate', role=User.CANDIDATE)
    defaults.update(kwargs)
    user = User.objects.create_user(password='testpass123', **defaults)
    CandidateProfile.objects.create(user=user)
    return user


def make_recruiter(**kwargs):
    defaults = dict(email='recruiter@test.com', full_name='Test Recruiter', role=User.RECRUITER)
    defaults.update(kwargs)
    user = User.objects.create_user(password='testpass123', **defaults)
    RecruiterProfile.objects.create(user=user, company_name='Test Corp')
    return user


def clear_axes():
    try:
        from axes.models import AccessAttempt
        AccessAttempt.objects.all().delete()
    except Exception:
        pass


class RegisterTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.url = reverse('register')

    def test_register_candidate(self):
        res = self.client.post(self.url, {
            'email': 'new@test.com', 'password': 'testpass123',
            'full_name': 'New User', 'role': 'candidate'
        })
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertIn('user', res.data)
        self.assertTrue(User.objects.filter(email='new@test.com').exists())

    def test_register_recruiter(self):
        res = self.client.post(self.url, {
            'email': 'rec@test.com', 'password': 'testpass123',
            'full_name': 'New Recruiter', 'role': 'recruiter'
        })
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res.data['user']['role'], 'recruiter')

    def test_duplicate_email_rejected(self):
        make_candidate()
        res = self.client.post(self.url, {
            'email': 'candidate@test.com', 'password': 'testpass123',
            'full_name': 'Dup', 'role': 'candidate'
        })
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_short_password_rejected(self):
        res = self.client.post(self.url, {
            'email': 'x@test.com', 'password': '123',
            'full_name': 'X', 'role': 'candidate'
        })
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)


class LoginTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.url = reverse('login')
        self.user = make_candidate()
        clear_axes()

    def test_login_sets_cookie_and_returns_user(self):
        """Login now returns httpOnly cookies, not tokens in the body."""
        res = self.client.post(self.url, {
            'email': 'candidate@test.com', 'password': 'testpass123'
        })
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        # Response body has user data
        self.assertIn('user', res.data)
        self.assertEqual(res.data['user']['email'], 'candidate@test.com')
        # Cookies are set (httpOnly JWT)
        self.assertIn('access_token', res.cookies)
        self.assertIn('refresh_token', res.cookies)

    def test_invalid_password_rejected(self):
        clear_axes()
        res = self.client.post(self.url, {
            'email': 'candidate@test.com', 'password': 'wrongpass'
        })
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_nonexistent_email_rejected(self):
        clear_axes()
        res = self.client.post(self.url, {
            'email': 'nobody@test.com', 'password': 'testpass123'
        })
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_inactive_user_rejected(self):
        clear_axes()
        self.user.is_active = False
        self.user.save()
        res = self.client.post(self.url, {
            'email': 'candidate@test.com', 'password': 'testpass123'
        })
        self.assertNotEqual(res.status_code, status.HTTP_200_OK)


class CandidateProfileTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = make_candidate()
        self.client.force_authenticate(user=self.user)

    def test_get_profile(self):
        res = self.client.get(reverse('candidate_profile'))
        self.assertEqual(res.status_code, status.HTTP_200_OK)

    def test_update_profile_skills(self):
        res = self.client.patch(reverse('candidate_profile'), {
            'skills': ['Python', 'Django'], 'headline': 'Senior Dev'
        }, format='json')
        self.assertEqual(res.status_code, status.HTTP_200_OK)

    def test_recruiter_cannot_access_candidate_profile(self):
        recruiter = make_recruiter(email='r2@test.com')
        self.client.force_authenticate(user=recruiter)
        res = self.client.get(reverse('candidate_profile'))
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)

    def test_cv_upload_rejected_wrong_extension(self):
        from io import BytesIO
        from django.core.files.uploadedfile import SimpleUploadedFile
        fake = SimpleUploadedFile('cv.exe', b'fake', content_type='application/octet-stream')
        res = self.client.post(reverse('cv_upload'), {'cv': fake}, format='multipart')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_unauthenticated_profile_blocked(self):
        self.client.force_authenticate(user=None)
        res = self.client.get(reverse('candidate_profile'))
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)


class PasswordResetTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = make_candidate()

    def test_password_reset_request_succeeds(self):
        res = self.client.post(reverse('password_reset'), {'email': 'candidate@test.com'})
        self.assertEqual(res.status_code, status.HTTP_200_OK)

    def test_password_reset_nonexistent_email_safe(self):
        """Should return 200 (not reveal whether email exists)."""
        res = self.client.post(reverse('password_reset'), {'email': 'nobody@test.com'})
        self.assertEqual(res.status_code, status.HTTP_200_OK)

    def test_password_reset_confirm_invalid_token(self):
        res = self.client.post(reverse('password_reset_confirm'), {
            'token': '00000000-0000-0000-0000-000000000000',
            'new_password': 'newpass123'
        })
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_password_reset_confirm_valid_token(self):
        from .models import PasswordResetToken
        token_obj = PasswordResetToken.objects.create(user=self.user)
        res = self.client.post(reverse('password_reset_confirm'), {
            'token': str(token_obj.token),
            'new_password': 'newSecurePass456',
            'confirm_password': 'newSecurePass456'
        })
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password('newSecurePass456'))

    def test_password_reset_token_used_twice_rejected(self):
        from .models import PasswordResetToken
        token_obj = PasswordResetToken.objects.create(user=self.user)
        self.client.post(reverse('password_reset_confirm'), {
            'token': str(token_obj.token), 'new_password': 'newpass456', 'confirm_password': 'newpass456'
        })
        res2 = self.client.post(reverse('password_reset_confirm'), {
            'token': str(token_obj.token), 'new_password': 'anotherpass789', 'confirm_password': 'anotherpass789'
        })
        self.assertEqual(res2.status_code, status.HTTP_400_BAD_REQUEST)
