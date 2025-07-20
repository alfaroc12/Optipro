from django.urls import path
from sale_order.views.v_sale_order import V_sale_order_create, V_sale_order_list, V_sale_order_retrive, V_sale_order_update, V_sale_order_delete
from sale_order.views.v_comentary_sale_order import (
    V_comentary_sale_order_create, V_comentary_sale_order_list, 
    V_comentary_sale_order_retrive, V_comentary_sale_order_update, 
    V_comentary_sale_order_list_by_oferta, V_comentary_sale_order_get_or_create
)
from sale_order.views.v_attach_sale_order import V_attach_sale_order_create, V_attach_sale_order_list, V_attach_sale_order_retrive, V_attach_sale_order_update
from sale_order.views.v_quotation_document import QuotationDocumentView, DebugAttachSaleOrderView, quotation_pdf_weasy_view
from sale_order.views.v_simple_file_upload import SimpleFileUploadView

urlpatterns = [
    path('sale_order/create/', V_sale_order_create.as_view()),
    path('sale_order/list/', V_sale_order_list.as_view()),
    path('sale_order/retrive/<int:pk>/', V_sale_order_retrive.as_view()),
    path('sale_order/update/<int:pk>/', V_sale_order_update.as_view()),
    path('sale_order/delete/<int:pk>/', V_sale_order_delete.as_view()),

    path('comentary_sale_order/create/', V_comentary_sale_order_create.as_view()),
    path('comentary_sale_order/list/', V_comentary_sale_order_list.as_view()),
    path('comentary_sale_order/retrive/<int:pk>/', V_comentary_sale_order_retrive.as_view()),
    path('comentary_sale_order/update/<int:pk>/', V_comentary_sale_order_update.as_view()),    path('comentary_sale_order/list_by_oferta/<int:oferta_id>/', V_comentary_sale_order_list_by_oferta.as_view()),
    path('comentary_sale_order/get_or_create/<int:oferta_id>/', V_comentary_sale_order_get_or_create.as_view()),
    path('attach_sale_order/create/', V_attach_sale_order_create.as_view()),
    path('attach_sale_order/list/', V_attach_sale_order_list.as_view()),
    path('attach_sale_order/retrive/<int:pk>/', V_attach_sale_order_retrive.as_view()),
    path('attach_sale_order/update/<int:pk>/', V_attach_sale_order_update.as_view()),
    
    # Rutas duplicadas con el prefijo sale_order para mantener compatibilidad con el frontend
    path('sale_order/attach_sale_order/create/', V_attach_sale_order_create.as_view()),
    path('sale_order/attach_sale_order/list/', V_attach_sale_order_list.as_view()),
    path('sale_order/attach_sale_order/retrive/<int:pk>/', V_attach_sale_order_retrive.as_view()),    path('sale_order/attach_sale_order/update/<int:pk>/', V_attach_sale_order_update.as_view()),  
    
    # Endpoint simplificado para subida de archivos sin restricciones
    path('simple-upload/', SimpleFileUploadView.as_view(), name='simple-file-upload'),
    path('sale_order/simple-upload/', SimpleFileUploadView.as_view(), name='simple-file-upload-alt'),
      
    # API para documento principal de cotización
    # path('api/quotations/<int:cotizacion_id>/document/', QuotationDocumentView.as_view(), name='quotation-document'),
    path('api/quotations_pdf/<int:cotizacion_id>/', quotation_pdf_weasy_view, name='quotation-document-weasy'),
    
    # Endpoint de depuración
    path('debug/attach_sale_order/', DebugAttachSaleOrderView.as_view(), name='debug-attach-sale-order'),

]