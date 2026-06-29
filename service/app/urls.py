from rest_framework.routers import DefaultRouter
from app.views.supplier import SupplierViewSet
from app.views.price_list import PriceListViewSet

router = DefaultRouter()
router.register("suppliers", SupplierViewSet, basename="supplier")
router.register("price-lists", PriceListViewSet, basename="price-list")


urlpatterns = router.urls
