from rest_framework.pagination import PageNumberPagination
# from rest_framework.pagination import LimitOffsetPagination

class Limit_paginator(PageNumberPagination):
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 20