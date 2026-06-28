from rest_framework.routers import DefaultRouter
from app.views.supplier import SupplierViewSet

router = DefaultRouter()
router.register("suppliers", SupplierViewSet, basename="supplier")


urlpatterns = router.urls
