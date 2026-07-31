from rest_framework.permissions import BasePermission

from accounts.models import User


class IsCandidate(BasePermission):
    """Allow access only to authenticated users with the candidate role."""
    message = 'Only candidates can perform this action.'

    def has_permission(self, request, view) -> bool:
        return (
            request.user.is_authenticated
            and request.user.role == User.CANDIDATE
        )


class IsRecruiter(BasePermission):
    """Allow access only to authenticated users with the recruiter role."""
    message = 'Only recruiters can perform this action.'

    def has_permission(self, request, view) -> bool:
        return (
            request.user.is_authenticated
            and request.user.role == User.RECRUITER
        )


class IsRecruiterOrReadOnly(BasePermission):
    """Read-only for everyone, write access only for recruiters."""

    def has_permission(self, request, view) -> bool:
        from rest_framework.permissions import SAFE_METHODS
        if request.method in SAFE_METHODS:
            return True
        return (
            request.user.is_authenticated
            and request.user.role == User.RECRUITER
        )


class CanManageJobs(BasePermission):
    """
    A recruiter who can actually mutate jobs/applications -- i.e. not a
    team's read-only VIEWER role. Solo recruiters (no company) always
    pass, since the viewer restriction only applies within a team; see
    RecruiterProfile.can_manage_jobs. Use this (instead of, or alongside,
    IsRecruiter) on any endpoint that creates/edits/deletes a job,
    application status, or interview round -- read-only endpoints
    (browsing/listing) should stay on plain IsRecruiter so a viewer can
    still see what they're not allowed to change.
    """
    message = 'Your role on this team is read-only and cannot make changes.'

    def has_permission(self, request, view) -> bool:
        if not (request.user.is_authenticated and request.user.role == User.RECRUITER):
            return False
        profile = getattr(request.user, 'recruiter_profile', None)
        return profile is not None and profile.can_manage_jobs
