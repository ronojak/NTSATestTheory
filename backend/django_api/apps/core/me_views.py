from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

@api_view(['GET','PATCH'])
@permission_classes([IsAuthenticated])
def me(request):
    user = request.user
    if request.method == 'PATCH':
        data = request.data or {}
        user.name = data.get('name', user.name)
        user.phone = data.get('phone', user.phone)
        user.save(update_fields=['name','phone'])
    return Response({'user': {'id': user.id, 'email': user.email, 'name': user.name, 'phone': user.phone}})
