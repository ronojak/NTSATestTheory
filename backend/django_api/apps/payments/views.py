from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.conf import settings
from django.utils import timezone
from datetime import timedelta

from .models import Payment
from apps.subscriptions.models import Subscription
from .daraja import stk_push

PLANS = {
    "weekly": {"amount": 100, "days": 7},
    "monthly": {"amount": 300, "days": 30},
    "yearly": {"amount": 2000, "days": 365},
}

def _require_plan(planId: str):
    p = PLANS.get(str(planId).lower())
    if not p:
        raise ValueError("invalid_plan")
    return p

def _grant_entitlement(user, planId: str):
    plan = _require_plan(planId)
    start = timezone.now()
    expiry = start + timedelta(days=int(plan["days"]))
    Subscription.objects.update_or_create(
        user=user,
        defaults={
            "status": "active",
            "planType": planId,
            "startDate": start,
            "endDate": expiry,
            "expiryDate": expiry,
        },
    )

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def mpesa_stk_push(request):
    user = request.user
    phoneNumber = (request.data or {}).get('phoneNumber')
    planId = (request.data or {}).get('planId')
    amount = (request.data or {}).get('amount')

    if not phoneNumber or not planId:
        return Response({'error': 'phoneNumber_and_planId_required'}, status=status.HTTP_400_BAD_REQUEST)

    plan = _require_plan(planId)
    finalAmount = int(amount or plan['amount'])

    if not settings.BASE_URL_PUBLIC:
        return Response({'error': 'BASE_URL_PUBLIC_not_set'}, status=500)

    callbackUrl = settings.BASE_URL_PUBLIC.rstrip('/') + settings.DARAJA_CALLBACK_PATH

    payment = Payment.objects.create(
        user=user,
        provider='mpesa',
        status='PENDING',
        planId=str(planId),
        amount=finalAmount,
        phone=str(phoneNumber),
    )

    try:
        daraja = stk_push(
            phoneNumber=str(phoneNumber),
            amount=finalAmount,
            accountReference=f"NTSA-{payment.id}",
            transactionDesc=f"NTSA plan {planId}",
            callbackUrl=callbackUrl,
        )
    except Exception as e:
        payment.status = 'FAILED'
        payment.rawInitJson = {'error': str(e)}
        payment.save(update_fields=['status','rawInitJson'])
        return Response({'error': 'stk_push_failed', 'detail': str(e)}, status=502)

    payment.merchantRequestId = daraja.get('MerchantRequestID')
    payment.checkoutRequestId = daraja.get('CheckoutRequestID')
    payment.rawInitJson = daraja
    payment.save(update_fields=['merchantRequestId','checkoutRequestId','rawInitJson'])

    return Response({
        'serverPaymentId': payment.id,
        'merchantRequestId': payment.merchantRequestId,
        'checkoutRequestId': payment.checkoutRequestId,
        'status': payment.status,
    })

@api_view(['POST'])
def mpesa_callback(request):
    body = request.data or {}
    callback = ((body.get('Body') or {}).get('stkCallback') or {})
    merchantRequestId = callback.get('MerchantRequestID')
    checkoutRequestId = callback.get('CheckoutRequestID')
    resultCode = callback.get('ResultCode')
    items = (((callback.get('CallbackMetadata') or {}).get('Item')) or [])
    byName = {i.get('Name'): i.get('Value') for i in items if isinstance(i, dict)}
    mpesaReceipt = byName.get('MpesaReceiptNumber') or byName.get('MpesaReceipt')
    amount = byName.get('Amount')
    phone = byName.get('PhoneNumber') or byName.get('MSISDN')

    q = Payment.objects.all()
    if checkoutRequestId:
        q = q.filter(checkoutRequestId=checkoutRequestId)
    elif merchantRequestId:
        q = q.filter(merchantRequestId=merchantRequestId)
    else:
        return Response({'ok': True})

    payment = q.order_by('-createdAt').first()
    if not payment:
        return Response({'ok': True})

    payment.rawCallbackJson = body
    if resultCode == 0:
        payment.status = 'SUCCESS'
        payment.providerRef = str(mpesaReceipt or '')
        payment.amount = int(amount or payment.amount)
        payment.phone = str(phone or payment.phone or '')
        payment.save(update_fields=['status','providerRef','amount','phone','rawCallbackJson'])
        _grant_entitlement(payment.user, payment.planId or 'monthly')
    else:
        payment.status = 'FAILED'
        payment.save(update_fields=['status','rawCallbackJson'])

    # Safaricom expects 200 with a JSON body
    return Response({'ResultCode': 0, 'ResultDesc': 'Accepted'})
