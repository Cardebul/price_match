from app.models.catalog import Product
from app.models.project import Estimate, EstimateItem
from app.schemas.excel import MappingSchema
from app.serializers import EstimateItemSerializer, EstimateSerializer
from app.services import get_excel_preview
from app.tasks import parse_estimate_task
from pydantic import ValidationError as PydanticValidationError
from rest_framework import parsers, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response


class EstimateViewSet(viewsets.ModelViewSet):
    queryset = Estimate.objects.all().order_by("-created_at")
    serializer_class = EstimateSerializer
    filterset_fields = ["project"]
    parser_classes = [parsers.MultiPartParser, parsers.FormParser, parsers.JSONParser]

    @action(detail=True, methods=["get"])
    def preview(self, request, pk=None):
        estimate = self.get_object()
        if not estimate.file:
            return Response(
                {"error": "File not found"}, status=status.HTTP_400_BAD_REQUEST
            )

        data = get_excel_preview(estimate.file.path)
        return Response(data)

    @action(detail=True, methods=["get"])
    def items(self, request, pk=None):
        estimate = self.get_object()
        items = estimate.items.all().order_by("row_number")
        serializer = EstimateItemSerializer(items, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=["post"])
    def setup(self, request, pk=None):
        estimate = self.get_object()
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

        estimate.column_mapping = mapping
        estimate.status = "pending"
        estimate.save(update_fields=["column_mapping", "status"])

        parse_estimate_task.delay(estimate.id)

        return Response({"status": "Parsing started"})

    @action(detail=True, methods=["post"])
    def match_item(self, request, pk=None):
        item_id = request.data.get("item_id")
        product_id = request.data.get("product_id")

        try:
            item = EstimateItem.objects.get(id=item_id, estimate_id=pk)
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
            return Response(EstimateItemSerializer(item).data)
        except (EstimateItem.DoesNotExist, Product.DoesNotExist):
            return Response({"error": "Not found"}, status=status.HTTP_404_NOT_FOUND)
