from django.urls import path
from product.views.v_product import V_product_create, V_product_list, V_product_retrive, V_product_update
from product.views.v_category import V_category_create, V_category_list, V_category_retrive, V_category_update

urlpatterns = [
    path('product/create/', V_product_create.as_view()),
    path('product/list/', V_product_list.as_view()),
    path('product/retrive/<int:pk>/', V_product_retrive.as_view()),
    path('product/update/<int:pk>/', V_product_update.as_view()),

    path('category/create/', V_category_create.as_view()),
    path('category/list/', V_category_list.as_view()),
    path('category/retrive/<int:pk>/', V_category_retrive.as_view()),
    path('category/update/<int:pk>/', V_category_update.as_view()),
]