from django.db import models
from dispositivos.models import Dispositivo
from modelos.models import Modelo


class Campanha(models.Model):
    STATUS_CHOICES = [
        ('rascunho',  'Rascunho'),
        ('enviando',  'Enviando'),
        ('pausada',   'Pausada'),
        ('concluida', 'Concluída'),
        ('cancelada', 'Cancelada'),
    ]

    nome              = models.CharField(max_length=150)
    modelo            = models.ForeignKey(Modelo, on_delete=models.SET_NULL, null=True, blank=True)
    mensagem_override = models.TextField(blank=True, default='')
    tipo_override     = models.CharField(max_length=10, blank=True, default='texto')
    instancias        = models.ManyToManyField(Dispositivo, blank=True)
    status            = models.CharField(max_length=20, choices=STATUS_CHOICES, default='rascunho')
    total             = models.IntegerField(default=0)
    enviados          = models.IntegerField(default=0)
    falhas            = models.IntegerField(default=0)
    pulados           = models.IntegerField(default=0)
    agendado_para     = models.DateTimeField(null=True, blank=True)
    iniciado_em       = models.DateTimeField(null=True, blank=True)
    concluido_em      = models.DateTimeField(null=True, blank=True)
    criado_em         = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-criado_em']

    def __str__(self):
        return self.nome


class ContatoCampanha(models.Model):
    STATUS_CHOICES = [
        ('pendente', 'Pendente'),
        ('enviado',  'Enviado'),
        ('falhou',   'Falhou'),
        ('pulado',   'Pulado'),
    ]

    campanha   = models.ForeignKey(Campanha, on_delete=models.CASCADE, related_name='contatos')
    nome       = models.CharField(max_length=150, blank=True, default='')
    numero     = models.CharField(max_length=20)
    status     = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pendente')
    instancia  = models.CharField(max_length=100, blank=True, default='')
    erro       = models.TextField(blank=True, default='')
    enviado_em = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['id']

    def __str__(self):
        return f'{self.nome} — {self.numero}'
