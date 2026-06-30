from app.models.catalog import Product, ProductGroup
from rest_framework import serializers


class ProductGroupSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductGroup
        fields = ["id", "name", "parent"]


class ProductSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = ["id", "article", "name", "unit", "group", "embedding"]
        read_only_fields = ["embedding"]
