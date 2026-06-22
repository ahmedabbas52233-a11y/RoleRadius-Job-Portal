from django.db import models
import uuid


class Application(models.Model):
    PENDING = 'pending'
    REVIEWING = 'reviewing'
    SHORTLISTED = 'shortlisted'
    INTERVIEW = 'interview'
    OFFERED = 'offered'
    REJECTED = 'rejected'
    WITHDRAWN = 'withdrawn'

    STATUS_CHOICES = [
        (PENDING, 'Pending'),
        (REVIEWING, 'Under Review'),
        (SHORTLISTED, 'Shortlisted'),
        (INTERVIEW, 'Interview Scheduled'),
        (OFFERED, 'Offer Extended'),
        (REJECTED, 'Rejected'),
        (WITHDRAWN, 'Withdrawn'),
    ]

    STATUS_ORDER = [PENDING, REVIEWING, SHORTLISTED, INTERVIEW, OFFERED]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    job = models.ForeignKey('jobs.Job', on_delete=models.CASCADE, related_name='applications')
    candidate = models.ForeignKey('accounts.User', on_delete=models.CASCADE, related_name='applications')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=PENDING)
    cover_letter = models.TextField(blank=True)
    cv = models.FileField(upload_to='application_cvs/', null=True, blank=True)
    cv_url = models.URLField(blank=True)  # Link to candidate's stored CV
    match_score = models.FloatField(null=True, blank=True)
    recruiter_notes = models.TextField(blank=True)
    rejection_reason = models.TextField(blank=True)
    interview_date = models.DateTimeField(null=True, blank=True)
    applied_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'applications'
        unique_together = ['job', 'candidate']
        ordering = ['-applied_at']
        indexes = [
            # Candidate dashboard: filter by candidate, optionally by status
            models.Index(fields=['candidate', 'status'], name='app_candidate_status_idx'),
            # Recruiter applicant list: filter by job, optionally by status
            models.Index(fields=['job', 'status'], name='app_job_status_idx'),
            # Recruiter applicant list default ordering: highest match score first
            models.Index(fields=['job', '-match_score'], name='app_job_score_idx'),
        ]

    def __str__(self):
        return f'{self.candidate.full_name} → {self.job.title}'

    @property
    def status_step(self):
        """Return 0-based step index for pipeline display."""
        try:
            return self.STATUS_ORDER.index(self.status)
        except ValueError:
            return -1


class ApplicationStatusHistory(models.Model):
    application = models.ForeignKey(Application, on_delete=models.CASCADE, related_name='history')
    from_status = models.CharField(max_length=20, blank=True)
    to_status = models.CharField(max_length=20)
    note = models.TextField(blank=True)
    changed_at = models.DateTimeField(auto_now_add=True)
    changed_by = models.ForeignKey('accounts.User', on_delete=models.SET_NULL, null=True)

    class Meta:
        db_table = 'application_status_history'
        ordering = ['-changed_at']
