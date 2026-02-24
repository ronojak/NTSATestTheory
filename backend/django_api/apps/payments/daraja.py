import base64
import datetime as dt
import requests
from django.conf import settings

def _token():
    if not settings.DARAJA_CONSUMER_KEY or not settings.DARAJA_CONSUMER_SECRET:
        raise RuntimeError("Daraja credentials not configured")
    auth = base64.b64encode(f"{settings.DARAJA_CONSUMER_KEY}:{settings.DARAJA_CONSUMER_SECRET}".encode()).decode()
    url = "https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials"
    if settings.DARAJA_ENV == 'production':
        url = "https://api.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials"
    r = requests.get(url, headers={"Authorization": f"Basic {auth}"}, timeout=20)
    r.raise_for_status()
    return r.json()["access_token"]

def stk_push(*, phoneNumber: str, amount: int, accountReference: str, transactionDesc: str, callbackUrl: str):
    token = _token()
    ts = dt.datetime.now().strftime("%Y%m%d%H%M%S")
    password = base64.b64encode(f"{settings.DARAJA_SHORTCODE}{settings.DARAJA_PASSKEY}{ts}".encode()).decode()

    url = "https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest"
    if settings.DARAJA_ENV == 'production':
        url = "https://api.safaricom.co.ke/mpesa/stkpush/v1/processrequest"

    payload = {
        "BusinessShortCode": settings.DARAJA_SHORTCODE,
        "Password": password,
        "Timestamp": ts,
        "TransactionType": "CustomerPayBillOnline",
        "Amount": int(amount),
        "PartyA": str(phoneNumber),
        "PartyB": settings.DARAJA_SHORTCODE,
        "PhoneNumber": str(phoneNumber),
        "CallBackURL": callbackUrl,
        "AccountReference": accountReference,
        "TransactionDesc": transactionDesc,
    }
    r = requests.post(url, json=payload, headers={"Authorization": f"Bearer {token}"}, timeout=30)
    r.raise_for_status()
    return r.json()
