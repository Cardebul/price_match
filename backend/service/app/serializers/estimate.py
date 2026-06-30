from app.models.project import Estimate, EstimateItem
from app.serializers.catalog import ProductSerializer
from rest_framework import serializers


class EstimateItemSerializer(serializers.ModelSerializer):
    product_details = ProductSerializer(source="product", read_only=True)

    class Meta:
        model = EstimateItem
        fields = [
            "id",
            "name",
            "article",
            "unit",
            "quantity",
            "match_status",
            "match_confidence",
            "match_comment",
            "product",
            "product_details",
            "prices",
            "row_number",
        ]


class EstimateSerializer(serializers.ModelSerializer):
    file = serializers.FileField(required=True)
    column_mapping = serializers.DictField(
        child=serializers.CharField(), required=False, default=dict
    )

    class Meta:
        model = Estimate
        fields = [
            "id",
            "project",
            "name",
            "file",
            "status",
            "error_message",
            "total_rows",
            "parsed_rows",
            "skipped_rows",
            "row_errors",
            "column_mapping",
            "created_at",
        ]
        read_only_fields = [
            "status",
            "error_message",
            "total_rows",
            "parsed_rows",
            "skipped_rows",
            "row_errors",
            "created_at",
        ]
