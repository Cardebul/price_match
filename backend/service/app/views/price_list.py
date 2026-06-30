from rest_framework import viewsets, status, parsers
from rest_framework.decorators import action
from rest_framework.response import Response
from pydantic import ValidationError as PydanticValidationError
from app.models.price_list import PriceList, PriceListItem
from app.models.catalog import Product
from app.serializers import (
    PriceListSerializer,
    PriceListSetupSerializer,
    PriceListItemSerializer,
)
from app.schemas.excel import MappingSchema
from app.services.excel import get_excel_preview
from app.tasks import parse_price_list_task


class PriceListViewSet(viewsets.ModelViewSet):
    queryset = PriceList.objects.all().order_by("-created_at")
    serializer_class = PriceListSerializer
    filterset_fields = ["supplier"]
    parser_classes = [parsers.MultiPartParser, parsers.FormParser, parsers.JSONParser]

    @action(detail=True, methods=["get"])
    def preview(self, request, pk=None):
        price_list = self.get_object()
        if not price_list.file:
            return Response(
                {"error": "File not found"}, status=status.HTTP_400_BAD_REQUEST
            )

        data = get_excel_preview(price_list.file.path)
        return Response(data)

    @action(detail=True, methods=["post"], serializer_class=PriceListSetupSerializer)
    def setup(self, request, pk=None):
        price_list = self.get_object()
        mapping = request.data.get("column_mapping")

        if not mapping:
            return Response(
                {"error": "column_mapping is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            MappingSchema.model_validate(mapping)
        except PydanticValidationError as e:
            return Response({"error": e.errors()}, status=status.HTTP_400_BAD_REQUEST)

        price_list.column_mapping = mapping
        price_list.status = "pending"
        price_list.save(update_fields=["column_mapping", "status"])

        parse_price_list_task.delay(price_list.id)

        return Response({"status": "Parsing started"})

    @action(detail=True, methods=["get"])
    def items(self, request, pk=None):
        price_list = self.get_object()
        items = price_list.items.all().order_by("row_number")
        serializer = PriceListItemSerializer(items, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=["post"])
    def match_item(self, request, pk=None):
        item_id = request.data.get("item_id")
        product_id = request.data.get("product_id")

        try:
            item = PriceListItem.objects.get(id=item_id, price_list_id=pk)
            if product_id:
                product = Product.objects.get(id=product_id)
                item.product = product
                item.match_status = "matched"
                item.match_confidence = 1.0
                item.match_comment = "Сопоставлено вручную"
            else:
                item.product = None
                item.match_status = "no_match"
                item.match_confidence = 0.0
                item.match_comment = "Сброшено вручную"

            item.save()
            return Response(PriceListItemSerializer(item).data)
        except (PriceListItem.DoesNotExist, Product.DoesNotExist):
            return Response({"error": "Not found"}, status=status.HTTP_404_NOT_FOUND)
