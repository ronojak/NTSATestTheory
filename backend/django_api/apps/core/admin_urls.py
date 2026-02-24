from django.urls import path
from .admin_views import stats
urlpatterns=[path('stats', stats)]
