from django.db import models
from django.contrib.auth.models import AbstractUser

class UserRole(models.TextChoices):
    CITIZEN = 'CITIZEN', 'Citizen'
    ADMIN = 'ADMIN', 'Municipal Officer / Admin'

class User(AbstractUser):
    role = models.CharField(
        max_length=20,
        choices=UserRole.choices,
        default=UserRole.CITIZEN,
        db_index=True
    )
    ward = models.CharField(max_length=128, default='Ward 4 (Central Hospital & Metro Corridor)')
    department = models.CharField(max_length=128, blank=True, null=True)
    phone_number = models.CharField(max_length=32, blank=True, null=True)
    avatar_url = models.URLField(blank=True, null=True)

    def is_admin_role(self) -> bool:
        return self.role == UserRole.ADMIN or self.is_staff or self.is_superuser

    def is_citizen_role(self) -> bool:
        return self.role == UserRole.CITIZEN

    def __str__(self):
        return f"{self.username} ({self.role}) - {self.email}"
