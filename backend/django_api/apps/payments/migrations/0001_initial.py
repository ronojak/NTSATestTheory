from django.db import migrations, models
import django.db.models.deletion
from django.conf import settings

class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('accounts', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='Payment',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('provider', models.CharField(choices=[('mpesa', 'mpesa'), ('paystack', 'paystack')], max_length=16)),
                ('status', models.CharField(choices=[('PENDING', 'PENDING'), ('SUCCESS', 'SUCCESS'), ('FAILED', 'FAILED')], default='PENDING', max_length=16)),
                ('planId', models.CharField(blank=True, max_length=32, null=True)),
                ('amount', models.IntegerField(default=0)),
                ('phone', models.CharField(blank=True, max_length=32, null=True)),
                ('merchantRequestId', models.CharField(blank=True, max_length=64, null=True)),
                ('checkoutRequestId', models.CharField(blank=True, max_length=64, null=True)),
                ('providerRef', models.CharField(blank=True, max_length=128, null=True)),
                ('rawInitJson', models.JSONField(blank=True, null=True)),
                ('rawCallbackJson', models.JSONField(blank=True, null=True)),
                ('createdAt', models.DateTimeField(auto_now_add=True)),
                ('updatedAt', models.DateTimeField(auto_now=True)),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='payments', to=settings.AUTH_USER_MODEL)),
            ],
        ),
    ]
