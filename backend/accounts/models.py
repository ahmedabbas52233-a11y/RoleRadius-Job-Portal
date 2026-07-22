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
    # Mirrors jobs.models.Job.JOB_TYPE_CHOICES exactly (same codes/labels).
    # Deliberately duplicated rather than imported from the jobs app: a
    # candidate profile shouldn't need to import another app's models just
    # for a handful of string constants, and accounts should stay loadable
    # independently of jobs. The two lists are kept honest by
    # jobs/tests.py::JobTypeChoicesConsistencyTests, which fails loudly if
    # they're ever edited out of sync — update both together.
    FULL_TIME  = 'full_time'
    PART_TIME  = 'part_time'
    CONTRACT   = 'contract'
    FREELANCE  = 'freelance'
    INTERNSHIP = 'internship'
    JOB_TYPE_CHOICES = [
        (FULL_TIME,  'Full Time'),
        (PART_TIME,  'Part Time'),
        (CONTRACT,   'Contract'),
        (FREELANCE,  'Freelance'),
        (INTERNSHIP, 'Internship'),
    ]

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
    # A candidate may be open to more than one arrangement (e.g. full-time
    # AND contract) — a list of the same structured codes Job.job_type uses,
    # not freeform text, so this can actually be matched against rather than
    # silently ignored (previously a CharField that was never validated
    # against Job's choices and was never used in scoring at all).
    desired_job_types  = models.JSONField(default=list, blank=True)
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


def _generate_join_code():
    """8-char uppercase alphanumeric code, e.g. 'K3F9QX2P' -- short enough to
    type/share verbally, long enough (36^8 ≈ 2.8 trillion combinations) that
    brute-forcing it isn't practical, especially combined with normal
    rate-limiting on the join endpoint."""
    import secrets
    import string
    alphabet = string.ascii_uppercase + string.digits
    return ''.join(secrets.choice(alphabet) for _ in range(8))


class Company(models.Model):
    """
    A recruiting team. Solving the "no company/team model" gap: previously
    a Job had exactly one owning recruiter with no way for a colleague at
    the same company to see or manage it. Any recruiter can create a
    Company; other recruiters join it with the join_code. Every recruiter
    in the same Company can then view and manage every job posted by any
    teammate (see Job.objects.manageable_by() in jobs/models.py) --
    deliberately a single flat permission level, not admin/member tiers,
    to keep the feature's scope contained and its behavior predictable.

    This is independent of RecruiterProfile's existing freeform
    company_name/company_description/etc. fields, which remain exactly as
    they were for solo recruiters who never create or join a Company --
    nothing about the existing solo flow changes.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    website = models.URLField(blank=True)
    size = models.CharField(max_length=50, blank=True)
    industry = models.CharField(max_length=100, blank=True)
    logo = models.ImageField(upload_to='company_logos/', null=True, blank=True)
    join_code = models.CharField(max_length=8, unique=True, default=_generate_join_code)
    created_by = models.ForeignKey(
        'User', on_delete=models.SET_NULL, null=True, blank=True, related_name='companies_created'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'companies'
        verbose_name_plural = 'companies'

    def __str__(self):
        return self.name


class RecruiterProfile(models.Model):
    user                = models.OneToOneField(User, on_delete=models.CASCADE, related_name='recruiter_profile')
    company_name        = models.CharField(max_length=200)
    company_description = models.TextField(blank=True)
    company_website      = models.URLField(blank=True)
    company_size        = models.CharField(max_length=50, blank=True)
    industry            = models.CharField(max_length=100, blank=True)
    location            = models.CharField(max_length=100, blank=True)
    company_logo        = models.ImageField(upload_to='logos/', null=True, blank=True)
    phone               = models.CharField(max_length=20, blank=True)
    linkedin            = models.URLField(blank=True)
    verified            = models.BooleanField(default=False)
    # Optional link to a shared Company/team record -- null means "solo
    # recruiter", exactly the behavior every RecruiterProfile had before
    # Company existed. Setting this widens job-management access to every
    # other recruiter who shares the same Company (see Job.manageable_by()).
    company             = models.ForeignKey(
        Company, on_delete=models.SET_NULL, null=True, blank=True, related_name='recruiters'
    )
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
