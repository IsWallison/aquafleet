"""
AquaFleet - Router de Empresas
CRUD completo para gestão de empresas.
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from ..database import get_db
from ..models import Empresa
from ..schemas import EmpresaCreate, EmpresaUpdate, EmpresaResponse, EmpresaDetailResponse

router = APIRouter(prefix="/api/empresas", tags=["Empresas"])


@router.get("/", response_model=List[EmpresaResponse])
def listar_empresas(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    busca: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Listar todas as empresas com paginação e busca."""
    query = db.query(Empresa)
    if busca:
        query = query.filter(Empresa.nome.ilike(f"%{busca}%"))
    return query.offset(skip).limit(limit).all()


@router.post("/", response_model=EmpresaResponse, status_code=201)
def criar_empresa(empresa: EmpresaCreate, db: Session = Depends(get_db)):
    """Cadastrar nova empresa."""
    # Verificar CNPJ duplicado
    existente = db.query(Empresa).filter(Empresa.cnpj == empresa.cnpj).first()
    if existente:
        raise HTTPException(status_code=400, detail="CNPJ já cadastrado")

    db_empresa = Empresa(**empresa.model_dump())
    db.add(db_empresa)
    db.commit()
    db.refresh(db_empresa)
    return db_empresa


@router.get("/{empresa_id}", response_model=EmpresaDetailResponse)
def obter_empresa(empresa_id: int, db: Session = Depends(get_db)):
    """Obter detalhes de uma empresa com suas embarcações."""
    empresa = db.query(Empresa).filter(Empresa.id == empresa_id).first()
    if not empresa:
        raise HTTPException(status_code=404, detail="Empresa não encontrada")
    return empresa


@router.put("/{empresa_id}", response_model=EmpresaResponse)
def atualizar_empresa(empresa_id: int, empresa: EmpresaUpdate, db: Session = Depends(get_db)):
    """Atualizar dados de uma empresa."""
    db_empresa = db.query(Empresa).filter(Empresa.id == empresa_id).first()
    if not db_empresa:
        raise HTTPException(status_code=404, detail="Empresa não encontrada")

    for campo, valor in empresa.model_dump(exclude_unset=True).items():
        setattr(db_empresa, campo, valor)

    db.commit()
    db.refresh(db_empresa)
    return db_empresa


@router.delete("/{empresa_id}", status_code=204)
def deletar_empresa(empresa_id: int, db: Session = Depends(get_db)):
    """Remover uma empresa."""
    db_empresa = db.query(Empresa).filter(Empresa.id == empresa_id).first()
    if not db_empresa:
        raise HTTPException(status_code=404, detail="Empresa não encontrada")

    db.delete(db_empresa)
    db.commit()
