from rest_framework.pagination import PageNumberPagination


class StandardPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = 'page_size'   # allows ?page_size=6 from the home page
    max_page_size = 100
