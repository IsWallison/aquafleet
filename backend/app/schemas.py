"""
AquaFleet - Pydantic Schemas (Simplificado)
"""
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import date, datetime


# === EMPRESA ===
class EmpresaCreate(BaseModel):
    nome: str = Field(..., min_length=2, max_length=255)
    cnpj: str = Field(..., min_length=14, max_length=18)
    contato_nome: Optional[str] = None
    contato_email: Optional[str] = None
    contato_telefone: Optional[str] = None
    endereco: Optional[str] = None

class EmpresaUpdate(BaseModel):
    nome: Optional[str] = None
    contato_nome: Optional[str] = None
    contato_email: Optional[str] = None
    contato_telefone: Optional[str] = None
    endereco: Optional[str] = None

class EmpresaResponse(BaseModel):
    id: int
    nome: str
    cnpj: str
    contato_nome: Optional[str] = None
    contato_email: Optional[str] = None
    contato_telefone: Optional[str] = None
    endereco: Optional[str] = None
    created_at: Optional[datetime] = None
    class Config:
        from_attributes = True

class EmpresaDetailResponse(EmpresaResponse):
    embarcacoes: List["EmbarcacaoResponse"] = []


# === EMBARCACAO ===
class EmbarcacaoCreate(BaseModel):
    nome: str = Field(..., min_length=2, max_length=255)
    empresa_id: int
    tipo: Optional[str] = None
    imo_number: Optional[str] = None
    status: Optional[str] = "ativa"

class EmbarcacaoUpdate(BaseModel):
    nome: Optional[str] = None
    tipo: Optional[str] = None
    status: Optional[str] = None

class EmbarcacaoResponse(BaseModel):
    id: int
    nome: str
    empresa_id: int
    tipo: Optional[str] = None
    imo_number: Optional[str] = None
    status: Optional[str] = "ativa"
    created_at: Optional[datetime] = None
    class Config:
        from_attributes = True

class EmbarcacaoDetailResponse(EmbarcacaoResponse):
    empresa: Optional[EmpresaResponse] = None


# === COLETA ===
class ColetaCreate(BaseModel):
    embarcacao_id: int
    agenda_id: Optional[int] = None
    data_coleta: date
    tipo_analise: str
    local: Optional[str] = None
    status: Optional[str] = "realizada"
    responsavel: Optional[str] = None
    observacoes: Optional[str] = None

class ColetaResponse(BaseModel):
    id: int
    embarcacao_id: int
    agenda_id: Optional[int] = None
    data_coleta: date
    tipo_analise: str
    local: Optional[str] = None
    status: Optional[str] = None
    responsavel: Optional[str] = None
    observacoes: Optional[str] = None
    created_at: Optional[datetime] = None
    class Config:
        from_attributes = True


# === COLETA UPDATE ===
class ColetaUpdate(BaseModel):
    data_coleta: Optional[date] = None
    tipo_analise: Optional[str] = None
    local: Optional[str] = None
    responsavel: Optional[str] = None
    observacoes: Optional[str] = None


# === AGENDA ===
class AgendaCreate(BaseModel):
    embarcacao_id: int
    data_prevista: date
    horario: Optional[str] = None
    tipo_analise: str
    local: Optional[str] = None
    observacoes: Optional[str] = None

class AgendaUpdate(BaseModel):
    status: Optional[str] = None
    justificativa: Optional[str] = None

class AgendaResponse(BaseModel):
    id: int
    embarcacao_id: int
    data_prevista: date
    horario: Optional[str] = None
    tipo_analise: str
    local: Optional[str] = None
    status: Optional[str] = "pendente"
    origem: Optional[str] = "manual"
    justificativa: Optional[str] = None
    observacoes: Optional[str] = None
    created_at: Optional[datetime] = None
    class Config:
        from_attributes = True


# === PREVISAO ===
class PrevisaoDemanda(BaseModel):
    embarcacao_id: int
    embarcacao_nome: str
    empresa_nome: str
    proxima_coleta_prevista: Optional[date] = None
    dias_ate_proxima: Optional[int] = None
    frequencia_media_dias: Optional[float] = None
    total_coletas: int = 0
    status: str  # em_dia, alerta, atrasado, critico, sem_dados
    sugestao: Optional[str] = None


class AlertaConformidade(BaseModel):
    tipo: str
    severidade: str
    embarcacao_id: int
    embarcacao_nome: str
    empresa_nome: str
    mensagem: str
    data_referencia: Optional[date] = None
    dias_atraso: Optional[int] = None
    agenda_id: Optional[int] = None


# Rebuild forward refs
EmpresaDetailResponse.model_rebuild()
EmbarcacaoDetailResponse.model_rebuild()
