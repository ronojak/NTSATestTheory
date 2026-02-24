from django.urls import path
from .views import mpesa_stk_push, mpesa_callback

urlpatterns = [
    path('mpesa/stk-push', mpesa_stk_push),
    path('mpesa/callback', mpesa_callback),
]
