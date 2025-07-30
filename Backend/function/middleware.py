"""
Middleware personalizado para Optipro
"""
import logging
import time
import gc
from django.http import JsonResponse
from django.core.cache import cache
from django.db import connection

logger = logging.getLogger(__name__)

class FileUploadTimeoutMiddleware:
    """
    Middleware para manejar timeouts en uploads de archivos y optimizar memoria
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
        
        # Optimización de memoria para requests pesadas
        if process_time > 5 or (hasattr(request, 'FILES') and request.FILES):
            # Cerrar conexiones idle
            connection.close_if_unusable_or_obsolete()
            # Forzar garbage collection
            gc.collect()
            
        return response

    def process_exception(self, request, exception):
        """
        Manejar excepciones específicas de timeout y memoria
        """
        error_msg = str(exception).lower()
        
        if "timeout" in error_msg:
            logger.error(f"Timeout en request: {request.path} - {str(exception)}")
            return JsonResponse({
                'error': 'Timeout en el procesamiento. Intente con archivos más pequeños.',
                'details': 'El servidor tardó demasiado en procesar la solicitud.'
            }, status=408)
        
        if "memory" in error_msg or "out of memory" in error_msg:
            logger.error(f"Error de memoria en request: {request.path} - {str(exception)}")
            # Limpieza agresiva en caso de error de memoria
            gc.collect()
            connection.close()
            return JsonResponse({
                'error': 'Error de memoria. Intente reducir el tamaño de los archivos.',
                'details': 'El servidor no tiene suficiente memoria para procesar la solicitud.'
            }, status=507)
        
        return None


class MemoryOptimizationMiddleware:
    """
    Middleware adicional para optimización de memoria
    """
    def __init__(self, get_response):
        self.get_response = get_response
        self.request_count = 0

    def __call__(self, request):
        self.request_count += 1
        
        # Cada 100 requests, hacer limpieza de memoria
        if self.request_count % 100 == 0:
            gc.collect()
            logger.info(f"Limpieza de memoria ejecutada después de {self.request_count} requests")
        
        response = self.get_response(request)
        
        # Cerrar conexiones después de cada request si no se están reutilizando
        if not getattr(connection, 'in_atomic_block', False):
            connection.close_if_unusable_or_obsolete()
        
        return response
