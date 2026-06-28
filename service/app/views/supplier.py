from rest_framework import viewsets, filters
from app.models import Supplier
from app.serializers.supplier import SupplierSerializer


class SupplierViewSet(viewsets.ModelViewSet):
    queryset = Supplier.objects.all()
    serializer_class = SupplierSerializer
    filter_backends = [filters.SearchFilter]
    search_fields = ["name", "inn"]
