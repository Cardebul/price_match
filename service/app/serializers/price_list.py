from rest_framework import serializers
from app.models.price_list import PriceList


class PriceListSerializer(serializers.ModelSerializer):
    class Meta:
        model = PriceList
        fields = [
            "id", "supplier", "name", "file",
            "status", "error_message",
            "total_rows", "parsed_rows", "skipped_rows", "row_errors",
            "column_mapping", "created_at"
        ]
        read_only_fields = [
            "status", "error_message",
            "total_rows", "parsed_rows", "skipped_rows", "row_errors",
            "created_at"
        ]