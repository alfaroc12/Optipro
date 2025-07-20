from django.urls import path
from user.views import LoginView, UserProfileView, UserListView, UserDetailView
from user.views.v_roles import RolesView
from rest_framework_simplejwt.views import TokenRefreshView

urlpatterns = [
    path('auth/login/', LoginView.as_view(), name='login'),
    path('auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('profile/', UserProfileView.as_view(), name='profile'),
    
    # URLs para administración de usuarios
    path('api/users/', UserListView.as_view(), name='user-list'),
    path('api/users/<int:pk>/', UserDetailView.as_view(), name='user-detail'),
    
    # URL para obtener roles
    path('api/roles/', RolesView.as_view(), name='role-list'),
]