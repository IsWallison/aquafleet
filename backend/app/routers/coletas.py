"""
AquaFleet - Router de Coletas (simplificado)
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from ..database import get_db
from ..models import Coleta, Embarcacao, Agenda
from ..schemas import ColetaCreate, ColetaUpdate, ColetaResponse

router = APIRouter(prefix="/api/coletas", tags=["Coletas"])


@router.get("/", response_model=List[ColetaResponse])
def listar(skip: int = 0, limit: int = 100, embarcacao_id: Optional[int] = None,
           status: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(Coleta)
    if embarcacao_id:
        query = query.filter(Coleta.embarcacao_id == embarcacao_id)
    if status:
        query = query.filter(Coleta.status == status)
    return query.order_by(Coleta.data_coleta.desc()).offset(skip).limit(limit).all()


@router.post("/", response_model=ColetaResponse, status_code=201)
def registrar(data: ColetaCreate, db: Session = Depends(get_db)):
    if not db.query(Embarcacao).filter(Embarcacao.id == data.embarcacao_id).first():
        raise HTTPException(status_code=404, detail="Embarcacao nao encontrada")
    obj = Coleta(**data.model_dump())
    db.add(obj)
    # Atualizar agenda vinculada
    if data.agenda_id:
        agenda = db.query(Agenda).filter(Agenda.id == data.agenda_id).first()
        if agenda:
            agenda.status = "realizada"
    db.commit()
    db.refresh(obj)
    return obj


@router.get("/{id}", response_model=ColetaResponse)
def obter(id: int, db: Session = Depends(get_db)):
    obj = db.query(Coleta).filter(Coleta.id == id).first()
    if not obj:
        raise HTTPException(status_code=404, detail="Coleta nao encontrada")
    return obj


@router.put("/{id}", response_model=ColetaResponse)
def atualizar(id: int, data: ColetaUpdate, db: Session = Depends(get_db)):
    """Atualizar dados de uma coleta (data, tipo, responsavel, etc)."""
    obj = db.query(Coleta).filter(Coleta.id == id).first()
    if not obj:
        raise HTTPException(status_code=404, detail="Coleta nao encontrada")
    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(obj, k, v)
    db.commit()
    db.refresh(obj)
    return obj


@router.delete("/{id}", status_code=204)
def deletar(id: int, db: Session = Depends(get_db)):
    obj = db.query(Coleta).filter(Coleta.id == id).first()
    if not obj:
        raise HTTPException(status_code=404, detail="Coleta nao encontrada")
    db.delete(obj)
    db.commit()
