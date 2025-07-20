from django.urls import path
from person.views.v_person import V_person_create, V_person_uptade, V_person_list, V_person_retrive
from person.views.v_choices import get_choices

urlpatterns = [
    path('person/choices/', get_choices),
    path('person/create/', V_person_create.as_view()),
    path('person/list/', V_person_list.as_view()),
    path('person/retrive/<int:pk>/', V_person_retrive.as_view()),
    path('person/update/<int:pk>/', V_person_uptade.as_view()),
]