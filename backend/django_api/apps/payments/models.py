from django.db import models
from django.conf import settings

class Payment(models.Model):
    PROVIDER_CHOICES = [('mpesa','mpesa'),('paystack','paystack')]
    STATUS_CHOICES = [('PENDING','PENDING'),('SUCCESS','SUCCESS'),('FAILED','FAILED')]

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='payments')
    provider = models.CharField(max_length=16, choices=PROVIDER_CHOICES)
    status = models.CharField(max_length=16, choices=STATUS_CHOICES, default='PENDING')

    planId = models.CharField(max_length=32, blank=True, null=True)
    amount = models.IntegerField(default=0)
    phone = models.CharField(max_length=32, blank=True, null=True)

    merchantRequestId = models.CharField(max_length=64, blank=True, null=True)
    checkoutRequestId = models.CharField(max_length=64, blank=True, null=True)
    providerRef = models.CharField(max_length=128, blank=True, null=True)

    rawInitJson = models.JSONField(blank=True, null=True)
    rawCallbackJson = models.JSONField(blank=True, null=True)

    createdAt = models.DateTimeField(auto_now_add=True)
    updatedAt = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.provider}:{self.status}:{self.id}"
