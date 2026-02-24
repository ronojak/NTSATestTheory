from django.db import models
from django.conf import settings

class Subscription(models.Model):
    STATUS_CHOICES = [
        ('free','free'),
        ('active','active'),
        ('expired','expired')
    ]
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='subscription')
    status = models.CharField(max_length=16, choices=STATUS_CHOICES, default='free')
    planType = models.CharField(max_length=32, blank=True, null=True)
    startDate = models.DateTimeField(blank=True, null=True)
    endDate = models.DateTimeField(blank=True, null=True)
    expiryDate = models.DateTimeField(blank=True, null=True)
    updatedAt = models.DateTimeField(auto_now=True)
    createdAt = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.email}:{self.status}"
