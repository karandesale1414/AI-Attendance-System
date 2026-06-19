from rest_framework.permissions import BasePermission


class IsAdminOrHR(BasePermission):
    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and (request.user.is_superuser or request.user.is_staff or request.user.role in {"ADMIN", "HR"})
        )


class IsAdminHRorSelf(BasePermission):
    def has_object_permission(self, request, view, obj):
        if request.user.is_superuser or request.user.is_staff or request.user.role in {"ADMIN", "HR"}:
            return True
        return getattr(obj, "user_id", None) == request.user.id
