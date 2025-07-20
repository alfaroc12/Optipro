from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.generics import CreateAPIView, ListAPIView, RetrieveAPIView, UpdateAPIView
from product.models.category import M_category
from product.serializers.sz_category import sz_category, sz_category_retrive, sz_category_list


from django.db.models import F, Q
from function.paginator import Limit_paginator


class V_category_create(CreateAPIView):
    permission_classes = [AllowAny]
    serializer_class = sz_category
    model_name = M_category

    def perform_create(self, serializer):
        return serializer.save()
    
    def create(self, request, *args, **kwargs):
        serializer = self.serializer_class(data=request.data)

        if serializer.is_valid():
            self.perform_create(serializer)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        
        error_messages = {
            "error": "Data invalid",
            "messages": serializer.errors,
        }
        return Response(error_messages, status=status.HTTP_400_BAD_REQUEST)
    

class V_category_list(ListAPIView):
    permission_classes = [AllowAny]
    serializer_class = sz_category_list
    pagination_class = Limit_paginator
    queryset = M_category.objects.all()

    def get_queryset(self): #overwrite function get_queryset, permit alter queryset initial 
        queryset = super().get_queryset()
        query = self.request.query_params.get('query', None)

        if query is not None and query != "":
            queryset = queryset.filter(
                Q(code__startswith=query) |
                Q(name__startswith=query)
            )
        return queryset
    
    def get(self, request, *args, **kwargs): #overwrite functoin get to change the default
        queryset = self.get_queryset()

        if not queryset.exists(): #if not exists data retur message error
            return Response({"message": "No results found."}, status=status.HTTP_200_OK)
        
        page = self.paginate_queryset(queryset) #asing function paginate_queryset with the queryset if valid the size of data

        if page is not None: #if page asing and return the queryset paginate
            serializer = self.get_serializer(page, many=True)
            data = serializer.data

            return self.get_paginated_response(data)

        serializer = self.get_serializer(queryset, many=True) #if queryset not valid size for paginated return queryset initial in serializer
        data = serializer.data

        return Response(data, status=status.HTTP_200_OK)
    
class V_category_retrive(RetrieveAPIView): #class retrieve return response witch data filter for pk in request
    permission_classes = [AllowAny]
    model_class = M_category
    queryset = model_class.objects.all()
    serializer_class = sz_category_retrive

class V_category_update(UpdateAPIView): #class update have request post with data for update
    permission_classes = [AllowAny]
    model_class = M_category
    queryset = model_class.objects.all()
    serializer_class = sz_category_retrive