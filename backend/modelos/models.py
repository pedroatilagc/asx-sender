from django.db import models


class Modelo(models.Model):
  TIPO_CHOICES = [
    ('texto', 'Texto'),
    ('botoes', 'Botões'),
  ]

  nome      = models.CharField(max_length=100)
  tipo      = models.CharField(max_length=10, choices=TIPO_CHOICES, default='texto')
  mensagem  = models.TextField()
  rodape    = models.CharField(max_length=60, blank=True, default='')
  botoes    = models.JSONField(default=list, blank=True)
  criado_em = models.DateTimeField(auto_now_add=True)

  class Meta:
    ordering = ['-criado_em']

  def __str__(self):
    return self.nome
