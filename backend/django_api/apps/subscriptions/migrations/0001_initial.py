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
            name='Subscription',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('status', models.CharField(choices=[('free', 'free'), ('active', 'active'), ('expired', 'expired')], default='free', max_length=16)),
                ('planType', models.CharField(blank=True, max_length=32, null=True)),
                ('startDate', models.DateTimeField(blank=True, null=True)),
                ('endDate', models.DateTimeField(blank=True, null=True)),
                ('expiryDate', models.DateTimeField(blank=True, null=True)),
                ('updatedAt', models.DateTimeField(auto_now=True)),
                ('createdAt', models.DateTimeField(auto_now_add=True)),
                ('user', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name='subscription', to=settings.AUTH_USER_MODEL)),
            ],
        ),
    ]
