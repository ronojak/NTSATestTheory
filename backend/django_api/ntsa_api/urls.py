from django.contrib import admin
from django.urls import path, include
from apps.core.views import health

urlpatterns = [
    path('admin/', admin.site.urls),
    path('health', health),
    path('api/', include('apps.api_urls')),
]
