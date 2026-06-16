from rest_framework.routers import DefaultRouter
from .views import CampanhaViewSet, ConfiguracaoViewSet

router = DefaultRouter()
router.register(r'configuracoes', ConfiguracaoViewSet, basename='configuracoes')
router.register(r'',              CampanhaViewSet,     basename='campanhas')

urlpatterns = router.urls
