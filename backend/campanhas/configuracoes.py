import json
import os

CONFIG_PATH = os.path.join(os.path.dirname(__file__), 'config.json')

DEFAULTS = {
    'intervalo_min':  20,
    'intervalo_max':  90,
    'modo_suspensao': True,
    'suspensao_apos': 40,
    'suspensao_min':  900,
    'suspensao_max':  1800,
}


def ler_config():
    if not os.path.exists(CONFIG_PATH):
        salvar_config(DEFAULTS)
    with open(CONFIG_PATH, 'r') as f:
        data = json.load(f)
    for k, v in DEFAULTS.items():
        data.setdefault(k, v)
    return data


def salvar_config(data):
    with open(CONFIG_PATH, 'w') as f:
        json.dump(data, f, indent=2)
