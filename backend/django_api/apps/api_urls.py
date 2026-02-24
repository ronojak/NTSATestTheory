from django.urls import path, include

urlpatterns = [
    path('auth/', include('apps.accounts.urls')),
    path('me/', include('apps.core.me_urls')),
    path('payments/', include('apps.payments.urls')),
    path('admin-api/', include('apps.core.admin_urls')),
]
