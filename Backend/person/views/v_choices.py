from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from person.models.person import M_person

@api_view(['GET'])
@permission_classes([AllowAny])
def get_choices(request):
    type_identification = dict(M_person.type_person_choice)
    response = {
        "type_identification_choices": type_identification,
    }
    return Response(response, status=status.HTTP_200_OK)