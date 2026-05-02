"""
AquaFleet - Router de Dashboard (simplificado)
"""
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from typing import List
from datetime import date, timedelta

from ..database import get_db
from ..models import Empresa, Embarcacao, Coleta, Agenda
from ..schemas import AlertaConformidade
from ..services.previsao import gerar_previsao_todas
from ..services.conformidade import gerar_alertas

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])


@router.get("/resumo")
def resumo(mes: int = Query(None), ano: int = Query(None), db: Session = Depends(get_db)):
    hoje = date.today()
    if not ano:
        ano = hoje.year

    if mes:
        primeiro_dia = date(ano, mes, 1)
        ultimo_dia = date(ano + (1 if mes == 12 else 0), (mes % 12) + 1, 1) - timedelta(days=1)
    else:
        primeiro_dia = date(ano, 1, 1)
        ultimo_dia = date(ano, 12, 31)

    total_empresas = db.query(func.count(Empresa.id)).scalar()
    total_embarcacoes = db.query(func.count(Embarcacao.id)).scalar()
    coletas_mes = db.query(func.count(Coleta.id)).filter(
        and_(Coleta.data_coleta >= primeiro_dia, Coleta.data_coleta <= ultimo_dia)
    ).scalar()
    total_coletas = db.query(func.count(Coleta.id)).scalar()
    
    agendas_pendentes_query = db.query(func.count(Agenda.id)).filter(Agenda.status == "pendente")
    agendas_atrasadas_query = db.query(func.count(Agenda.id)).filter(Agenda.status == "atrasada")
    
    agendas_pendentes_query = agendas_pendentes_query.filter(
        and_(Agenda.data_prevista >= primeiro_dia, Agenda.data_prevista <= ultimo_dia)
    )
    agendas_atrasadas_query = agendas_atrasadas_query.filter(
        and_(Agenda.data_prevista >= primeiro_dia, Agenda.data_prevista <= ultimo_dia)
    )
        
    agendas_pendentes = agendas_pendentes_query.scalar()
    agendas_atrasadas = agendas_atrasadas_query.scalar()

    return {
        "total_empresas": total_empresas,
        "total_embarcacoes": total_embarcacoes,
        "coletas_mes": coletas_mes,
        "total_coletas": total_coletas,
        "agendas_pendentes": agendas_pendentes,
        "total_alertas": agendas_atrasadas,
    }


@router.get("/por-embarcacao")
def por_embarcacao(mes: int = Query(None), ano: int = Query(None), db: Session = Depends(get_db)):
    hoje = date.today()
    if not ano:
        ano = hoje.year

    if mes:
        primeiro_dia = date(ano, mes, 1)
        ultimo_dia = date(ano + (1 if mes == 12 else 0), (mes % 12) + 1, 1) - timedelta(days=1)
    else:
        primeiro_dia = date(ano, 1, 1)
        ultimo_dia = date(ano, 12, 31)

    query = db.query(Embarcacao.id, Embarcacao.nome, func.count(Coleta.id).label("total"))
    coleta_filter = and_(Coleta.embarcacao_id == Embarcacao.id, Coleta.data_coleta >= primeiro_dia, Coleta.data_coleta <= ultimo_dia)
        
    resultado = (
        query.outerjoin(Coleta, coleta_filter)
        .group_by(Embarcacao.id, Embarcacao.nome)
        .all()
    )
    return [{"embarcacao_id": r[0], "nome": r[1], "total_coletas": r[2]} for r in resultado]


@router.get("/por-empresa")
def por_empresa(mes: int = Query(None), ano: int = Query(None), db: Session = Depends(get_db)):
    hoje = date.today()
    if not ano:
        ano = hoje.year

    if mes:
        primeiro_dia = date(ano, mes, 1)
        ultimo_dia = date(ano + (1 if mes == 12 else 0), (mes % 12) + 1, 1) - timedelta(days=1)
    else:
        primeiro_dia = date(ano, 1, 1)
        ultimo_dia = date(ano, 12, 31)

    query = db.query(Empresa.id, Empresa.nome, func.count(Coleta.id).label("total"))
    coleta_filter = and_(Coleta.embarcacao_id == Embarcacao.id, Coleta.data_coleta >= primeiro_dia, Coleta.data_coleta <= ultimo_dia)
        
    resultado = (
        query.outerjoin(Embarcacao, Embarcacao.empresa_id == Empresa.id)
        .outerjoin(Coleta, coleta_filter)
        .group_by(Empresa.id, Empresa.nome)
        .all()
    )
    return [{"empresa_id": r[0], "nome": r[1], "total_coletas": r[2]} for r in resultado]


@router.get("/previsao")
def previsao(dias: int = Query(90, ge=7, le=365), db: Session = Depends(get_db)):
    previsoes = gerar_previsao_todas(db)
    return {"por_embarcacao": [p.model_dump() for p in previsoes]}


@router.get("/alertas", response_model=List[AlertaConformidade])
def alertas(db: Session = Depends(get_db)):
    return gerar_alertas(db)


@router.get("/calendario")
def calendario(mes: int = Query(None, ge=1, le=12), ano: int = Query(None, ge=2020, le=2030),
               db: Session = Depends(get_db)):
    hoje = date.today()
    if not mes:
        mes = hoje.month
    if not ano:
        ano = hoje.year

    primeiro_dia = date(ano, mes, 1)
    ultimo_dia = date(ano + (1 if mes == 12 else 0), (mes % 12) + 1, 1) - timedelta(days=1)

    agendas = db.query(Agenda).filter(and_(
        Agenda.data_prevista >= primeiro_dia, Agenda.data_prevista <= ultimo_dia
    )).all()

    emb_ids = set([a.embarcacao_id for a in agendas])
    emb_map = {e.id: e.nome for e in db.query(Embarcacao).filter(Embarcacao.id.in_(emb_ids)).all()} if emb_ids else {}

    eventos = []
    for a in agendas:
        eventos.append({
            "id": f"agenda-{a.id}", "tipo": "agenda", "data": str(a.data_prevista),
            "embarcacao_id": a.embarcacao_id, "embarcacao_nome": emb_map.get(a.embarcacao_id, "?"),
            "tipo_analise": a.tipo_analise, "status": a.status,
            "horario": a.horario, "local": a.local,
        })

    return {"mes": mes, "ano": ano, "eventos": eventos}
