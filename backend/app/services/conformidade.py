"""
AquaFleet - Alertas de conformidade (simplificado)
"""
from datetime import date, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import and_, func
from typing import List

from ..models import Empresa, Embarcacao, Coleta, Agenda
from ..schemas import AlertaConformidade
from .agenda_gen import calcular_frequencia_historica


def gerar_alertas(db: Session) -> List[AlertaConformidade]:
    """Gera alertas baseados em agendas atrasadas e embarcacoes sem coleta recente."""
    alertas = []
    hoje = date.today()

    # 1. Agendas atrasadas (excluir canceladas/justificadas)
    agendas_atrasadas = (
        db.query(Agenda)
        .filter(and_(
            Agenda.data_prevista < hoje,
            Agenda.status.in_(["pendente", "atrasada"]),
            Agenda.justificativa.is_(None)
        ))
        .all()
    )

    for agenda in agendas_atrasadas:
        dias_atraso = (hoje - agenda.data_prevista).days
        emb = db.query(Embarcacao).filter(Embarcacao.id == agenda.embarcacao_id).first()
        if not emb:
            continue
        # Verificar se embarcacao tem alertas silenciados
        if emb.alerta_silenciado_ate and hoje <= emb.alerta_silenciado_ate:
            continue
        emp = db.query(Empresa).filter(Empresa.id == emb.empresa_id).first()

        sev = "critica" if dias_atraso > 30 else "alta" if dias_atraso > 14 else "media" if dias_atraso > 7 else "baixa"

        alertas.append(AlertaConformidade(
            tipo="atraso",
            severidade=sev,
            embarcacao_id=emb.id,
            embarcacao_nome=emb.nome,
            empresa_nome=emp.nome if emp else "N/A",
            mensagem=f"Coleta atrasada ha {dias_atraso} dias - {agenda.tipo_analise}",
            data_referencia=agenda.data_prevista,
            dias_atraso=dias_atraso,
            agenda_id=agenda.id
        ))

    # 2. Embarcacoes sem coleta recente (mais de 120 dias)
    embarcacoes = db.query(Embarcacao).filter(Embarcacao.status == "ativa").all()
    for emb in embarcacoes:
        # Verificar se embarcacao tem alertas silenciados
        if emb.alerta_silenciado_ate and hoje <= emb.alerta_silenciado_ate:
            continue
        ultima = (
            db.query(Coleta)
            .filter(Coleta.embarcacao_id == emb.id, Coleta.status == "realizada")
            .order_by(Coleta.data_coleta.desc())
            .first()
        )
        if ultima:
            dias_sem = (hoje - ultima.data_coleta).days
            freq = calcular_frequencia_historica(db, emb.id)
            limite = freq * 1.5 if freq else 120

            if dias_sem > limite:
                emp = db.query(Empresa).filter(Empresa.id == emb.empresa_id).first()
                sev = "critica" if dias_sem > limite * 2 else "alta"
                alertas.append(AlertaConformidade(
                    tipo="sem_coleta",
                    severidade=sev,
                    embarcacao_id=emb.id,
                    embarcacao_nome=emb.nome,
                    empresa_nome=emp.nome if emp else "N/A",
                    mensagem=f"Sem coleta ha {dias_sem} dias (media historica: {freq:.0f} dias)" if freq else f"Sem coleta ha {dias_sem} dias",
                    data_referencia=ultima.data_coleta,
                    dias_atraso=dias_sem
                ))

    ordem = {"critica": 0, "alta": 1, "media": 2, "baixa": 3}
    alertas.sort(key=lambda a: ordem.get(a.severidade, 4))
    return alertas
