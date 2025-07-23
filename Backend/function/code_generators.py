"""
Utilidades para generación de códigos únicos en Optipro
Evita conflictos de concurrencia en la base de datos
"""
import random
from datetime import datetime


def generate_unique_code(model_class, field_name='code', length=6, prefix='', max_attempts=10):
    """
    Genera un código único para cualquier modelo
    
    Args:
        model_class: Clase del modelo Django
        field_name: Nombre del campo que contiene el código (default: 'code')
        length: Longitud del código numérico (default: 6)
        prefix: Prefijo opcional para el código (default: '')
        max_attempts: Máximo número de intentos (default: 10)
    
    Returns:
        str: Código único generado
    """
    for attempt in range(max_attempts):
        if length <= 6:
            min_val = 10**(length-1)
            max_val = 10**length - 1
            numeric_code = random.randint(min_val, max_val)
        else:
            # Para códigos más largos, usar timestamp + random
            timestamp = datetime.now().strftime("%M%S")
            random_part = random.randint(10, 99)
            numeric_code = f"{timestamp}{random_part}"
        
        code = f"{prefix}{numeric_code}"
        
        # Verificar que el código no existe
        filter_kwargs = {field_name: code}
        if not model_class.objects.filter(**filter_kwargs).exists():
            return code
    
    # Fallback con timestamp si no encuentra código único
    timestamp = datetime.now().strftime("%H%M%S")
    return f"{prefix}{timestamp}"


def generate_sale_order_code():
    """Genera código único para sale_order"""
    from sale_order.models.sale_order import M_sale_order
    return generate_unique_code(M_sale_order, length=6)


def generate_technical_visit_code():
    """Genera código único para technical_visit"""
    from technical_visit.models.technical_visit import M_technical_visit
    return generate_unique_code(M_technical_visit, length=6)


def generate_proyect_code():
    """Genera código único para proyect"""
    from proyect.models.proyect import M_proyect
    return generate_unique_code(M_proyect, length=6)


def generate_technical_visit_code_with_prefix():
    """Genera código con prefijo 'VT' para technical_visit"""
    from technical_visit.models.technical_visit import M_technical_visit
    return generate_unique_code(M_technical_visit, length=4, prefix='VT')


def generate_sale_order_code_with_prefix():
    """Genera código con prefijo 'SO' para sale_order"""
    from sale_order.models.sale_order import M_sale_order
    return generate_unique_code(M_sale_order, length=4, prefix='SO')


def generate_proyect_code_with_prefix():
    """Genera código con prefijo 'PR' para proyect"""
    from proyect.models.proyect import M_proyect
    return generate_unique_code(M_proyect, length=4, prefix='PR')
