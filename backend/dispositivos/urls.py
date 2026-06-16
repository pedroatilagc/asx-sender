from rest_framework.routers import DefaultRouter
from .views import DispositivoViewSet

router = DefaultRouter()
router.register(r'', DispositivoViewSet, basename='dispositivo')
urlpatterns = router.urls
