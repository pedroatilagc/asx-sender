import requests
from django.conf import settings
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Dispositivo
from .serializers import DispositivoSerializer

EVOLUTION_URL = settings.EVOLUTION_API_URL
EVOLUTION_KEY = settings.EVOLUTION_API_KEY
HEADERS = {
    'apikey': EVOLUTION_KEY,
    'Content-Type': 'application/json',
}


def _evo_post(path, data=None):
    return requests.post(
        f'{EVOLUTION_URL}{path}',
        json=data or {},
        headers=HEADERS,
        timeout=15,
    )


def _evo_get(path):
    return requests.get(
        f'{EVOLUTION_URL}{path}',
        headers=HEADERS,
        timeout=15,
    )


def _evo_delete(path):
    return requests.delete(
        f'{EVOLUTION_URL}{path}',
        headers=HEADERS,
        timeout=15,
    )


class DispositivoViewSet(viewsets.ModelViewSet):
    queryset = Dispositivo.objects.all()
    serializer_class = DispositivoSerializer

    def create(self, request, *args, **kwargs):
        nome          = request.data.get('nome', '').strip()
        instance_name = request.data.get('instance_name', '').strip()

        if not nome or not instance_name:
            return Response(
                {'error': 'nome e instance_name são obrigatórios.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            evo_res = _evo_post('/instance/create', {
                'instanceName': instance_name,
                'qrcode': True,
                'integration': 'WHATSAPP-BAILEYS',
            })
        except requests.exceptions.ConnectionError:
            return Response(
                {'error': 'Não foi possível conectar ao Evolution API. Verifique se está rodando.'},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        if evo_res.status_code not in [200, 201]:
            return Response(
                {'error': f'Evolution API retornou erro: {evo_res.text}'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        dispositivo = Dispositivo.objects.create(
            nome=nome,
            instance_name=instance_name,
            status='connecting',
        )

        serializer = self.get_serializer(dispositivo)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def destroy(self, request, *args, **kwargs):
        dispositivo = self.get_object()

        try:
            _evo_delete(f'/instance/delete/{dispositivo.instance_name}')
        except requests.exceptions.ConnectionError:
            pass  # Remove do banco mesmo se Evolution API estiver offline

        dispositivo.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=True, methods=['get'], url_path='qrcode')
    def qrcode(self, request, pk=None):
        dispositivo = self.get_object()

        try:
            evo_res = _evo_get(f'/instance/connect/{dispositivo.instance_name}')
        except requests.exceptions.ConnectionError:
            return Response(
                {'error': 'Evolution API indisponível.'},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        if evo_res.status_code != 200:
            return Response(
                {'error': 'Não foi possível obter o QR Code.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response(evo_res.json())

    @action(detail=True, methods=['get'], url_path='status')
    def status_conexao(self, request, pk=None):
        dispositivo = self.get_object()

        try:
            evo_res = _evo_get(f'/instance/connectionState/{dispositivo.instance_name}')
        except requests.exceptions.ConnectionError:
            return Response(
                {'error': 'Evolution API indisponível.'},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        if evo_res.status_code != 200:
            return Response({'status': 'desconhecido'})

        data        = evo_res.json()
        novo_status = data.get('instance', {}).get('state', 'close')
        numero      = data.get('instance', {}).get('profileName', '')

        dispositivo.status = novo_status
        if numero:
            dispositivo.numero = numero
        dispositivo.save()

        serializer = self.get_serializer(dispositivo)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], url_path='sincronizar')
    def sincronizar(self, request):
        try:
            evo_res = _evo_get('/instance/fetchInstances')
        except requests.exceptions.ConnectionError:
            return Response(
                {'error': 'Evolution API indisponível.'},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        if evo_res.status_code != 200:
            return Response({'error': 'Erro ao buscar instâncias.'}, status=400)

        instancias = evo_res.json()

        for inst in instancias:
            instance_name = inst.get('instance', {}).get('instanceName') or inst.get('instanceName', '')
            estado        = inst.get('instance', {}).get('state') or inst.get('connectionStatus', 'close')
            numero        = inst.get('instance', {}).get('profileName', '')

            if instance_name:
                Dispositivo.objects.filter(instance_name=instance_name).update(
                    status=estado,
                    numero=numero or '',
                )

        serializer = self.get_serializer(Dispositivo.objects.all(), many=True)
        return Response(serializer.data)
