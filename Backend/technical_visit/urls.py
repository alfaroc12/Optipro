from django.urls import path
from technical_visit.views.v_technical_question import V_technical_question_create, V_technical_question_list, V_technical_question_retrive, V_technical_question_update
from technical_visit.views.v_technical_visit import V_technical_visit_create, V_technical_visit_list, V_technical_visit_retrive, V_technical_visit_update
from technical_visit.views.v_filter_identification import V_filter_nitCC_identification

urlpatterns = [
    path('technical_visit/create/', V_technical_visit_create.as_view()),
    path('technical_visit/list/', V_technical_visit_list.as_view()),
    path('technical_visit/retrieve/<int:pk>/', V_technical_visit_retrive.as_view()),  # Corregido endpoint
    path('technical_visit/retrive/<int:pk>/', V_technical_visit_retrive.as_view()),   # TEMPORAL: Compatibilidad hacia atrás
    path('technical_visit/update/<int:pk>/', V_technical_visit_update.as_view()),

    path('technical_question/create/', V_technical_question_create.as_view()),
    path('technical_question/list/', V_technical_question_list.as_view()),
    path('technical_question/retrieve/<int:pk>/', V_technical_question_retrive.as_view()),  # Corregido endpoint
    path('technical_question/retrive/<int:pk>/', V_technical_question_retrive.as_view()),   # TEMPORAL: Compatibilidad hacia atrás
    path('technical_question/update/<int:pk>/', V_technical_question_update.as_view()),

    #filter 
    path ('technical-visits/nit-cc/', V_filter_nitCC_identification.as_view()),
]
]