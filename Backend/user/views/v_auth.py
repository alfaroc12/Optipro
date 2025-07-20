from rest_framework import status 
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth.models import User
from django.contrib.auth import authenticate

class LoginView(APIView):
    """
    Vista para manejar el inicio de sesión de usuarios.
    Retorna un token JWT para autenticación.
    """
    permission_classes = [AllowAny]
    
    def post(self, request):
        """
        Maneja POST requests para iniciar sesión.
        """
        username = request.data.get('username', '')
        password = request.data.get('password', '')
          # Autenticar usuario
        user = authenticate(username=username, password=password)
        
        if user is not None:
            # Crear tokens
            refresh = RefreshToken.for_user(user)
            access_token = str(refresh.access_token)
              # Determinar el rol del usuario
            role = 'user'
            try:
                # Si el usuario es superusuario, es admin (superadmin)
                if user.is_superuser:
                    role = 'admin'
                # Si no es superusuario pero es staff, podría ser un supervisor
                elif user.is_staff:
                    # Si tiene perfil y es categoría supervisor, asignar ese rol
                    if hasattr(user, 'profile') and user.profile.categoria.lower() == 'supervisor':
                        role = 'supervisor'
                    # Si es staff pero no supervisor, por defecto es admin
                    else:
                        role = 'admin'
                # Si no es staff, pero tiene perfil con categoría supervisor, asignar ese rol
                elif hasattr(user, 'profile') and user.profile.categoria.lower() == 'supervisor':
                    role = 'supervisor'
            except:
                # En caso de error, mantener el rol por defecto
                pass
            
            # Obtener información del usuario para devolver
            user_data = {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'role': role,
                'profile': {
                    'categoria': user.profile.categoria if hasattr(user, 'profile') else ''
                }
            }
            
            return Response({
                'user': user_data,
                'token': access_token
            }, status=status.HTTP_200_OK)
        else:
            return Response({
                'error': 'Credenciales inválidas'
            }, status=status.HTTP_401_UNAUTHORIZED)
