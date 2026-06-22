import requests
from django.conf import settings
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Dispositivo
from .serializers import DispositivoSerializer

UAZAPI_URL   = settings.UAZAPI_URL
ADMIN_TOKEN  = settings.UAZAPI_ADMIN_TOKEN
ADMIN_HEADERS = {
    'admintoken': ADMIN_TOKEN,
    'Content-Type': 'application/json',
}


def _instance_headers(token):
    return {
        'token': token,
        'Content-Type': 'application/json',
    }


class DispositivoViewSet(viewsets.ModelViewSet):
    queryset = Dispositivo.objects.all()
    serializer_class = DispositivoSerializer

    def create(self, request, *args, **kwargs):
        nome = request.data.get('nome', '').strip()
        instance_name = request.data.get('instance_name', '').strip()

        if not nome or not instance_name:
            return Response(
                {'error': 'nome e instance_name são obrigatórios.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            res = requests.post(
                f'{UAZAPI_URL}/instance/create',
                json={'name': instance_name},
                headers=ADMIN_HEADERS,
                timeout=15,
            )
        except requests.exceptions.ConnectionError:
            return Response(
                {'error': 'Não foi possível conectar à uazapi. Verifique se está online.'},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        if res.status_code not in [200, 201]:
            return Response(
                {'error': f'uazapi retornou erro: {res.text}'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        data  = res.json()
        token = data.get('token') or data.get('instance', {}).get('token', '')

        dispositivo = Dispositivo.objects.create(
            nome=nome,
            instance_name=instance_name,
            instance_token=token,
            status='connecting',
        )

        serializer = self.get_serializer(dispositivo)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def destroy(self, request, *args, **kwargs):
        dispositivo = self.get_object()

        try:
            requests.delete(
                f'{UAZAPI_URL}/instance',
                headers=_instance_headers(dispositivo.instance_token),
                timeout=15,
            )
        except requests.exceptions.ConnectionError:
            pass

        dispositivo.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=True, methods=['get'], url_path='qrcode')
    def qrcode(self, request, pk=None):
        dispositivo = self.get_object()

        try:
            res = requests.post(
                f'{UAZAPI_URL}/instance/connect',
                json={},
                headers=_instance_headers(dispositivo.instance_token),
                timeout=15,
            )
        except requests.exceptions.ConnectionError:
            return Response(
                {'error': 'uazapi indisponível.'},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        if res.status_code != 200:
            return Response(
                {'error': 'Não foi possível obter o QR Code.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        data = res.json()
        qr = data.get('instance', {}).get('qrcode') or data.get('qrcode', '')

        return Response({'base64': qr})

    @action(detail=True, methods=['get'], url_path='status')
    def status_conexao(self, request, pk=None):
        dispositivo = self.get_object()

        try:
            res = requests.get(
                f'{UAZAPI_URL}/instance/status',
                headers=_instance_headers(dispositivo.instance_token),
                timeout=15,
            )
        except requests.exceptions.ConnectionError:
            return Response(
                {'error': 'uazapi indisponível.'},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        if res.status_code != 200:
            return Response({'status': 'desconhecido'})

        data   = res.json()
        inst   = data.get('instance', {})
        estado = inst.get('status', 'disconnected')
        numero = inst.get('profileName', '') or inst.get('owner', '')

        mapa_status = {
            'connected':    'open',
            'connecting':   'connecting',
            'disconnected': 'close',
        }
        dispositivo.status = mapa_status.get(estado, 'close')
        if numero:
            dispositivo.numero = numero
        dispositivo.save()

        serializer = self.get_serializer(dispositivo)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], url_path='sincronizar')
    def sincronizar(self, request):
        for dispositivo in Dispositivo.objects.all():
            try:
                res = requests.get(
                    f'{UAZAPI_URL}/instance/status',
                    headers=_instance_headers(dispositivo.instance_token),
                    timeout=15,
                )
                if res.status_code == 200:
                    data   = res.json()
                    inst   = data.get('instance', {})
                    estado = inst.get('status', 'disconnected')
                    mapa_status = {
                        'connected':    'open',
                        'connecting':   'connecting',
                        'disconnected': 'close',
                    }
                    dispositivo.status = mapa_status.get(estado, 'close')
                    numero = inst.get('profileName', '') or inst.get('owner', '')
                    if numero:
                        dispositivo.numero = numero
                    dispositivo.save()
            except requests.exceptions.ConnectionError:
                continue

        serializer = self.get_serializer(Dispositivo.objects.all(), many=True)
        return Response(serializer.data)
