import requests
from django.conf import settings
from rest_framework import viewsets
from rest_framework.response import Response
from dispositivos.models import Dispositivo

UAZAPI_URL = settings.UAZAPI_URL


class MensagensViewSet(viewsets.ViewSet):

  def list(self, request):
    dispositivos = Dispositivo.objects.exclude(instance_token='')
    mensagens = []

    for disp in dispositivos:
      try:
        res = requests.post(
          f'{UAZAPI_URL}/message/find',
          json={'limit': 50},
          headers={'token': disp.instance_token, 'Content-Type': 'application/json'},
          timeout=15,
        )
        if res.status_code != 200:
          continue

        data  = res.json()
        itens = data if isinstance(data, list) else data.get('messages', data.get('items', []))

        for m in (itens or []):
          if m.get('fromMe'):
            continue

          conteudo = m.get('content', {})
          texto    = (
            m.get('text', '') or
            (conteudo.get('body', '') if isinstance(conteudo, dict) else '') or
            ''
          )

          mensagens.append({
            'id':            m.get('id') or m.get('messageid', ''),
            'nome':          m.get('senderName', '') or '',
            'numero':        (m.get('sender', '') or m.get('chatid', '') or '').split('@')[0],
            'dispositivo':   disp.nome,
            'instance_name': disp.instance_name,
            'mensagem':      texto,
            'messageType':   m.get('messageType', 'text'),
            'timestamp':     m.get('messageTimestamp', 0),
          })
      except requests.exceptions.RequestException:
        continue

    mensagens.sort(key=lambda x: x['timestamp'], reverse=True)
    return Response(mensagens[:100])
