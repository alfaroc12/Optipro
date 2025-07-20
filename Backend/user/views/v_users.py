from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.pagination import PageNumberPagination
from django.contrib.auth.models import User
from django.db.models import Q
from user.serializers.sz_user import UserListSerializer

class CustomPagination(PageNumberPagination):
    page_size_query_param = 'size'
    page_size = 10
    max_page_size = 100

class UserListView(APIView):
    """
    Vista para listar, crear y administrar usuarios
    """
    permission_classes = [IsAuthenticated]
    pagination_class = CustomPagination
    
    def get(self, request):
        """
        Lista todos los usuarios con filtrado y paginación
        """
        try:
            users = User.objects.all().order_by('-date_joined')
            
            # Filtrado por búsqueda
            search = request.query_params.get('search', '')
            if search:
                users = users.filter(
                    Q(username__icontains=search) | 
                    Q(first_name__icontains=search) |
                    Q(last_name__icontains=search) |
                    Q(email__icontains=search) |
                    Q(profile__ciudad__icontains=search) |
                    Q(profile__cedula__icontains=search)
                )
            
            # Filtrado por estado
            status_filter = request.query_params.get('status', None)
            if status_filter:
                if status_filter == 'activo':
                    users = users.filter(is_active=True)
                elif status_filter == 'inactivo':
                    users = users.filter(is_active=False)
                    
            # Paginación
            paginator = self.pagination_class()
            paginated_users = paginator.paginate_queryset(users, request)
            serializer = UserListSerializer(paginated_users, many=True)
            
            # Retornar resultados paginados
            return Response({
                'count': users.count(),
                'next': paginator.get_next_link(),
                'previous': paginator.get_previous_link(),
                'results': serializer.data
            })
        except Exception as e:
            import traceback
            print(f"Error al listar usuarios: {str(e)}")
            print(traceback.format_exc())
            return Response(
                {"error": f"Error al listar usuarios: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def post(self, request):
        """
        Crea un nuevo usuario
        """
        try:
            data = request.data
            
            # Extraer datos del perfil
            profile_data = data.pop('profile', {})
            
            # Serializar y validar
            serializer = UserListSerializer(data=data)
            if serializer.is_valid():
                # Guardar usuario y perfil
                user = serializer.save()
                
                # Actualizar campos del perfil si se proporcionaron
                if profile_data and hasattr(user, 'profile'):
                    for key, value in profile_data.items():
                        setattr(user.profile, key, value)
                    user.profile.save()
                
                # Retornar el usuario creado
                serializer = UserListSerializer(user)
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            import traceback
            print(f"Error al crear usuario: {str(e)}")
            print(traceback.format_exc())
            return Response(
                {"error": f"Error al crear usuario: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class UserDetailView(APIView):
    """
    Vista para obtener, actualizar o eliminar un usuario específico
    """
    permission_classes = [IsAuthenticated]
    
    def get_object(self, pk):
        try:
            return User.objects.get(pk=pk)
        except User.DoesNotExist:
            return None
    
    def get(self, request, pk):
        """
        Obtiene los detalles de un usuario
        """
        user = self.get_object(pk)
        if not user:
            return Response(
                {"error": "Usuario no encontrado"}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        serializer = UserListSerializer(user)
        return Response(serializer.data)
    
    def put(self, request, pk):
        """
        Actualiza los datos de un usuario
        """
        try:
            user = self.get_object(pk)
            if not user:
                return Response(
                    {"error": "Usuario no encontrado"}, 
                    status=status.HTTP_404_NOT_FOUND
                )
                
            data = request.data
            profile_data = data.pop('profile', {})
            
            serializer = UserListSerializer(user, data=data, partial=True)
            if serializer.is_valid():
                # Guardar usuario actualizado
                user = serializer.save()
                
                # Actualizar campos del perfil si se proporcionaron
                if profile_data and hasattr(user, 'profile'):
                    for key, value in profile_data.items():
                        setattr(user.profile, key, value)
                    user.profile.save()
                
                # Retornar el usuario actualizado
                serializer = UserListSerializer(user)
                return Response(serializer.data)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            import traceback
            print(f"Error al actualizar usuario: {str(e)}")
            print(traceback.format_exc())
            return Response(
                {"error": f"Error al actualizar usuario: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def delete(self, request, pk):
        """
        Elimina un usuario
        """
        user = self.get_object(pk)
        if not user:
            return Response(
                {"error": "Usuario no encontrado"}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        user.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
