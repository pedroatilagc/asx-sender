from rest_framework.routers import DefaultRouter
from .views import ModeloViewSet

router = DefaultRouter()
router.register(r'', ModeloViewSet, basename='modelos')

urlpatterns = router.urls
