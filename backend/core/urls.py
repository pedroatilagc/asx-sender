from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/dispositivos/', include('dispositivos.urls')),
    path('api/campanhas/', include('campanhas.urls')),
    path('api/modelos/', include('modelos.urls')),
    path('api/contatos/', include('contatos.urls')),
    path('api/mensagens/', include('mensagens.urls')),
]
