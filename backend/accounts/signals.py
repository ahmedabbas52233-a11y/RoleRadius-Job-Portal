"""
Accounts signals.
The welcome/verification email is sent directly from RegisterView (accounts/views.py).

Invalidates the matching engine's cached candidate corpus whenever a
CandidateProfile is saved (skills, headline, bio, CV text, or open_to_work
all feed into the match text) — recruiters viewing "matched candidates"
should never see stale data after a candidate updates their profile.
"""
from django.db.models.signals import post_save
from django.dispatch import receiver


@receiver(post_save, sender='accounts.CandidateProfile')
def invalidate_candidate_cache_on_profile_save(sender, instance, **kwargs):
    from matching.engine import invalidate_candidate_corpus_cache
    invalidate_candidate_corpus_cache()
