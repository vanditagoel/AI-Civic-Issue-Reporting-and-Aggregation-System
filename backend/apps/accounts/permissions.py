from rest_framework import permissions

class IsAdminUserRole(permissions.BasePermission):
    """
    Allows access only to authenticated users with ADMIN role or staff status.
    """
    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            (getattr(request.user, 'role', None) == 'ADMIN' or request.user.is_staff or request.user.is_superuser)
        )

class IsCitizenUserRole(permissions.BasePermission):
    """
    Allows access to authenticated citizens.
    """
    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            getattr(request.user, 'role', None) == 'CITIZEN'
        )

class IsOwnerOrAdmin(permissions.BasePermission):
    """
    Object-level permission: Citizens can only access their own objects,
    while Admins can access any object.
    """
    def has_object_permission(self, request, view, obj):
        if not request.user or not request.user.is_authenticated:
            return False
        if getattr(request.user, 'role', None) == 'ADMIN' or request.user.is_staff:
            return True
        # Check citizen ownership
        if hasattr(obj, 'citizen'):
            return obj.citizen == request.user
        if hasattr(obj, 'user'):
            return obj.user == request.user
        return False
