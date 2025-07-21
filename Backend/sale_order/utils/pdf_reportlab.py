from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
from reportlab.lib.utils import ImageReader
from reportlab.lib.colors import HexColor, black, white
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_RIGHT, TA_JUSTIFY
from reportlab.lib.units import inch
from django.core.files import File
from django.conf import settings
import io
import os

def generate_sale_order_pdf_reportlab(sale_order):
    """
    Genera PDF de propuesta comercial con texto justificado
    Mantiene todos los párrafos, secciones y estructura del template original
    """
    
    # Rutas de imágenes
    try:
        if hasattr(settings, 'STATIC_ROOT') and settings.STATIC_ROOT:
            logo_path = os.path.join(settings.STATIC_ROOT, 'img', 'Logo.png')
            firma_path = os.path.join(settings.STATIC_ROOT, 'img', 'Firma.png')
        else:
            logo_path = os.path.join(settings.BASE_DIR, 'static', 'img', 'Logo.png')
            firma_path = os.path.join(settings.BASE_DIR, 'static', 'img', 'Firma.png')
    except:
        logo_path = os.path.join(settings.BASE_DIR, 'static', 'img', 'Logo.png')
        firma_path = os.path.join(settings.BASE_DIR, 'static', 'img', 'Firma.png')

    buffer = io.BytesIO()
    p = canvas.Canvas(buffer, pagesize=A4)
    width, height = A4
    x_margin = 50
    y = height - 50

    # Colores exactos del HTML
    primary_blue = HexColor('#1e3a8a')
    secondary_blue = HexColor('#3b82f6')
    gray_color = HexColor('#888888')
    light_gray = HexColor('#e5e7eb')
    table_bg_even = HexColor('#f8fafc')
    total_row_bg = HexColor('#f1f5f9')

    # Crear estilos para texto justificado
    styles = getSampleStyleSheet()
    
    # Estilo para texto justificado normal
    justified_style = ParagraphStyle(
        'Justified',
        parent=styles['Normal'],
        alignment=TA_JUSTIFY,
        fontSize=10,
        leading=14,
        spaceAfter=6,
        leftIndent=0,
        rightIndent=0
    )
    
    # Estilo para texto justificado en negrita
    justified_bold_style = ParagraphStyle(
        'JustifiedBold',
        parent=styles['Normal'],
        alignment=TA_JUSTIFY,
        fontSize=10,
        leading=14,
        spaceAfter=6,
        fontName='Helvetica-Bold',
        leftIndent=0,
        rightIndent=0
    )
    
    # Estilo para títulos centrados
    title_style = ParagraphStyle(
        'Title',
        parent=styles['Normal'],
        alignment=TA_CENTER,
        fontSize=18,
        leading=22,
        fontName='Helvetica-Bold',
        textColor=primary_blue,
        spaceAfter=12
    )
    
    # Estilo para subtítulos
    subtitle_style = ParagraphStyle(
        'Subtitle',
        parent=styles['Normal'],
        alignment=TA_LEFT,
        fontSize=16,
        leading=20,
        fontName='Helvetica-Bold',
        textColor=HexColor('#222222'),
        spaceAfter=10
    )

    def draw_text_justified(text, style=justified_style, bold=False, size=10, color=black, align='justify'):
        """Función helper para dibujar texto justificado usando Paragraph"""
        nonlocal y
        
        # Crear estilo personalizado si es necesario
        if bold or size != 10 or color != black or align != 'justify':
            custom_style = ParagraphStyle(
                'Custom',
                parent=styles['Normal'],
                alignment=TA_JUSTIFY if align == 'justify' else (TA_CENTER if align == 'center' else (TA_RIGHT if align == 'right' else TA_LEFT)),
                fontSize=size,
                leading=size + 4,
                fontName='Helvetica-Bold' if bold else 'Helvetica',
                textColor=color,
                spaceAfter=6
            )
            style = custom_style
        
        # Crear párrafo
        para = Paragraph(text, style)
        
        # Calcular espacio necesario
        para_width = width - 2 * x_margin
        para_height = para.wrap(para_width, height)[1]
        
        # Verificar si necesita salto de página
        if y - para_height < 50:
            p.showPage()
            y = height - 50
        
        # Dibujar párrafo
        para.drawOn(p, x_margin, y - para_height)
        y -= para_height + 6

    def draw_text(text, bold=False, size=10, spacing=14, color=black, align='left'):
        """Función helper para dibujar texto simple (sin justificar)"""
        nonlocal y
        font = "Helvetica-Bold" if bold else "Helvetica"
        p.setFont(font, size)
        p.setFillColor(color)
        
        lines = text.split('\n') if '\n' in text else [text]
        
        for line in lines:
            if align == 'right':
                p.drawRightString(width - x_margin, y, line)
            elif align == 'center':
                p.drawCentredString(width / 2, y, line)
            else:
                p.drawString(x_margin, y, line)
            y -= spacing

    def draw_section_title(title, size=18):
        """Dibuja títulos de sección con línea decorativa"""
        nonlocal y
        y -= 20
        
        # Título principal
        p.setFont("Helvetica-Bold", size)
        p.setFillColor(primary_blue)
        p.drawString(x_margin, y, title)
        
        # Línea principal
        p.setStrokeColor(primary_blue)
        p.setLineWidth(2)
        p.line(x_margin, y - 8, width - x_margin, y - 8)
        
        # Línea decorativa pequeña
        p.setStrokeColor(secondary_blue)
        p.setLineWidth(4)
        p.line(x_margin, y - 10, x_margin + 50, y - 10)
        
        y -= 25
        p.setFillColor(black)

    def draw_subsection_title(title, size=16):
        """Dibuja subtítulos"""
        nonlocal y
        y -= 10
        p.setFont("Helvetica-Bold", size)
        p.setFillColor(HexColor('#222222'))
        p.drawString(x_margin, y, title)
        y -= 20
        p.setFillColor(black)

    def draw_geometric_elements():
        """Simula elementos geométricos decorativos del HTML"""
        # Comentar o eliminar estas líneas para quitar las barras superiores
        # # Elemento superior izquierdo
        # p.setFillColor(primary_blue)
        # p.rect(0, height - 80, 500, 80, fill=1, stroke=0)
        
        # # Elemento superior derecho
        # p.setFillColor(HexColor('#9ca3af'))
        # p.rect(width - 150, height - 80, 150, 80, fill=1, stroke=0)
        
        # Mantener solo la línea lateral derecha si la deseas
        # p.setFillColor(HexColor('#6b7280'))
        # p.rect(width - 50, height/2 - 150, 50, 300, fill=1, stroke=0)

    def format_currency(amount):
        """Formatea moneda"""
        if amount is None or amount == 0:
            return "$0.00"
        return f"${amount:,.2f}"

    def check_page_break(needed_space=100):
        """Verifica si necesita salto de página"""
        nonlocal y
        if y < needed_space:
            p.showPage()
            y = height - 50
            return True
        return False

    # === INICIO DEL CONTENIDO DEL PDF ===
    
    # Elementos decorativos de fondo
    draw_geometric_elements()

    # === HEADER ===
    # Logo
    if os.path.exists(logo_path):
        try:
            p.drawImage(ImageReader(logo_path), x_margin, y - 60,
                       width=180, preserveAspectRatio=True, mask='auto')
        except Exception as e:
            print(f"Error cargando logo: {e}")

    # NIT
    p.setFont("Helvetica-Bold", 14)
    p.setFillColor(gray_color)
    p.drawRightString(width - x_margin, y - 10, "NIT: 900954914-7")

    # Línea decorativa del header
    p.setStrokeColor(primary_blue)
    p.setLineWidth(3)
    p.line(x_margin, y - 70, width - x_margin, y - 70)

    y -= 100

    # === FECHA Y UBICACIÓN ===
    fecha_texto = f"{sale_order.city}, {getattr(sale_order, 'fecha_cotizacion', None) or sale_order.date}"
    draw_text(fecha_texto, size=12, spacing=16)

    y -= 10

    # === DESTINATARIO ===
    draw_text("Señor (a):", bold=True, size=12, spacing=16)

    recipient_lines = [
        sale_order.name or "",
        f"{sale_order.type_identification}: {sale_order.identification}",
        sale_order.city or ""
    ]

    for line in recipient_lines:
        if line.strip():
            draw_text(line, size=11, spacing=14)

    y -= 10

    # === TÍTULO DEL PROYECTO ===
    project_title = f"PROYECTO: {(sale_order.proyect_type or '').upper()}. SISTEMA {(sale_order.system_type or '').upper()}"
    draw_text(project_title, bold=True, size=12, spacing=16)

    # === SECCIÓN 1: RESUMEN FINANCIERO ===
    draw_section_title("1. RESUMEN FINANCIERO Y COSTO DEL PROYECTO:")

    # Subtítulo
    draw_subsection_title("ANÁLISIS DE PRODUCCIÓN")

    # === TABLA DE COSTOS ===
    check_page_break(200)

    # Headers de la tabla
    p.setFillColor(primary_blue)
    p.rect(x_margin, y - 25, width - 2*x_margin, 25, fill=1, stroke=0)

    p.setFont("Helvetica-Bold", 13)
    p.setFillColor(white)
    p.drawString(x_margin + 8, y - 18, "EQUIPOS")
    p.drawString(width - 150, y - 18, "VALOR")

    y -= 25
    p.setFillColor(black)

    # Items de la tabla
    items_data = [
        (getattr(sale_order, 'solar_panels', False),
         f"{getattr(sale_order, 'number_panels', 0)} PANELES DE {getattr(sale_order, 'panel_type', 0)} W",
         getattr(sale_order, 'solar_panels_price', 0)),
        
        (getattr(sale_order, 'Assembly_structures', False),
         "ESTRUCTURAS DE MONTAJE",
         getattr(sale_order, 'Assembly_structures_price', 0)),
        
        (getattr(sale_order, 'Wiring_and_cabinet', False),
         "CABLEADO Y GABINETE", 
         getattr(sale_order, 'Wiring_and_cabinet_price', 0)),
        
        (getattr(sale_order, 'Legalization_and_designs', False),
         "LEGALIZACIÓN Y DISEÑO",
         getattr(sale_order, 'Legalization_and_designs_price', 0)),
        
        (getattr(sale_order, 'batterys', False),
         "SUMINISTROS DE BATERÍAS",
         getattr(sale_order, 'batterys_price', 0)),
        
        (getattr(sale_order, 'investors', False),
         "INVERSOR",
         getattr(sale_order, 'investors_price', 0)),
        
        (getattr(sale_order, 'Kit_5kw', False),
         "KIT 5KW",
         getattr(sale_order, 'Kit_5kw_price', 0)),
        
        (getattr(sale_order, 'Kit_8kw', False),
         "KIT 8KW",
         getattr(sale_order, 'Kit_8kw_price', 0)),
        
        (getattr(sale_order, 'Kit_12kw', False),
         "KIT 12KW",
         getattr(sale_order, 'Kit_12kw_price', 0)),
        
        (getattr(sale_order, 'Kit_15kw', False),
         "KIT 15KW",
         getattr(sale_order, 'Kit_15kw_price', 0)),
        
        (getattr(sale_order, 'Kit_30kw', False),
         "KIT 30KW",
         getattr(sale_order, 'Kit_30kw_price', 0)),
        
        (getattr(sale_order, 'Transport', False),
         "TRANSPORTE",
         getattr(sale_order, 'Transport_price', 0)),
        
        (getattr(sale_order, 'workforce', False),
         "MANO DE OBRA",
         getattr(sale_order, 'workforce_price', 0)),
        
        (getattr(sale_order, 'Microinverters', False),
         "OTROS CONCEPTOS",
         getattr(sale_order, 'Microinverters_price', 0)),
    ]

    # Dibujar filas de la tabla
    row_count = 0
    p.setFont("Helvetica", 12)

    for condition, description, price in items_data:
        if condition and price and price > 0:
            check_page_break(50)
            
            # Fondo alternado
            if row_count % 2 == 1:
                p.setFillColor(table_bg_even)
                p.rect(x_margin, y - 16, width - 2*x_margin, 16, fill=1, stroke=0)
            
            # Bordes de celda
            p.setStrokeColor(light_gray)
            p.setLineWidth(1)
            p.rect(x_margin, y - 16, width - 2*x_margin, 16, fill=0, stroke=1)
            
            # Contenido de la celda
            p.setFillColor(black)
            p.drawString(x_margin + 8, y - 12, description)
            p.drawRightString(width - x_margin - 8, y - 12, format_currency(price))
            
            y -= 16
            row_count += 1

    # Fila total
    check_page_break(50)

    # Fondo de la fila total
    p.setFillColor(total_row_bg)
    p.rect(x_margin, y - 20, width - 2*x_margin, 20, fill=1, stroke=0)

    # Texto de la fila total
    p.setFont("Helvetica-Bold", 13)
    p.setFillColor(primary_blue)

    total_description = f"SISTEMA {(sale_order.system_type or '').upper()} DE {getattr(sale_order, 'power_required', 0)} KW {(getattr(sale_order, 'Type_installation', '') or '').upper()}"
    p.drawString(x_margin + 8, y - 15, total_description)
    p.drawRightString(width - x_margin - 8, y - 15, format_currency(getattr(sale_order, 'total_quotation', 0)))

    y -= 40
    p.setFillColor(black)

    # === SECCIÓN 2: PROPUESTA DE SERVICIOS (TEXTO JUSTIFICADO) ===
    if hasattr(sale_order, 'description') and sale_order.description:
        check_page_break(100)
        draw_section_title("2. PROPUESTA DE SERVICIOS:")
        
        # Usar texto justificado para la descripción
        description_text = sale_order.description.replace('\n', '<br/>')
        draw_text_justified(description_text, justified_style)

    # === SECCIÓN 3: RESUMEN DEL PROYECTO (TEXTO JUSTIFICADO) ===
    check_page_break(200)
    draw_section_title("3. RESUMEN DEL PROYECTO:")

    # Texto del resumen justificado
    resumen_texto = f"El sistema {(sale_order.system_type or '').upper()} propuesto tiene una potencia de {getattr(sale_order, 'power_required', 0)} kW."
    draw_text_justified(resumen_texto, justified_style)

    if hasattr(sale_order, 'description_2') and sale_order.description_2:
        description_2_text = sale_order.description_2.replace('\n', '<br/>')
        draw_text_justified(description_2_text, justified_style)

    # === SECCIÓN 4: ANOTACIÓN IMPORTANTE (TEXTO JUSTIFICADO) ===
    check_page_break(150)
    draw_section_title("4. ANOTACIÓN IMPORTANTE:")

    # Texto completo de la anotación justificado
    anotacion_texto = """Al realizar este proyecto usted tendrá el derecho a deducir su renta, en un periodo no mayor a 15 años, contados a partir del año gravable siguiente en el que haya entrado en operación la inversión, el 50% del total de la inversión realizada; tal como el artículo 11 de la Ley 1715 de 2014."""
    
    draw_text_justified(anotacion_texto, justified_style)

    # === SECCIÓN 5: NOTAS ACLARATORIAS ===
    check_page_break(300)
    draw_section_title("5. NOTAS ACLARATORIAS:")

    # Validez de la oferta
    validez_texto = f"<b>VALIDEZ DE LA OFERTA:</b> La oferta es válida por {getattr(sale_order, 'Validity_offer', 'quince (15)')} días calendario."
    draw_text_justified(validez_texto, justified_bold_style)

    # Confidencialidad (texto justificado)
    confidencialidad_texto = """<b>CONFIDENCIALIDAD:</b> Para proteger los derechos de las partes, sobre la respectiva información propiedad de ésta o sus afiliadas, se acuerda: Sin el previo consentimiento por escrito de la parte que revela información, la otra no divulgará, proveerá o suministrará, ninguna parte de la información, propiedad de la relevante o de sus empresas afiliadas, en ninguna forma, ni a ninguna persona, excepto a sus empleados, funcionarios, o directores, cuyo acceso a la información propiedad de la parte reveladora o de alguna de sus afiliadas, sea necesario para permitir la ejecución del presente oferta. Las partes se comprometen a tomar las medidas razonables y las mismas precauciones protectoras que usan para proteger su propia información, de cualquier divulgación a terceros."""

    draw_text_justified(confidencialidad_texto, justified_style)

    # === SECCIÓN FINAL ===
    check_page_break(200)

    # Forma de pago (justificado)
    pago_texto = f"<b>FORMA DE PAGO:</b> {getattr(sale_order, 'payment_type', '50% Anticipo, 30% Al recibir los equipos y 20% a recibido a satisfacción')}."
    draw_text_justified(pago_texto, justified_bold_style)

    # Tiempo de entrega (justificado)
    entrega_texto = f"<b>TIEMPO DE ENTREGA:</b> {getattr(sale_order, 'Delivery_deadline', '90')} Días."
    draw_text_justified(entrega_texto, justified_bold_style)

    # Garantía (justificado)
    garantia_texto = f"<b>GARANTÍA:</b> {getattr(sale_order, 'Warranty', 'Paneles: 10 Años, Inversor: 7 Años, Batería: 5 Años')}"
    draw_text_justified(garantia_texto, justified_bold_style)

    # === SECCIÓN DE FIRMA Y CONTACTO ===
    check_page_break(150)

    # Firma
    if os.path.exists(firma_path):
        try:
            p.drawImage(ImageReader(firma_path), x_margin, y - 160,
                       width=180, preserveAspectRatio=True, mask='auto')
        except Exception as e:
            print(f"Error cargando firma: {e}")

    y -= 50

    # Línea de firma
    p.setStrokeColor(black)
    p.setLineWidth(1)
    p.line(x_margin, y, x_margin + 200, y)
    y -= 20

    # Datos del firmante
    p.setFont("Helvetica-Bold", 10)
    draw_text("CARLOS TERRIOS", bold=True, size=10, spacing=14)
    draw_text("Gerente Comercial", size=10, spacing=14)
    draw_text("PROINGELECTRIC SAS", size=10, spacing=14)

    # === SECCIÓN DE CONTACTO ===
    # Posicionar en la esquina derecha
    contact_x = width - 300
    contact_y = y - 0

    # Fondo de la sección de contacto
    p.setFillColor(HexColor('#f8fafc'))
    p.roundRect(contact_x, contact_y - 120, 280, 120, 8, fill=1, stroke=0)

    # Borde izquierdo azul
    p.setFillColor(secondary_blue)
    p.rect(contact_x, contact_y - 120, 4, 120, fill=1, stroke=0)

    # Título CONTACTO
    p.setFont("Helvetica-Bold", 14)
    p.setFillColor(primary_blue)
    p.drawCentredString(contact_x + 140, contact_y - 20, "CONTACTO")

    # Información de contacto
    p.setFont("Helvetica", 11)
    p.setFillColor(black)

    contact_info = [
        ("Dir:", "Carrera 14 #4A -43 Santa Marta"),
        ("Tel:", "301 7535841"),
        ("Web:", "www.proingelectric.com.co"),
        ("Email:", "proingelectricsas@gmail.com")
    ]

    contact_item_y = contact_y - 40
    for label, value in contact_info:
        p.setFont("Helvetica-Bold", 11)
        p.setFillColor(primary_blue)
        p.drawString(contact_x + 15, contact_item_y, label)
        
        p.setFont("Helvetica", 11)
        p.setFillColor(black)
        p.drawString(contact_x + 75, contact_item_y, value)
        
        contact_item_y -= 18

    # Finalizar PDF
    p.showPage()
    p.save()
    buffer.seek(0)

    # Retornar archivo
    filename = f"cotizacion_{getattr(sale_order, 'code', 'documento')}.pdf"
    return File(buffer, name=filename)



