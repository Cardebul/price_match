from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from pydantic import ValidationError as PydanticValidationError
from app.models.price_list import PriceList
from app.serializers import PriceListSerializer
from app.schemas.excel import MappingSchema
from app.services.excel import get_excel_preview
from app.tasks import parse_price_list_task


class PriceListViewSet(viewsets.ModelViewSet):
    queryset = PriceList.objects.all().order_by("-created_at")
    serializer_class = PriceListSerializer
    filterset_fields = ["supplier"]

    @action(detail=True, methods=["get"])
    def preview(self, request, pk=None):
        price_list = self.get_object()
        if not price_list.file:
            return Response({"error": "File not found"}, status=status.HTTP_400_BAD_REQUEST)

        data = get_excel_preview(price_list.file.path)
        return Response(data)

    @action(detail=True, methods=["post"])
    def setup(self, request, pk=None):
        price_list = self.get_object()
        mapping = request.data.get("column_mapping")

        if not mapping:
            return Response({"error": "column_mapping is required"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            MappingSchema.model_validate(mapping)
        except PydanticValidationError as e:
            return Response({"error": e.errors()}, status=status.HTTP_400_BAD_REQUEST)

        price_list.column_mapping = mapping
        price_list.status = "pending"
        price_list.save(update_fields=["column_mapping", "status"])

        parse_price_list_task.delay(price_list.id)

        return Response({"status": "Parsing started"})