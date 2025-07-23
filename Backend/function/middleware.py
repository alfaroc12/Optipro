"""
Middleware personalizado para Optipro
"""
import logging
import time
from django.http import JsonResponse

logger = logging.getLogger(__name__)

class FileUploadTimeoutMiddleware:
    """
    Middleware para manejar timeouts en uploads de archivos
    """
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        start_time = time.time()
        
        # Verificar si es una request con archivos grandes
        if request.method == 'POST' and hasattr(request, 'FILES') and request.FILES:
            total_size = sum(f.size for f in request.FILES.values() if hasattr(f, 'size'))
            if total_size > 5 * 1024 * 1024:  # 5MB
                logger.info(f"Upload de archivos grande detectado: {total_size} bytes")

        response = self.get_response(request)
        
        # Log de tiempo de procesamiento
        process_time = time.time() - start_time
        if process_time > 10:  # Log si toma más de 10 segundos
            logger.warning(f"Request lenta: {request.path} - {process_time:.2f}s")
            
        return response

    def process_exception(self, request, exception):
        """
        Manejar excepciones específicas de timeout
        """
        if "timeout" in str(exception).lower():
            logger.error(f"Timeout en request: {request.path} - {str(exception)}")
            return JsonResponse({
                'error': 'Timeout en el procesamiento. Intente con archivos más pequeños.',
                'details': 'El servidor tardó demasiado en procesar la solicitud.'
            }, status=408)
        
        return None
