"""
AquaFleet - Router de Agenda (simplificado - baseado em historico)
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import and_
from typing import List, Optional
from datetime import date, timedelta

from ..database import get_db
from ..models import Agenda
from ..schemas import AgendaCreate, AgendaUpdate, AgendaResponse
from ..services.agenda_gen import gerar_agenda_todas_embarcacoes, atualizar_status_agenda

router = APIRouter(prefix="/api/agenda", tags=["Agenda"])


@router.get("/", response_model=List[AgendaResponse])
def listar(skip: int = 0, limit: int = 100, embarcacao_id: Optional[int] = None,
           status: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(Agenda)
    if embarcacao_id:
        query = query.filter(Agenda.embarcacao_id == embarcacao_id)
    if status:
        query = query.filter(Agenda.status == status)
    return query.order_by(Agenda.data_prevista.asc()).offset(skip).limit(limit).all()


@router.post("/", response_model=AgendaResponse, status_code=201)
def criar_manual(data: AgendaCreate, db: Session = Depends(get_db)):
    """Criar agenda manualmente."""
    obj = Agenda(**data.model_dump(), status="pendente", origem="manual")
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


@router.post("/gerar")
def gerar(meses: int = 6, db: Session = Depends(get_db)):
    """Gerar agenda automatica baseada no historico de coletas."""
    atrasadas = atualizar_status_agenda(db)
    novas = gerar_agenda_todas_embarcacoes(db, meses)
    return {"novas_agendas": novas, "atrasadas_atualizadas": atrasadas}


@router.get("/proximas", response_model=List[AgendaResponse])
def proximas(dias: int = 30, db: Session = Depends(get_db)):
    hoje = date.today()
    return (
        db.query(Agenda)
        .filter(and_(
            Agenda.data_prevista >= hoje,
            Agenda.data_prevista <= hoje + timedelta(days=dias),
            Agenda.status == "pendente"
        ))
        .order_by(Agenda.data_prevista.asc())
        .all()
    )


@router.put("/{id}", response_model=AgendaResponse)
def atualizar(id: int, data: AgendaUpdate, db: Session = Depends(get_db)):
    """Atualizar status ou justificativa de um item da agenda."""
    obj = db.query(Agenda).filter(Agenda.id == id).first()
    if not obj:
        raise HTTPException(status_code=404, detail="Item de agenda nao encontrado")
    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(obj, k, v)
    db.commit()
    db.refresh(obj)
    return obj


@router.put("/{id}/cancelar", response_model=AgendaResponse)
def cancelar(id: int, db: Session = Depends(get_db)):
    """Cancelar um item da agenda."""
    obj = db.query(Agenda).filter(Agenda.id == id).first()
    if not obj:
        raise HTTPException(status_code=404, detail="Item de agenda nao encontrado")
    obj.status = "cancelada"
    db.commit()
    db.refresh(obj)
    return obj


@router.put("/{id}/justificar")
def justificar(id: int, data: AgendaUpdate, db: Session = Depends(get_db)):
    """Justificar um atraso na agenda (remove o alerta)."""
    obj = db.query(Agenda).filter(Agenda.id == id).first()
    if not obj:
        raise HTTPException(status_code=404, detail="Item de agenda nao encontrado")
    obj.justificativa = data.justificativa or "Justificado"
    obj.status = "cancelada"
    db.commit()
    db.refresh(obj)
    return obj


@router.delete("/{id}", status_code=204)
def deletar(id: int, db: Session = Depends(get_db)):
    obj = db.query(Agenda).filter(Agenda.id == id).first()
    if obj:
        db.delete(obj)
        db.commit()
