# filepath: c:\Users\presi\Desktop\Optipto\Back-Optipro\user\views\v_profile.py
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from user.serializers.sz_profile import UserProfileSerializer

class UserProfileView(APIView):
    """
    Vista para obtener y actualizar la información del perfil de usuario.
    """
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    
    def get(self, request):
        """
        Obtiene los datos del perfil del usuario autenticado.
        """
        try:
            user_profile = request.user.profile
            serializer = UserProfileSerializer(user_profile, context={'request': request})
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Exception as e:
            import traceback
            print(f"Error al obtener perfil: {str(e)}")
            print(traceback.format_exc())
            return Response(
                {"error": f"Error al obtener perfil: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def put(self, request):
        """
        Actualiza los datos del perfil del usuario autenticado.
        """
        try:
            user_profile = request.user.profile
            
            # Crear una copia de los datos del request para manipularlos
            data = request.data.copy() if hasattr(request.data, 'copy') else dict(request.data)
            
            # Verificar si hay una imagen de perfil en la solicitud (esto maneja ambos casos: FormData y JSON)
            if 'profile_image' in data and data['profile_image']:
                # Si llega como 'profile_image', copiarla también a 'profile_image_upload' para compatibilidad
                data['profile_image_upload'] = data['profile_image']
                
            serializer = UserProfileSerializer(
                user_profile, 
                data=data, 
                context={'request': request},
                partial=True
            )
            
            if serializer.is_valid():
                serializer.save()
                # Devolver el perfil actualizado con la URL completa de la imagen
                updated_serializer = UserProfileSerializer(user_profile, context={'request': request})
                return Response(updated_serializer.data, status=status.HTTP_200_OK)
            else:
                print(f"Errores de validación: {serializer.errors}")
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            import traceback
            print(f"Error al actualizar perfil: {str(e)}")
            print(traceback.format_exc())
            return Response(
                {"error": f"Error al actualizar perfil: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
