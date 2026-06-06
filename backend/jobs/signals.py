"""
Job alerts: when a recruiter posts a new active job, email every candidate
whose profile matches above the threshold score.

Runs synchronously (no Celery required). With Celery this would be
`notify_matching_candidates.delay(job.id)`.
"""
import logging

from django.db.models.signals import post_save
from django.dispatch import receiver
from django.conf import settings
from django.core.mail import send_mail

logger = logging.getLogger('roleradius')

ALERT_THRESHOLD = 40.0   # Only email candidates with ≥40% match


@receiver(post_save, sender='jobs.Job')
def notify_matching_candidates_on_new_job(sender, instance, created: bool, **kwargs):
    """Email open-to-work candidates when a new matching job is posted."""
    if not created or not instance.is_active:
        return

    try:
        from matching.engine import get_matched_candidates_for_job
        matches = get_matched_candidates_for_job(
            instance,
            top_n=50,
            min_score=ALERT_THRESHOLD
        )
        if not matches:
            return

        job_url = (
            f"{getattr(settings, 'FRONTEND_URL', 'http://localhost:5173')}"
            f"/jobs/{instance.id}"
        )

        sent = 0
        for item in matches:
            profile = item['profile']
            score   = item['score']
            user    = profile.user
            try:
                send_mail(
                    subject=f"New job match: {instance.title} at {instance.company_name}",
                    message=(
                        f"Hi {user.full_name},\n\n"
                        f"A new job was just posted that matches your profile at "
                        f"{score:.0f}%:\n\n"
                        f"  {instance.title}\n"
                        f"  {instance.company_name} · {instance.location}\n"
                        f"  {instance.get_salary_display()}\n\n"
                        f"View and apply: {job_url}\n\n"
                        f"— The RoleRadius Team\n\n"
                        f"To stop receiving job alerts, update your profile and "
                        f"uncheck 'Open to work'."
                    ),
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    recipient_list=[user.email],
                    fail_silently=True,
                )
                sent += 1
            except Exception as exc:
                logger.warning('Job alert email failed for %s: %s', user.email, exc)

        logger.info(
            'Job alerts sent: %d candidates notified for job %s (%s)',
            sent, instance.id, instance.title
        )
    except Exception as exc:
        logger.warning('notify_matching_candidates_on_new_job failed: %s', exc)
