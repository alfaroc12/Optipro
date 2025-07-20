from rest_framework import generics
from technical_visit.models.technical_visit import M_technical_visit
from technical_visit.serializers.sz_technical_visit import sz_technical_visit_list
from rest_framework.permissions import AllowAny

class V_filter_nitCC_identification(generics.ListAPIView):
    serializer_class = sz_technical_visit_list
    permission_classes =[AllowAny]

    def get_queryset(self):
        nit_cc = self.request.query_params.get('nitCC')
        if nit_cc:
            return M_technical_visit.objects.filter(N_identification=nit_cc)
        return M_technical_visit.objects.none()
