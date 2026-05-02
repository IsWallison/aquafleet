"""
AquaFleet - Previsao de demanda (baseada em historico)
"""
from datetime import date, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
import numpy as np

from ..models import Empresa, Embarcacao, Coleta, Agenda
from ..schemas import PrevisaoDemanda
from .agenda_gen import calcular_frequencia_historica


def prever_proxima_coleta(db: Session, embarcacao_id: int) -> Optional[date]:
    """Preve proxima coleta baseada em historico."""
    hoje = date.today()

    # 1. Agenda futura pendente
    proxima_agenda = (
        db.query(Agenda)
        .filter(Agenda.embarcacao_id == embarcacao_id,
                Agenda.data_prevista >= hoje,
                Agenda.status == "pendente")
        .order_by(Agenda.data_prevista.asc())
        .first()
    )
    if proxima_agenda:
        return proxima_agenda.data_prevista

    # 2. Calcular com base no historico
    ultima = (
        db.query(Coleta)
        .filter(Coleta.embarcacao_id == embarcacao_id, Coleta.status == "realizada")
        .order_by(Coleta.data_coleta.desc())
        .first()
    )
    if not ultima:
        return None

    freq = calcular_frequencia_historica(db, embarcacao_id)
    if not freq:
        return None

    proxima = ultima.data_coleta + timedelta(days=int(freq))
    while proxima < hoje:
        proxima += timedelta(days=int(freq))
    return proxima


def gerar_previsao_embarcacao(db: Session, embarcacao_id: int) -> Optional[PrevisaoDemanda]:
    """Gera previsao completa para uma embarcacao."""
    emb = db.query(Embarcacao).filter(Embarcacao.id == embarcacao_id).first()
    if not emb:
        return None
    empresa = db.query(Empresa).filter(Empresa.id == emb.empresa_id).first()

    total = db.query(func.count(Coleta.id)).filter(Coleta.embarcacao_id == embarcacao_id).scalar()
    freq = calcular_frequencia_historica(db, embarcacao_id)
    proxima = prever_proxima_coleta(db, embarcacao_id)

    hoje = date.today()
    dias = (proxima - hoje).days if proxima else None

    # Status baseado em quanto tempo desde ultima coleta
    ultima = (
        db.query(Coleta)
        .filter(Coleta.embarcacao_id == embarcacao_id, Coleta.status == "realizada")
        .order_by(Coleta.data_coleta.desc())
        .first()
    )

    if not ultima or total < 2:
        status = "sem_dados"
        sugestao = "Registre mais coletas para gerar previsoes automaticas."
    elif dias is not None and dias < 0:
        status = "critico" if abs(dias) > 30 else "atrasado"
        sugestao = f"Coleta atrasada ha {abs(dias)} dias! Agendar imediatamente."
    elif dias is not None and dias <= 7:
        status = "alerta"
        sugestao = f"Proxima coleta prevista em {dias} dias."
    else:
        status = "em_dia"
        sugestao = None

    return PrevisaoDemanda(
        embarcacao_id=emb.id,
        embarcacao_nome=emb.nome,
        empresa_nome=empresa.nome if empresa else "N/A",
        proxima_coleta_prevista=proxima,
        dias_ate_proxima=dias,
        frequencia_media_dias=freq,
        total_coletas=total,
        status=status,
        sugestao=sugestao
    )


def gerar_previsao_todas(db: Session) -> List[PrevisaoDemanda]:
    """Previsoes para todas as embarcacoes ativas."""
    embarcacoes = db.query(Embarcacao).filter(Embarcacao.status == "ativa").all()
    previsoes = []
    for emb in embarcacoes:
        p = gerar_previsao_embarcacao(db, emb.id)
        if p:
            previsoes.append(p)

    ordem = {"critico": 0, "atrasado": 1, "alerta": 2, "em_dia": 3, "sem_dados": 4}
    previsoes.sort(key=lambda p: (ordem.get(p.status, 5), p.dias_ate_proxima or 999))
    return previsoes
