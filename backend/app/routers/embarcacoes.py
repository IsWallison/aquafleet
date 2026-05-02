"""
AquaFleet - Router de Embarcacoes (simplificado)
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from ..database import get_db
from ..models import Embarcacao, Empresa
from ..schemas import EmbarcacaoCreate, EmbarcacaoUpdate, EmbarcacaoResponse, EmbarcacaoDetailResponse

router = APIRouter(prefix="/api/embarcacoes", tags=["Embarcacoes"])


@router.get("/", response_model=List[EmbarcacaoResponse])
def listar(skip: int = 0, limit: int = 100, empresa_id: Optional[int] = None,
           status: Optional[str] = None, busca: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(Embarcacao)
    if empresa_id:
        query = query.filter(Embarcacao.empresa_id == empresa_id)
    if status:
        query = query.filter(Embarcacao.status == status)
    if busca:
        query = query.filter(Embarcacao.nome.ilike(f"%{busca}%"))
    return query.offset(skip).limit(limit).all()


@router.post("/", response_model=EmbarcacaoResponse, status_code=201)
def criar(data: EmbarcacaoCreate, db: Session = Depends(get_db)):
    if not db.query(Empresa).filter(Empresa.id == data.empresa_id).first():
        raise HTTPException(status_code=404, detail="Empresa nao encontrada")
    if data.imo_number:
        if db.query(Embarcacao).filter(Embarcacao.imo_number == data.imo_number).first():
            raise HTTPException(status_code=400, detail="IMO Number ja cadastrado")
    obj = Embarcacao(**data.model_dump())
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


@router.get("/{id}", response_model=EmbarcacaoDetailResponse)
def obter(id: int, db: Session = Depends(get_db)):
    obj = db.query(Embarcacao).filter(Embarcacao.id == id).first()
    if not obj:
        raise HTTPException(status_code=404, detail="Embarcacao nao encontrada")
    return obj


@router.put("/{id}", response_model=EmbarcacaoResponse)
def atualizar(id: int, data: EmbarcacaoUpdate, db: Session = Depends(get_db)):
    obj = db.query(Embarcacao).filter(Embarcacao.id == id).first()
    if not obj:
        raise HTTPException(status_code=404, detail="Embarcacao nao encontrada")
    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(obj, k, v)
    db.commit()
    db.refresh(obj)
    return obj


@router.delete("/{id}", status_code=204)
def deletar(id: int, db: Session = Depends(get_db)):
    obj = db.query(Embarcacao).filter(Embarcacao.id == id).first()
    if not obj:
        raise HTTPException(status_code=404, detail="Embarcacao nao encontrada")
    db.delete(obj)
    db.commit()


@router.put("/{id}/silenciar-alerta")
def silenciar_alerta(id: int, db: Session = Depends(get_db)):
    """Silenciar alertas de uma embarcacao por 90 dias."""
    from datetime import date, timedelta
    obj = db.query(Embarcacao).filter(Embarcacao.id == id).first()
    if not obj:
        raise HTTPException(status_code=404, detail="Embarcacao nao encontrada")
    obj.alerta_silenciado_ate = date.today() + timedelta(days=90)
    db.commit()
    return {"message": f"Alertas silenciados ate {obj.alerta_silenciado_ate}"}
