from rest_framework import serializers
from .models import Campanha, ContatoCampanha


class ContatoCampanhaSerializer(serializers.ModelSerializer):
    class Meta:
        model  = ContatoCampanha
        fields = '__all__'


class CampanhaSerializer(serializers.ModelSerializer):
    instancias_nomes = serializers.SerializerMethodField()
    modelo_nome      = serializers.SerializerMethodField()
    porcentagem      = serializers.SerializerMethodField()

    class Meta:
        model  = Campanha
        fields = '__all__'

    def get_instancias_nomes(self, obj):
        return list(obj.instancias.values_list('nome', flat=True))

    def get_modelo_nome(self, obj):
        return obj.modelo.nome if obj.modelo else None

    def get_porcentagem(self, obj):
        if obj.total == 0:
            return 0
        return round((obj.enviados + obj.falhas + obj.pulados) / obj.total * 100)
