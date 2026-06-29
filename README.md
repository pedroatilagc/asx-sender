# ASX Sender

Plataforma web para disparo em massa de mensagens via WhatsApp.

## Funcionalidades

**Campanhas**
- Criação de campanhas com nome, mensagem personalizada e lista de contatos
- Disparo em massa com controle de intervalo entre mensagens
- Acompanhamento de status em tempo real (pendente, enviando, concluída, pausada)
- Preview da mensagem antes do envio, com suporte a dark mode

**Contatos**
- Cadastro e gerenciamento de contatos com nome e número de WhatsApp
- Importação de listas para uso nas campanhas

**Modelos de Mensagem**
- Biblioteca de modelos reutilizáveis
- Personalização com variáveis dinâmicas

**Dispositivos**
- Conexão de múltiplos números de WhatsApp via QR Code
- Monitoramento do status de conexão de cada dispositivo em tempo real
- Gerenciamento de instâncias integrado à Evolution API

## Stack

- **Frontend:** React 18 + Vite + Tailwind CSS
- **Backend:** Python 3.11 + Django 5 + Django REST Framework
- **Banco de dados:** PostgreSQL (Supabase)
- **WhatsApp:** Evolution API
