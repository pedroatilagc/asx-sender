# ASX Sender

Sistema de disparos em massa via WhatsApp integrado ao Evolution API.

## Stack
- Frontend: React 18 + Vite + Tailwind CSS
- Backend: Python 3 + Django 5 + Django REST Framework
- Motor: Evolution API (Docker)
- Banco: Supabase

## Como rodar localmente

### 1. Evolution API
```bash
docker compose up -d
```
Acessa: http://localhost:8080/manager

### 2. Backend Django
```bash
cd backend
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```
API disponível em: http://localhost:8000/api/

### 3. Frontend React
```bash
cd frontend
npm install
npm run dev
```
App disponível em: http://localhost:3000
