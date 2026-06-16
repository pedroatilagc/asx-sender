from rest_framework import serializers
from .models import Dispositivo


class DispositivoSerializer(serializers.ModelSerializer):
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = Dispositivo
        fields = '__all__'
        read_only_fields = ['status', 'criado_em', 'atualizado_em']
