"""
AquaFleet - Geracao de Agenda baseada em historico
Analisa padroes de coleta e gera agenda automatica.
"""
from datetime import date, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import and_, func
import numpy as np

from ..models import Embarcacao, Coleta, Agenda


def calcular_frequencia_historica(db: Session, embarcacao_id: int):
    """Calcula frequencia media de coletas baseado no historico."""
    coletas = (
        db.query(Coleta.data_coleta)
        .filter(Coleta.embarcacao_id == embarcacao_id)
        .filter(Coleta.status == "realizada")
        .order_by(Coleta.data_coleta.asc())
        .all()
    )
    if len(coletas) < 2:
        return None

    datas = [c.data_coleta for c in coletas]
    intervalos = []
    for i in range(1, len(datas)):
        delta = (datas[i] - datas[i - 1]).days
        if delta > 0:
            intervalos.append(delta)

    if not intervalos:
        return None
    return round(float(np.mean(intervalos)), 1)


def gerar_agenda_por_historico(db: Session, embarcacao_id: int, meses_futuro: int = 6):
    """
    Gera agenda futura para uma embarcacao baseada no historico de coletas.
    Se nao houver historico suficiente, nao gera.
    """
    freq = calcular_frequencia_historica(db, embarcacao_id)
    if not freq:
        return 0

    # Ultima coleta ou agenda
    ultima_coleta = (
        db.query(Coleta.data_coleta)
        .filter(Coleta.embarcacao_id == embarcacao_id)
        .filter(Coleta.status == "realizada")
        .order_by(Coleta.data_coleta.desc())
        .first()
    )
    if not ultima_coleta:
        return 0

    # Tipo de analise mais comum
    tipo_comum = (
        db.query(Coleta.tipo_analise, func.count(Coleta.id))
        .filter(Coleta.embarcacao_id == embarcacao_id)
        .group_by(Coleta.tipo_analise)
        .order_by(func.count(Coleta.id).desc())
        .first()
    )
    tipo_analise = tipo_comum[0] if tipo_comum else "Microbiologica"

    hoje = date.today()
    limite = hoje + timedelta(days=meses_futuro * 30)
    proxima = ultima_coleta.data_coleta + timedelta(days=int(freq))

    # Pular datas passadas
    while proxima < hoje:
        proxima += timedelta(days=int(freq))

    novas = 0
    while proxima <= limite:
        existente = (
            db.query(Agenda)
            .filter(and_(
                Agenda.embarcacao_id == embarcacao_id,
                Agenda.data_prevista == proxima
            ))
            .first()
        )
        if not existente:
            db.add(Agenda(
                embarcacao_id=embarcacao_id,
                data_prevista=proxima,
                tipo_analise=tipo_analise,
                status="pendente",
                origem="automatica"
            ))
            novas += 1
        proxima += timedelta(days=int(freq))

    db.commit()
    return novas


def gerar_agenda_todas_embarcacoes(db: Session, meses_futuro: int = 6):
    """Gera agenda para todas as embarcacoes ativas com historico."""
    embarcacoes = db.query(Embarcacao).filter(Embarcacao.status == "ativa").all()
    total = 0
    for emb in embarcacoes:
        total += gerar_agenda_por_historico(db, emb.id, meses_futuro)
    return total


def atualizar_status_agenda(db: Session):
    """Marca agendas passadas como atrasadas."""
    hoje = date.today()
    atrasadas = (
        db.query(Agenda)
        .filter(and_(Agenda.status == "pendente", Agenda.data_prevista < hoje))
        .all()
    )
    for a in atrasadas:
        a.status = "atrasada"
    db.commit()
    return len(atrasadas)
