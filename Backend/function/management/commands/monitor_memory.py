"""
Comando de gestión para monitorear el uso de memoria y recursos
"""
import gc
import logging
import psutil
import os
from django.core.management.base import BaseCommand
from django.db import connection

logger = logging.getLogger(__name__)

class Command(BaseCommand):
    help = 'Monitorea el uso de memoria y recursos del servidor'

    def add_arguments(self, parser):
        parser.add_argument(
            '--cleanup',
            action='store_true',
            help='Ejecutar limpieza de memoria y recursos',
        )
        parser.add_argument(
            '--verbose',
            action='store_true',
            help='Mostrar información detallada',
        )

    def handle(self, *args, **options):
        try:
            # Obtener información del proceso
            process = psutil.Process(os.getpid())
            
            # Información de memoria
            memory_info = process.memory_info()
            memory_percent = process.memory_percent()
            
            # Información de CPU
            cpu_percent = process.cpu_percent()
            
            # Información de conexiones de red
            connections = process.connections()
            
            self.stdout.write(
                self.style.SUCCESS(
                    f"Estado del worker - PID: {process.pid}\n"
                    f"Memoria RSS: {memory_info.rss / 1024 / 1024:.2f} MB\n"
                    f"Memoria VMS: {memory_info.vms / 1024 / 1024:.2f} MB\n"
                    f"Porcentaje de memoria: {memory_percent:.2f}%\n"
                    f"CPU: {cpu_percent:.2f}%\n"
                    f"Conexiones activas: {len(connections)}\n"
                )
            )
            
            if options['verbose']:
                # Información detallada de garbage collection
                gc_stats = gc.get_stats()
                self.stdout.write(f"Estadísticas GC: {gc_stats}")
                
                # Información de conexiones DB
                db_queries = len(connection.queries)
                self.stdout.write(f"Queries DB ejecutadas: {db_queries}")
            
            if options['cleanup']:
                self.stdout.write("Ejecutando limpieza de memoria...")
                
                # Cerrar conexiones DB innecesarias
                connection.close_if_unusable_or_obsolete()
                
                # Ejecutar garbage collection
                collected = gc.collect()
                
                self.stdout.write(
                    self.style.SUCCESS(
                        f"Limpieza completada. Objetos recolectados: {collected}"
                    )
                )
                
                # Mostrar memoria después de la limpieza
                new_memory_info = process.memory_info()
                memory_saved = (memory_info.rss - new_memory_info.rss) / 1024 / 1024
                
                self.stdout.write(
                    self.style.SUCCESS(
                        f"Memoria liberada: {memory_saved:.2f} MB"
                    )
                )
            
            # Alerta si el uso de memoria es muy alto
            if memory_percent > 80:
                self.stdout.write(
                    self.style.WARNING(
                        f"¡ALERTA! Uso de memoria alto: {memory_percent:.2f}%"
                    )
                )
            
            # Alerta si hay muchas conexiones
            if len(connections) > 100:
                self.stdout.write(
                    self.style.WARNING(
                        f"¡ALERTA! Muchas conexiones activas: {len(connections)}"
                    )
                )
                
        except Exception as e:
            logger.error(f"Error monitoreando recursos: {str(e)}")
            self.stdout.write(
                self.style.ERROR(f"Error: {str(e)}")
            )
