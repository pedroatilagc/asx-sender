from rest_framework.routers import DefaultRouter
from .views import ContatoViewSet

router = DefaultRouter()
router.register(r'', ContatoViewSet, basename='contatos')

urlpatterns = router.urls
