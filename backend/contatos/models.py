import re
from django.db import models
from django.core.exceptions import ValidationError


def normalizar_numero(numero):
    digitos = re.sub(r'\D', '', str(numero or ''))
    if not digitos:
        return ''
    if not digitos.startswith('55'):
        digitos = '55' + digitos
    return digitos


def validar_numero(numero):
    if not re.match(r'^55\d{10,11}$', numero):
        raise ValidationError('Número inválido. Use formato brasileiro com DDD.')


class Contato(models.Model):
    nome      = models.CharField(max_length=150, blank=True, default='')
    numero    = models.CharField(max_length=20, unique=True, validators=[validar_numero])
    opt_out   = models.BooleanField(default=False)
    criado_em = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-criado_em']

    def save(self, *args, **kwargs):
        self.numero = normalizar_numero(self.numero)
        super().save(*args, **kwargs)

    def __str__(self):
        return f'{self.nome} — {self.numero}'
