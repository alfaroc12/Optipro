from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated

class RolesView(APIView):
    """
    Vista para obtener los roles disponibles en el sistema.
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """
        Retorna la lista de roles disponibles en el sistema.
        """
        roles = [
            {
                "id": "admin",
                "name": "Administrador",
                "description": "Acceso completo al sistema, incluyendo gestión de usuarios"
            },
            {
                "id": "supervisor",
                "name": "Supervisor",
                "description": "Acceso a funciones administrativas, excepto gestión de usuarios"
            },
            {
                "id": "user",
                "name": "Usuario",
                "description": "Acceso básico al sistema"
            }
        ]
        
        return Response(roles, status=status.HTTP_200_OK)
