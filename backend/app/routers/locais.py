"""
AquaFleet - Router de Locais de Coleta
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from ..database import get_db
from ..models import Local

router = APIRouter(prefix="/api/locais", tags=["Locais"])


@router.get("/")
def listar(db: Session = Depends(get_db)):
    return [{"id": l.id, "nome": l.nome} for l in db.query(Local).order_by(Local.nome).all()]


@router.post("/", status_code=201)
def criar(nome: str = None, data: dict = None, db: Session = Depends(get_db)):
    """Criar novo local."""
    if data and "nome" in data:
        nome = data["nome"]
    if not nome:
        raise HTTPException(status_code=400, detail="Nome obrigatorio")
    existente = db.query(Local).filter(Local.nome == nome).first()
    if existente:
        return {"id": existente.id, "nome": existente.nome}
    obj = Local(nome=nome)
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return {"id": obj.id, "nome": obj.nome}


@router.delete("/{id}", status_code=204)
def deletar(id: int, db: Session = Depends(get_db)):
    obj = db.query(Local).filter(Local.id == id).first()
    if obj:
        db.delete(obj)
        db.commit()
