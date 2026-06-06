import logging

from django.conf import settings
from django.core.mail import send_mail
from django.db.models.signals import post_save
from django.dispatch import receiver

logger = logging.getLogger('roleradius')

STATUS_EMAIL_MAP = {
    'reviewing':   ('Your application is under review', 'Good news — a recruiter is reviewing your application for {job}.'),
    'shortlisted': ('You have been shortlisted! 🎉',   'Congratulations! You have been shortlisted for {job}. Expect to hear more soon.'),
    'interview':   ('Interview invitation for {job}',  'You have been invited to interview for {job}. Log in to see the details.'),
    'offered':     ('You have received an offer! 🏆',  'Amazing news — you have received a job offer for {job}. Log in to review it.'),
    'rejected':    ('Update on your application',      'Thank you for your interest in {job}. Unfortunately the team has decided not to move forward at this time.'),
}


@receiver(post_save, sender='applications.ApplicationStatusHistory')
def notify_candidate_on_status_change(sender, instance, created: bool, **kwargs):
    """Email the candidate whenever a recruiter moves their application forward."""
    if not created:
        return

    status = instance.to_status
    if status not in STATUS_EMAIL_MAP:
        return

    try:
        application = instance.application
        candidate = application.candidate
        job_title = f'{application.job.title} at {application.job.company_name}'
        subject_tpl, body_tpl = STATUS_EMAIL_MAP[status]

        send_mail(
            subject=subject_tpl.format(job=job_title),
            message=(
                f'Hi {candidate.full_name},\n\n'
                + body_tpl.format(job=job_title)
                + f'\n\nView your applications: '
                + f'{getattr(settings, "FRONTEND_URL", "http://localhost:5173")}/dashboard\n\n'
                + '— The RoleRadius Team'
            ),
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[candidate.email],
            fail_silently=True,
        )
        logger.info(
            'Status notification sent to %s for application %s → %s',
            candidate.email, application.id, status
        )
    except Exception as exc:
        logger.warning('Could not send status notification: %s', exc)
