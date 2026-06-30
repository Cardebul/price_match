from app.models.price_list import PriceList, PriceListItem
from app.serializers.catalog import ProductSerializer
from rest_framework import serializers


class PriceListItemSerializer(serializers.ModelSerializer):
    product_details = ProductSerializer(source="product", read_only=True)

    class Meta:
        model = PriceListItem
        fields = [
            "id",
            "name",
            "article",
            "unit",
            "price",
            "match_status",
            "match_confidence",
            "match_comment",
            "product",
            "product_details",
            "row_number",
        ]


class PriceListSerializer(serializers.ModelSerializer):
    file = serializers.FileField(required=True)
    column_mapping = serializers.DictField(
        child=serializers.CharField(), required=False, default=dict
    )

    class Meta:
        model = PriceList
        fields = [
            "id",
            "supplier",
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


class PriceListSetupSerializer(serializers.Serializer):
    column_mapping = serializers.DictField(child=serializers.CharField(), required=True)
