from rest_framework.routers import DefaultRouter
from .views import MensagensViewSet

router = DefaultRouter()
router.register(r'', MensagensViewSet, basename='mensagens')

urlpatterns = router.urls
