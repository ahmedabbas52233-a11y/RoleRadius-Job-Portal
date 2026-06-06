from django.db import models
from django.utils import timezone
import uuid


class Job(models.Model):
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

    ENTRY     = 'entry'
    MID       = 'mid'
    SENIOR    = 'senior'
    LEAD      = 'lead'
    EXECUTIVE = 'executive'
    EXPERIENCE_CHOICES = [
        (ENTRY,     'Entry Level (0-2 years)'),
        (MID,       'Mid Level (2-5 years)'),
        (SENIOR,    'Senior Level (5-8 years)'),
        (LEAD,      'Lead / Principal (8+ years)'),
        (EXECUTIVE, 'Executive / Director'),
    ]

    ONSITE = 'onsite'
    REMOTE = 'remote'
    HYBRID = 'hybrid'
    WORK_MODE_CHOICES = [
        (ONSITE, 'On-site'),
        (REMOTE, 'Remote'),
        (HYBRID, 'Hybrid'),
    ]

    id               = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    recruiter        = models.ForeignKey('accounts.User', on_delete=models.CASCADE, related_name='posted_jobs')
    title            = models.CharField(max_length=200)
    company_name     = models.CharField(max_length=200)
    company_logo     = models.URLField(blank=True)
    description      = models.TextField()
    requirements     = models.TextField()
    responsibilities = models.TextField(blank=True)
    skills_required  = models.JSONField(default=list)
    job_type         = models.CharField(max_length=20, choices=JOB_TYPE_CHOICES, default=FULL_TIME)
    experience_level = models.CharField(max_length=20, choices=EXPERIENCE_CHOICES, default=MID)
    work_mode        = models.CharField(max_length=20, choices=WORK_MODE_CHOICES, default=ONSITE)
    location         = models.CharField(max_length=150)
    salary_min       = models.PositiveIntegerField(null=True, blank=True)
    salary_max       = models.PositiveIntegerField(null=True, blank=True)
    salary_currency  = models.CharField(max_length=10, default='GBP')
    category         = models.CharField(max_length=100, blank=True)
    tags             = models.JSONField(default=list, blank=True)
    application_deadline = models.DateField(null=True, blank=True)
    is_active        = models.BooleanField(default=True)
    deleted_at       = models.DateTimeField(null=True, blank=True)   # soft delete
    views_count      = models.PositiveIntegerField(default=0)
    created_at       = models.DateTimeField(auto_now_add=True)
    updated_at       = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'jobs'
        ordering = ['-created_at']
        indexes = [
            # Used on every job listing query
            models.Index(fields=['is_active', '-created_at'],    name='job_active_created_idx'),
            models.Index(fields=['is_active', 'job_type'],       name='job_active_type_idx'),
            models.Index(fields=['is_active', 'work_mode'],      name='job_active_mode_idx'),
            models.Index(fields=['is_active', 'experience_level'], name='job_active_exp_idx'),
            # Recruiter dashboard
            models.Index(fields=['recruiter', '-created_at'],    name='job_recruiter_idx'),
            # Location search
            models.Index(fields=['location'],                    name='job_location_idx'),
        ]

    def __str__(self):
        return f'{self.title} at {self.company_name}'

    @property
    def is_expired(self):
        if self.application_deadline:
            return timezone.now().date() > self.application_deadline
        return False

    def get_combined_text(self):
        skills = ' '.join(self.skills_required) if isinstance(self.skills_required, list) else ''
        return f"{self.title} {self.description} {self.requirements} {skills} {self.category}"

    def get_salary_display(self):
        if self.salary_min and self.salary_max:
            return f"{self.salary_currency} {self.salary_min:,} – {self.salary_max:,}"
        elif self.salary_min:
            return f"From {self.salary_currency} {self.salary_min:,}"
        return "Competitive"


class SavedJob(models.Model):
    candidate = models.ForeignKey('accounts.User', on_delete=models.CASCADE, related_name='saved_jobs')
    job       = models.ForeignKey(Job, on_delete=models.CASCADE, related_name='saved_by')
    saved_at  = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'saved_jobs'
        unique_together = ['candidate', 'job']
        ordering = ['-saved_at']
