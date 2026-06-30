from rest_framework.routers import DefaultRouter
from app.views import SupplierViewSet, PriceListViewSet, EstimateViewSet
from app.views.catalog import ProductViewSet, ProductGroupViewSet
from app.views.project import ProjectViewSet

router = DefaultRouter()
router.register("suppliers", SupplierViewSet, basename="supplier")
router.register("price-lists", PriceListViewSet, basename="price-list")
router.register("estimate", EstimateViewSet, basename="estimate")
router.register("projects", ProjectViewSet, basename="project")
router.register("products", ProductViewSet, basename="product")
router.register("product-groups", ProductGroupViewSet, basename="product-group")


urlpatterns = router.urls
