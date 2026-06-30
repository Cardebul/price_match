from app.views import EstimateViewSet, PriceListViewSet, SupplierViewSet
from app.views.catalog import ProductGroupViewSet, ProductViewSet
from app.views.project import ProjectViewSet
from rest_framework.routers import DefaultRouter

router = DefaultRouter()
router.register("suppliers", SupplierViewSet, basename="supplier")
router.register("price-lists", PriceListViewSet, basename="price-list")
router.register("estimate", EstimateViewSet, basename="estimate")
router.register("projects", ProjectViewSet, basename="project")
router.register("products", ProductViewSet, basename="product")
router.register("product-groups", ProductGroupViewSet, basename="product-group")


urlpatterns = router.urls
