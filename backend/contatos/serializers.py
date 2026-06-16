from rest_framework import serializers
from .models import Contato, normalizar_numero
import re


class ContatoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Contato
        fields = '__all__'

    def validate_numero(self, value):
        normalizado = normalizar_numero(value)
        if not re.match(r'^55\d{10,11}$', normalizado):
            raise serializers.ValidationError('Número inválido. Use formato brasileiro com DDD.')
        return normalizado
