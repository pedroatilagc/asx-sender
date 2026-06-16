from rest_framework import serializers
from .models import Modelo


class ModeloSerializer(serializers.ModelSerializer):
  class Meta:
    model = Modelo
    fields = '__all__'

  def validate(self, data):
    tipo   = data.get('tipo', 'texto')
    botoes = data.get('botoes', [])

    if tipo == 'botoes':
      if not botoes or len(botoes) == 0:
        raise serializers.ValidationError('Modelos do tipo botões precisam de pelo menos 1 botão.')
      if len(botoes) > 3:
        raise serializers.ValidationError('Máximo de 3 botões por modelo.')
      for b in botoes:
        if not b.get('titulo', '').strip():
          raise serializers.ValidationError('Todo botão precisa de um título.')
        if b.get('tipo') == 'url' and not b.get('url', '').strip():
          raise serializers.ValidationError('Botões de URL precisam de um link.')
        if b.get('tipo') == 'copiar' and not b.get('codigo', '').strip():
          raise serializers.ValidationError('Botões de copiar precisam de um código.')

    return data
