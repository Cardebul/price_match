from rest_framework import serializers
from app.models.project import Estimate


class EstimateSerializer(serializers.ModelSerializer):
    file = serializers.FileField(required=True)
    column_mapping = serializers.DictField(
        child=serializers.CharField(), required=False, default=dict
    )

    class Meta:
        model = Estimate
        fields = [
            "id", "project", "name", "file",
            "status", "error_message",
            "total_rows", "parsed_rows", "skipped_rows", "row_errors",
            "column_mapping", "created_at"
        ]
        read_only_fields = [
            "status", "error_message",
            "total_rows", "parsed_rows", "skipped_rows", "row_errors",
            "created_at"
        ]