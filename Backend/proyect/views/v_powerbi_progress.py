from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny
from proyect.models.proyect import M_proyect
from proyect.models.attach_proyect import M_attach_proyect
from proyect.serializers.sz_proyect import sz_proyect_list
import re

class PowerBIProjectProgressView(APIView):
    """
    Endpoint especializado para Power BI - Progreso detallado de proyectos
    Incluye cálculo de progreso basado en documentos y estado
    """
    permission_classes = [AllowAny]
    
    def get(self, request):
        try:
            projects = M_proyect.objects.all().select_related('sale_order_id').prefetch_related('m_attach_proyect_set')
            
            projects_data = []
            
            for project in projects:
                # Obtener attachments del proyecto
                attachments = M_attach_proyect.objects.filter(proyect_id=project)
                
                # Calcular progreso basado en la misma lógica del frontend
                progress_percentage = self.calculate_project_progress(
                    attachments, 
                    project.status
                )
                
                # Datos del proyecto con información de progreso detallada
                project_data = {
                    'id': project.id,
                    'code': project.code,
                    'p_name': project.p_name,
                    'date': project.date,
                    'status': project.status,
                    'status_spanish': self.map_status_to_spanish(project.status),
                    'progress_percentage': progress_percentage,
                    
                    # Información de la orden de venta relacionada
                    'sale_order_id': project.sale_order_id.id if project.sale_order_id else None,
                    'sale_order_code': project.sale_order_id.code if project.sale_order_id else None,
                    'client_name': project.sale_order_id.name if project.sale_order_id else None,
                    'city': project.sale_order_id.city if project.sale_order_id else None,
                    'power_required': float(project.sale_order_id.power_required) if project.sale_order_id and project.sale_order_id.power_required else 0,
                    'total_quotation': float(project.sale_order_id.total_quotation) if project.sale_order_id and project.sale_order_id.total_quotation else 0,
                    'project_type': project.sale_order_id.proyect_type if project.sale_order_id else None,
                    'system_type': project.sale_order_id.system_type if project.sale_order_id else None,
                    'quoter': project.sale_order_id.cotizador if project.sale_order_id else None,
                    
                    # Conteo de documentos por categoría
                    'total_attachments': attachments.count(),
                    'planning_docs_count': self.count_planning_documents(attachments),
                    'process_docs_count': self.count_process_documents(attachments),
                    'completed_docs_count': self.count_completed_documents(attachments),
                    
                    # Detalles de documentos específicos para Power BI
                    'documents_detail': self.get_documents_detail(attachments, project.status),
                }
                
                projects_data.append(project_data)
            
            return Response({
                'count': len(projects_data),
                'data': projects_data,
                'progress_calculation_info': {
                    'planning_required_docs': [
                        'aceptacion_de_oferta',
                        'camara_de_comercio', 
                        'rut',
                        'copia_cedula_representante_legal',
                        'numero_de_contrato',
                        'polizas'
                    ],
                    'process_doc_weights': {
                        'cotizacion': 0,
                        'contrato_firmado': 10,
                        'rut': 10,
                        'camara_de_comercio': 10,
                        'cedula_representante_legal': 10,
                        'anticipo': 10,
                        'soporte_de_pago': 10,
                        'factura': 10,
                        'acta_de_inicio': 10,
                        'cronograma_de_trabajo': 5,
                        'retie': 5,
                        'legalizacion': 5,
                        'acta_de_cierre': 5
                    }
                }
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response({
                'error': 'Error al obtener datos de progreso de proyectos',
                'detail': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def map_status_to_spanish(self, status):
        """Mapear estado de la API al español"""
        status_map = {
            'planification': 'Planificación',
            'process': 'Ejecución', 
            'finaly': 'Finalizado',
            'suspendido': 'Suspendido'
        }
        return status_map.get(status, status)
    
    def calculate_project_progress(self, attachments, status):
        """Calcular progreso del proyecto basado en documentos y estado"""
        
        if status == 'finaly':
            return 100
            
        if status == 'planification':
            return self.calculate_planning_progress(attachments)
        
        if status == 'process':
            return self.calculate_process_progress(attachments)
            
        return 0
    
    def calculate_planning_progress(self, attachments):
        """Calcular progreso para estado de planificación"""
        required_docs = [
            r'aceptacion_de_oferta',
            r'camara_de_comercio',
            r'rut',
            r'copia_cedula_representante_legal', 
            r'numero_de_contrato',
            r'polizas'
        ]
        
        found_docs = 0
        for doc_pattern in required_docs:
            regex = re.compile(doc_pattern, re.IGNORECASE)
            if any(regex.search(att.name or att.attach or '') for att in attachments):
                found_docs += 1
        
        percentage_per_doc = 100 // len(required_docs)  # 16
        base_progress = found_docs * percentage_per_doc
        
        # Asegurar que llegue a 100% cuando todos los docs estén
        if found_docs == len(required_docs):
            return 100
        
        return base_progress
    
    def calculate_process_progress(self, attachments):
        """Calcular progreso para estado de proceso"""
        doc_weights = {
            'cotizacion': 0,
            'contrato_firmado': 10,
            'rut': 10,
            'camara_de_comercio': 10,
            'cedula_representante_legal': 10,
            'anticipo': 10,
            'soporte_de_pago': 10,
            'factura': 10,
            'acta_de_inicio': 10,
            'cronograma_de_trabajo': 5,
            'retie': 5,
            'legalizacion': 5,
            'acta_de_cierre': 5
        }
        
        total_progress = 0
        
        for doc_key, weight in doc_weights.items():
            regex = re.compile(doc_key, re.IGNORECASE)
            # Buscar documentos que coincidan y estén marcados como completados
            matching_attachment = None
            for att in attachments:
                if regex.search(att.name or att.attach or ''):
                    matching_attachment = att
                    break
            
            if matching_attachment and getattr(matching_attachment, 'fulfillment', '').lower() == 'completado':
                total_progress += weight
        
        return total_progress
    
    def count_planning_documents(self, attachments):
        """Contar documentos de planificación"""
        planning_patterns = [
            r'aceptacion_de_oferta',
            r'camara_de_comercio',
            r'rut',
            r'copia_cedula_representante_legal',
            r'numero_de_contrato',
            r'polizas'
        ]
        
        count = 0
        for pattern in planning_patterns:
            regex = re.compile(pattern, re.IGNORECASE)
            if any(regex.search(att.name or att.attach or '') for att in attachments):
                count += 1
        
        return count
    
    def count_process_documents(self, attachments):
        """Contar documentos de proceso"""
        process_patterns = [
            r'contrato_firmado', r'anticipo', r'soporte_de_pago',
            r'factura', r'acta_de_inicio', r'cronograma_de_trabajo', 
            r'retie', r'legalizacion', r'acta_de_cierre'
        ]
        
        count = 0
        for pattern in process_patterns:
            regex = re.compile(pattern, re.IGNORECASE)
            if any(regex.search(att.name or att.attach or '') for att in attachments):
                count += 1
                
        return count
    
    def count_completed_documents(self, attachments):
        """Contar documentos marcados como completados"""
        return sum(1 for att in attachments 
                  if getattr(att, 'fulfillment', '').lower() == 'completado')
    
    def get_documents_detail(self, attachments, status):
        """Obtener detalle de documentos para análisis en Power BI"""
        documents = []
        
        for attachment in attachments:
            documents.append({
                'name': attachment.name or '',
                'attach': attachment.attach or '',
                'date': attachment.date,
                'fulfillment': getattr(attachment, 'fulfillment', 'Pendiente'),
                'news': getattr(attachment, 'news', 'Ninguna'),
                'is_completed': getattr(attachment, 'fulfillment', '').lower() == 'completado'
            })
        
        return documents
