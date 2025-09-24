from django.urls import path
from proyect.views.v_proyect import V_proyect_create, V_proyect_list, V_proyect_retrive,V_proyect_update,V_proyect_delete, V_proyect_export, UpdateProjectProgress
from proyect.views.v_proyect_comentary import V_proyect_comentary_create, V_proyect_comentary_list, V_proyect_comentary_retrive, V_proyect_comentary_update
from proyect.views.v_attach_proyect import AttachProyect, V_attach_proyect_list, V_attach_proyect_retrive, V_attach_proyect_update, V_attach_proyect_PowerBi, V_attach_proyect_delete
from proyect.views.v_saleorder_to_proyect import V_sale_order_to_proyect



urlpatterns = [
    path('proyect/create/', V_proyect_create.as_view()),
    path('proyect/list/', V_proyect_list.as_view()),
    path('proyect/retrieve/<int:pk>/', V_proyect_retrive.as_view()),  # Corregido endpoint
    path('proyect/retrive/<int:pk>/', V_proyect_retrive.as_view()),   # TEMPORAL: Compatibilidad hacia atrás
    path('proyect/update/<int:pk>/', V_proyect_update.as_view()),
    path('proyect/delete/<int:pk>/', V_proyect_delete.as_view()),
    

    path('proyect_comentary/create/', V_proyect_comentary_create.as_view()),
    path('proyect_comentary/list/', V_proyect_comentary_list.as_view()),
    path('proyect_comentary/retrieve/<int:pk>/', V_proyect_comentary_retrive.as_view()),  # Corregido endpoint
    path('proyect_comentary/retrive/<int:pk>/', V_proyect_comentary_retrive.as_view()),   # TEMPORAL: Compatibilidad hacia atrás
    path('proyect_comentary/update/<int:pk>/', V_proyect_comentary_update.as_view()),

    path('attach_proyect/create/', AttachProyect.as_view()),
    path('attach_proyect/list/', V_attach_proyect_list.as_view()),
    path('attach_proyect/retrieve/<int:pk>/', V_attach_proyect_retrive.as_view()),  # Corregido endpoint
    path('attach_proyect/retrive/<int:pk>/', V_attach_proyect_retrive.as_view()),   # TEMPORAL: Compatibilidad hacia atrás
    path('attach_proyect/update/<int:pk>/', V_attach_proyect_update.as_view()),
    path('attach_proyect/delete/<int:pk>/', V_attach_proyect_delete.as_view()),

    path('sale_order_to_proyect/<int:sale_order_id>/', V_sale_order_to_proyect.as_view()),

    path('powerbi/proyectos/', V_proyect_export.as_view(), name='export_proyectos'),
    path('powerbi/attach_proyect/', V_attach_proyect_PowerBi.as_view(), name='export_attach_proyect'),
    path('powerbi/UpdateProjectProgress/', UpdateProjectProgress.as_view(), name='export_progress_percentage'),
]