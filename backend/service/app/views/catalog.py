from rest_framework import viewsets, decorators, response
from app.models.catalog import Product, ProductGroup
from app.serializers.catalog import ProductSerializer, ProductGroupSerializer
from app.tasks import update_product_embeddings_task


class ProductGroupViewSet(viewsets.ModelViewSet):
    queryset = ProductGroup.objects.all()
    serializer_class = ProductGroupSerializer
    search_fields = ["name"]


class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    search_fields = ["name", "article"]
    filterset_fields = ["group"]

    @decorators.action(detail=False, methods=["post"])
    def sync_embeddings(self, request):
        products_without_embeddings = Product.objects.filter(embedding__isnull=True)
        ids = list(products_without_embeddings.values_list("id", flat=True))
        if ids:
            update_product_embeddings_task.delay(ids)
        return response.Response({"status": "task_started", "count": len(ids)})
