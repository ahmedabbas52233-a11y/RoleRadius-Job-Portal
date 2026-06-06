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
