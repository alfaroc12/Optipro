from django.contrib.auth.models import User
from user.models.profile import UserProfile

class M_user(User):
    class Meta:
        proxy = True