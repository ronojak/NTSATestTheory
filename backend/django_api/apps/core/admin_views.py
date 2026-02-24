from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAdminUser
from rest_framework.response import Response
from apps.payments.models import Payment
from apps.subscriptions.models import Subscription

@api_view(['GET'])
@permission_classes([IsAdminUser])
def stats(request):
    return Response({
        'payments': Payment.objects.count(),
        'activeSubscriptions': Subscription.objects.filter(status='active').count()
    })
