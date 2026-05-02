"""
AquaFleet - SQLAlchemy Models (Simplificado)
Empresas, Embarcacoes, Coletas, Agenda e Locais.
"""
from sqlalchemy import (
    Column, Integer, String, Text, Date, DateTime, Boolean, ForeignKey, JSON
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum

from .database import Base


class Empresa(Base):
    __tablename__ = "empresas"

    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String(255), nullable=False, index=True)
    cnpj = Column(String(18), unique=True, nullable=False)
    contato_nome = Column(String(255))
    contato_email = Column(String(255))
    contato_telefone = Column(String(20))
    endereco = Column(Text)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

    embarcacoes = relationship("Embarcacao", back_populates="empresa", cascade="all, delete-orphan")


class Embarcacao(Base):
    __tablename__ = "embarcacoes"

    id = Column(Integer, primary_key=True, index=True)
    empresa_id = Column(Integer, ForeignKey("empresas.id"), nullable=False)
    nome = Column(String(255), nullable=False, index=True)
    tipo = Column(String(100))
    imo_number = Column(String(20), unique=True)
    status = Column(String(20), default="ativa")
    alerta_silenciado_ate = Column(Date)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

    empresa = relationship("Empresa", back_populates="embarcacoes")
    coletas = relationship("Coleta", back_populates="embarcacao", cascade="all, delete-orphan")
    agenda_items = relationship("Agenda", back_populates="embarcacao", cascade="all, delete-orphan")


class Local(Base):
    __tablename__ = "locais"

    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String(255), nullable=False, unique=True)
    created_at = Column(DateTime, default=func.now())


class Coleta(Base):
    __tablename__ = "coletas"

    id = Column(Integer, primary_key=True, index=True)
    embarcacao_id = Column(Integer, ForeignKey("embarcacoes.id"), nullable=False)
    agenda_id = Column(Integer, ForeignKey("agenda.id"))
    data_coleta = Column(Date, nullable=False)
    tipo_analise = Column(String(255), nullable=True)
    local = Column(String(255))
    status = Column(String(20), default="realizada")  # pendente, realizada, cancelada
    coletor = Column(String(255))
    observacoes = Column(Text)
    created_at = Column(DateTime, default=func.now())

    embarcacao = relationship("Embarcacao", back_populates="coletas")
    agenda_item = relationship("Agenda", back_populates="coleta")


class Agenda(Base):
    __tablename__ = "agenda"

    id = Column(Integer, primary_key=True, index=True)
    embarcacao_id = Column(Integer, ForeignKey("embarcacoes.id"), nullable=False)
    data_prevista = Column(Date, nullable=False, index=True)
    horario = Column(String(5))
    tipo_analise = Column(String(255), nullable=False)
    local = Column(String(255))
    status = Column(String(20), default="pendente")  # pendente, realizada, atrasada, cancelada
    origem = Column(String(20), default="manual")  # manual, automatica
    justificativa = Column(Text)
    observacoes = Column(Text)
    created_at = Column(DateTime, default=func.now())

    embarcacao = relationship("Embarcacao", back_populates="agenda_items")
    coleta = relationship("Coleta", back_populates="agenda_item", uselist=False)
