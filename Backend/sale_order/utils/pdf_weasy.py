from django.template.loader import render_to_string
from weasyprint import HTML
import tempfile
from django.conf import settings
from django.templatetags.static import static

def generate_sale_order_pdf_weasy(request, sale_order):
    logo_url = request.build_absolute_uri(static('img/Logo.png'))
    firma_url = request.build_absolute_uri(static('img/Firma.png'))

    html_string = render_to_string('sale_order/quotation_pdf.html', {
        'sale_order': sale_order,
        'logo_url': logo_url,
        'firma_url': firma_url,
    })

    with tempfile.NamedTemporaryFile(delete=False, suffix='.pdf') as output:
        HTML(
            string=html_string,
            base_url=request.build_absolute_uri()
        ).write_pdf(output.name)
        return output.name
