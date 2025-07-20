from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from django.http import FileResponse, Http404, JsonResponse
from sale_order.models.sale_order import M_sale_order
from sale_order.models.attach_sale_order import M_attach_sale_order
import logging
from sale_order.utils.pdf_weasy import generate_sale_order_pdf_weasy
from django.shortcuts import get_object_or_404


# Configurar logging
logger = logging.getLogger(__name__)

class QuotationDocumentView(APIView):
    permission_classes = [AllowAny]
    
    def get(self, request, cotizacion_id):
        """Obtener el documento de cotización principal"""
        try:
            cotizacion = M_sale_order.objects.get(id=cotizacion_id)
            if cotizacion.archivo_cotizacion:
                return FileResponse(cotizacion.archivo_cotizacion, as_attachment=True)
            raise Http404("No se encontró el documento de cotización")
        except M_sale_order.DoesNotExist:
            raise Http404("Cotización no encontrada")

# Endpoint de prueba para listar archivos adjuntos de una oferta
from rest_framework.views import APIView
from rest_framework.response import Response

class DebugAttachSaleOrderView(APIView):
    permission_classes = [AllowAny]
    
    def get(self, request):
        sale_order_id = request.query_params.get('sale_order', None)
        logger.info(f"Debug: Procesando solicitud con sale_order_id={sale_order_id}")
        
        # Si no se proporciona un ID, mostrar todos los archivos adjuntos
        query = M_attach_sale_order.objects.all()
          # Si se proporciona un ID, filtrar por ese ID
        if sale_order_id is not None and sale_order_id != "":
            query = query.filter(sale_order_id=sale_order_id)
            
        # Obtener los datos
        adjuntos = []
        for adjunto in query:
            username = None
            # Primero intentar usar uploaded_by (nuevo campo)
            if hasattr(adjunto, 'uploaded_by') and adjunto.uploaded_by:
                username = adjunto.uploaded_by.username
            # Si no existe, intentar obtener el nombre de usuario de sale_order_id
            elif hasattr(adjunto.sale_order_id, 'user_id') and adjunto.sale_order_id.user_id:
                username = adjunto.sale_order_id.user_id.username
            
            adjuntos.append({
                'id': adjunto.id,
                'name': adjunto.name,
                'size': adjunto.size,
                'date': adjunto.date,
                'content_type': adjunto.content_type,
                'sale_order_id': adjunto.sale_order_id.id,
                'sale_order_code': adjunto.sale_order_id.code if hasattr(adjunto.sale_order_id, 'code') else None,
                'attach': str(adjunto.attach.url) if adjunto.attach else None,
                'username': username
            })
            
        return Response({
            'count': len(adjuntos),
            'results': adjuntos
        })
    
def quotation_pdf_weasy_view(request, cotizacion_id):
    sale_order = get_object_or_404(M_sale_order, pk=cotizacion_id)
    pdf_path = generate_sale_order_pdf_weasy(request, sale_order)
    return FileResponse(open(pdf_path, 'rb'), content_type='application/pdf')
