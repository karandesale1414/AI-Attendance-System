from rest_framework import permissions


class IsAdminOrHR(permissions.BasePermission):
    """
    Custom permission to only allow admins and HR staff to access.
    """
    def has_permission(self, request, view):
        return request.user and (request.user.is_superuser or request.user.is_staff)
