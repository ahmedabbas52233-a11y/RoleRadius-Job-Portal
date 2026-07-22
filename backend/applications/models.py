from django.db import models
import uuid


class Application(models.Model):
    PENDING = 'pending'
    REVIEWING = 'reviewing'
    SHORTLISTED = 'shortlisted'
    INTERVIEW = 'interview'
    OFFERED = 'offered'
    HIRED = 'hired'
    OFFER_DECLINED = 'offer_declined'
    REJECTED = 'rejected'
    WITHDRAWN = 'withdrawn'

    STATUS_CHOICES = [
        (PENDING, 'Pending'),
        (REVIEWING, 'Under Review'),
        (SHORTLISTED, 'Shortlisted'),
        (INTERVIEW, 'Interview Scheduled'),
        (OFFERED, 'Offer Extended'),
        (HIRED, 'Hired'),
        (OFFER_DECLINED, 'Offer Declined'),
        (REJECTED, 'Rejected'),
        (WITHDRAWN, 'Withdrawn'),
    ]

    STATUS_ORDER = [PENDING, REVIEWING, SHORTLISTED, INTERVIEW, OFFERED, HIRED]

    # Statuses an application cannot move on from — used by both the
    # candidate-withdraw flow and the recruiter status-update flow so
    # "concluded" means the same thing everywhere in the codebase.
    TERMINAL_STATUSES = {HIRED, OFFER_DECLINED, REJECTED, WITHDRAWN}

    # Active stages can move forward/laterally to any other active stage
    # (a recruiter can fast-track a strong candidate straight from "pending"
    # to "interview" without forcing every intermediate click) or to
    # REJECTED. HIRED / OFFER_DECLINED are only reachable from OFFERED —
    # you can't be hired for, or decline, an offer you were never given.
    # Every status in TERMINAL_STATUSES is a dead end.
    _ACTIVE_FORWARD = {REVIEWING, SHORTLISTED, INTERVIEW, OFFERED, REJECTED}
    VALID_TRANSITIONS = {
        PENDING:        _ACTIVE_FORWARD,
        REVIEWING:      _ACTIVE_FORWARD,
        SHORTLISTED:    _ACTIVE_FORWARD,
        INTERVIEW:      _ACTIVE_FORWARD,
        OFFERED:        {HIRED, OFFER_DECLINED, REJECTED},
        HIRED:          set(),
        OFFER_DECLINED: set(),
        REJECTED:       set(),
        WITHDRAWN:      set(),
    }

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

    def can_transition_to(self, new_status: str) -> bool:
        """Whether moving from the current status to new_status is a legal pipeline move."""
        if new_status == self.status:
            return True  # no-op, e.g. a notes-only update that resends the same status
        return new_status in self.VALID_TRANSITIONS.get(self.status, set())


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


class InterviewRound(models.Model):
    """
    A single structured interview round for an application -- e.g. a
    phone screen, then a technical round, then an onsite/final round.

    This is additive alongside Application.interview_date (kept as-is for
    backward compatibility with the existing "move to interview" flow,
    which sets one date for the whole interview stage). InterviewRound
    lets a recruiter optionally build out real structure on top of that:
    multiple dated rounds, each with its own type, interviewer, a private
    scorecard, and a pass/fail outcome -- rather than one undifferentiated
    datetime field.

    `interviewer_name` is deliberately freeform text, not a ForeignKey to
    a User, because RoleRadius currently has no company/team model -- a
    job has exactly one owning recruiter, so there's no directory of
    colleagues to pick from yet. Once a company/team model exists, this
    should become a FK to a teammate User; until then, freeform text is
    the honest choice rather than pretending a colleague-picker exists.
    """
    SCREEN = 'screen'
    TECHNICAL = 'technical'
    ONSITE = 'onsite'
    FINAL = 'final'
    OTHER = 'other'
    ROUND_TYPE_CHOICES = [
        (SCREEN, 'Phone/Video Screen'),
        (TECHNICAL, 'Technical Interview'),
        (ONSITE, 'Onsite'),
        (FINAL, 'Final Round'),
        (OTHER, 'Other'),
    ]

    PENDING = 'pending'
    PASSED = 'passed'
    FAILED = 'failed'
    OUTCOME_CHOICES = [
        (PENDING, 'Pending'),
        (PASSED, 'Passed'),
        (FAILED, 'Failed'),
    ]

    application = models.ForeignKey(Application, on_delete=models.CASCADE, related_name='interview_rounds')
    round_number = models.PositiveIntegerField()
    round_type = models.CharField(max_length=20, choices=ROUND_TYPE_CHOICES, default=SCREEN)
    scheduled_at = models.DateTimeField(null=True, blank=True)
    interviewer_name = models.CharField(max_length=150, blank=True)
    # Private to the recruiter -- never serialized to the candidate-facing
    # serializer (mirrors how recruiter_notes/rejection_reason on
    # Application are already handled).
    feedback = models.TextField(blank=True)
    score = models.PositiveSmallIntegerField(
        null=True, blank=True,
        help_text='1-5 scorecard rating, recruiter-private.'
    )
    outcome = models.CharField(max_length=10, choices=OUTCOME_CHOICES, default=PENDING)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'interview_rounds'
        ordering = ['round_number']
        unique_together = ['application', 'round_number']
        constraints = [
            # `check=` is correct for this project's actual Django 4.2.13
            # (verified: CheckConstraint.__init__ only accepts `check`, not
            # `condition`, on this Django version). djangorestframework-stubs
            # unconditionally requires django-stubs>=5.0.0 (which models
            # Django 5's renamed `condition` param) regardless of which
            # Django is actually installed -- there is no stub-version
            # pairing that avoids this false positive while keeping DRF
            # stub coverage elsewhere in the codebase, so it's suppressed
            # here rather than "fixed" by switching to a param name that
            # would break at runtime.
            models.CheckConstraint(  # pyright: ignore[reportCallIssue]
                check=models.Q(score__gte=1, score__lte=5) | models.Q(score__isnull=True),
                name='interview_round_score_range',
            ),
        ]

    def __str__(self):
        return f'Round {self.round_number} ({self.get_round_type_display()}) — {self.application}'
