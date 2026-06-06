from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models
from django.utils import timezone
import uuid


class UserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('Email is required')
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('role', User.ADMIN)
        return self.create_user(email, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    CANDIDATE = 'candidate'
    RECRUITER = 'recruiter'
    ADMIN     = 'admin'
    ROLE_CHOICES = [
        (CANDIDATE, 'Candidate'),
        (RECRUITER, 'Recruiter'),
        (ADMIN,     'Admin'),
    ]

    id               = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email            = models.EmailField(unique=True)
    full_name        = models.CharField(max_length=150)
    role             = models.CharField(max_length=20, choices=ROLE_CHOICES, default=CANDIDATE)
    is_active        = models.BooleanField(default=True)
    is_staff         = models.BooleanField(default=False)
    is_email_verified = models.BooleanField(default=False)
    date_joined      = models.DateTimeField(default=timezone.now)
    last_login       = models.DateTimeField(null=True, blank=True)

    objects: 'UserManager' = UserManager()  # type: ignore[assignment]

    USERNAME_FIELD  = 'email'
    REQUIRED_FIELDS = ['full_name']

    class Meta:
        db_table = 'users'

    def __str__(self):
        return f'{self.full_name} ({self.email})'

    @property
    def is_candidate(self):
        return self.role == self.CANDIDATE

    @property
    def is_recruiter(self):
        return self.role == self.RECRUITER


class CandidateProfile(models.Model):
    user             = models.OneToOneField(User, on_delete=models.CASCADE, related_name='candidate_profile')
    headline         = models.CharField(max_length=200, blank=True)
    bio              = models.TextField(blank=True)
    location         = models.CharField(max_length=100, blank=True)
    phone            = models.CharField(max_length=20, blank=True)
    website          = models.URLField(blank=True)
    linkedin         = models.URLField(blank=True)
    github           = models.URLField(blank=True)
    skills           = models.JSONField(default=list, blank=True)
    experience_years = models.PositiveIntegerField(default=0)
    education        = models.JSONField(default=list, blank=True)
    experience       = models.JSONField(default=list, blank=True)
    avatar           = models.ImageField(upload_to='avatars/', null=True, blank=True)
    cv               = models.FileField(upload_to='cvs/', null=True, blank=True)
    cv_text          = models.TextField(blank=True)
    desired_salary_min = models.PositiveIntegerField(null=True, blank=True)
    desired_salary_max = models.PositiveIntegerField(null=True, blank=True)
    desired_job_type   = models.CharField(max_length=50, blank=True)
    open_to_work     = models.BooleanField(default=True)
    created_at       = models.DateTimeField(auto_now_add=True)
    updated_at       = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'candidate_profiles'

    def __str__(self):
        return f'Profile: {self.user.full_name}'

    def get_skills_text(self):
        skills    = self.skills if isinstance(self.skills, list) else []
        return ' '.join([self.headline, self.bio, ' '.join(skills), self.cv_text])


class RecruiterProfile(models.Model):
    user                = models.OneToOneField(User, on_delete=models.CASCADE, related_name='recruiter_profile')
    company_name        = models.CharField(max_length=200)
    company_description = models.TextField(blank=True)
    company_website     = models.URLField(blank=True)
    company_size        = models.CharField(max_length=50, blank=True)
    industry            = models.CharField(max_length=100, blank=True)
    location            = models.CharField(max_length=100, blank=True)
    company_logo        = models.ImageField(upload_to='logos/', null=True, blank=True)
    phone               = models.CharField(max_length=20, blank=True)
    linkedin            = models.URLField(blank=True)
    verified            = models.BooleanField(default=False)
    created_at          = models.DateTimeField(auto_now_add=True)
    updated_at          = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'recruiter_profiles'

    def __str__(self):
        return f'{self.company_name} ({self.user.email})'


class PasswordResetToken(models.Model):
    user       = models.ForeignKey(User, on_delete=models.CASCADE)
    token      = models.UUIDField(default=uuid.uuid4, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    used       = models.BooleanField(default=False)

    class Meta:
        db_table = 'password_reset_tokens'

    def is_valid(self):
        from datetime import timedelta
        return not self.used and timezone.now() < self.created_at + timedelta(hours=2)
