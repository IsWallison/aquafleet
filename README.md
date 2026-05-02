# AquaFleet - Sistema de Gestao de Coletas de Agua Offshore

Sistema inteligente para gestao, controle regulatorio e previsao de coletas de agua em embarcacoes offshore.

## Stack Tecnologico

- **Backend**: FastAPI (Python) + SQLAlchemy + SQLite/PostgreSQL
- **Frontend**: Next.js 16 + Recharts
- **Inteligencia**: Motor de previsao com analise de historico e conformidade

## Como Executar

### Backend

```bash
cd backend
pip install -r requirements.txt
python -m uvicorn app.main:app --reload --port 8000
```

O backend inicia em http://localhost:8000 com documentacao em http://localhost:8000/docs

### Frontend

```bash
cd frontend
npm install
npm run dev
```

O frontend inicia em http://localhost:3000

## Funcionalidades

- **Dashboard** - Visao geral com graficos, taxa de conformidade e alertas
- **Empresas** - CRUD de empresas clientes
- **Embarcacoes** - Gestao de embarcacoes por empresa
- **Normas** - Portarias 888/2021, 664/2022 e RDC 91/2022
- **Contratos** - Planos de monitoramento com geracao automatica de agenda
- **Coletas** - Registro de coletas realizadas
- **Agenda** - Agendamento automatico baseado em frequencia contratual
- **Previsao** - Inteligencia preditiva por embarcacao
- **Alertas** - Nao conformidades, atrasos e vencimentos

## API Docs

Acesse http://localhost:8000/docs para documentacao interativa (Swagger).

## Banco de Dados

O MVP usa SQLite por padrao. Para PostgreSQL, defina:

```bash
export DATABASE_URL="postgresql://user:pass@localhost:5432/aquafleet"
```
