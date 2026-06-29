from rest_framework import viewsets, status, parsers
from rest_framework.decorators import action
from rest_framework.response import Response
from pydantic import ValidationError as PydanticValidationError
from app.models.project import Estimate
from app.serializers import EstimateSerializer
from app.schemas.excel import MappingSchema
from app.services.excel import get_excel_preview
from app.tasks import parse_estimate_task


class EstimateViewSet(viewsets.ModelViewSet):
    queryset = Estimate.objects.all().order_by("-created_at")
    serializer_class = EstimateSerializer
    filterset_fields = ["project"]
    parser_classes = [parsers.MultiPartParser, parsers.FormParser, parsers.JSONParser]

    @action(detail=True, methods=["get"])
    def preview(self, request, pk=None):
        estimate = self.get_object()
        if not estimate.file:
            return Response({"error": "File not found"}, status=status.HTTP_400_BAD_REQUEST)

        data = get_excel_preview(estimate.file.path)
        return Response(data)

    @action(detail=True, methods=["post"])
    def setup(self, request, pk=None):
        estimate = self.get_object()
        mapping = request.data.get("column_mapping")

        if not mapping:
            return Response({"error": "column_mapping is required"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            MappingSchema.model_validate(mapping)
        except PydanticValidationError as e:
            return Response({"error": e.errors()}, status=status.HTTP_400_BAD_REQUEST)

        estimate.column_mapping = mapping
        estimate.status = "pending"
        estimate.save(update_fields=["column_mapping", "status"])

        parse_estimate_task.delay(estimate.id)

        return Response({"status": "Parsing started"})