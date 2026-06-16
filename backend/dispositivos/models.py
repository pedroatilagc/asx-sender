from django.db import models


class Dispositivo(models.Model):
    STATUS_CHOICES = [
        ('open', 'Conectado'),
        ('close', 'Desconectado'),
        ('connecting', 'Conectando'),
    ]

    nome          = models.CharField(max_length=100)
    instance_name = models.CharField(max_length=100, unique=True)
    numero        = models.CharField(max_length=20, blank=True)
    status        = models.CharField(max_length=20, choices=STATUS_CHOICES, default='close')
    criado_em     = models.DateTimeField(auto_now_add=True)
    atualizado_em = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Dispositivo'
        verbose_name_plural = 'Dispositivos'
        ordering = ['-criado_em']

    def __str__(self):
        return f'{self.nome} ({self.instance_name})'
