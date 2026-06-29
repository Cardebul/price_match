from rest_framework.routers import DefaultRouter
from app.views import SupplierViewSet, PriceListViewSet, EstimateViewSet

router = DefaultRouter()
router.register("suppliers", SupplierViewSet, basename="supplier")
router.register("price-lists", PriceListViewSet, basename="price-list")
router.register("estimate", EstimateViewSet, basename="estimate")


urlpatterns = router.urls
