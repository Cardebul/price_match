from rest_framework import viewsets, filters
from app.models import Supplier
from app.serializers import SupplierSerializer


class SupplierViewSet(viewsets.ModelViewSet):
    queryset = Supplier.objects.all()
    serializer_class = SupplierSerializer
    search_fields = ["name", "inn"]
    filterset_fields = ["currency"]
