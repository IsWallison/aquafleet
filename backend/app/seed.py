"""
AquaFleet - Dados de demonstracao (Simplificado)
"""
from datetime import date, timedelta
from sqlalchemy.orm import Session
import random

from .models import Empresa, Embarcacao, Coleta, Agenda, Local
from .services.agenda_gen import gerar_agenda_por_historico


def seed_database(db: Session):
    if db.query(Empresa).count() > 0:
        return False

    # Empresas
    empresas = [
        Empresa(nome="Petrobras S.A.", cnpj="33.000.167/0001-01", contato_nome="Carlos Silva", contato_email="carlos.silva@petrobras.com", contato_telefone="(21) 3224-1234"),
        Empresa(nome="Shell Brasil Petroleo", cnpj="10.456.789/0001-00", contato_nome="Ana Rocha", contato_email="ana.rocha@shell.com", contato_telefone="(21) 3456-7890"),
        Empresa(nome="Equinor Brasil", cnpj="02.472.789/0001-00", contato_nome="Erik Hansen", contato_email="erik.hansen@equinor.com", contato_telefone="(21) 2222-3333"),
        Empresa(nome="TotalEnergies EP Brasil", cnpj="05.891.234/0001-00", contato_nome="Marie Dupont", contato_email="marie.dupont@totalenergies.com", contato_telefone="(21) 4444-5555"),
    ]
    db.add_all(empresas)
    db.flush()

    # Embarcacoes
    emb_data = [
        ("P-76", "FPSO", "9802010", empresas[0].id),
        ("P-77", "FPSO", "9802011", empresas[0].id),
        ("P-80", "FPSO", "9802012", empresas[0].id),
        ("NS Orion", "Navio-sonda", "9802013", empresas[0].id),
        ("FPSO Fluminense", "FPSO", "9803001", empresas[1].id),
        ("BC-10 FPSO", "FPSO", "9803002", empresas[1].id),
        ("Peregrino FPSO", "FPSO", "9804001", empresas[2].id),
        ("Bacalhau FPSO", "FPSO", "9804002", empresas[2].id),
        ("FPSO Lapa", "FPSO", "9805001", empresas[3].id),
        ("Mero FPSO", "FPSO", "9805002", empresas[3].id),
    ]

    embarcacoes = []
    for nome, tipo, imo, emp_id in emb_data:
        emb = Embarcacao(nome=nome, tipo=tipo, imo_number=imo, empresa_id=emp_id)
        embarcacoes.append(emb)
    db.add_all(embarcacoes)
    db.flush()

    # Locais de coleta
    locais_nomes = [
        "Aeroporto de Macae", "Porto do Acu", "Cabo Frio",
        "Porto de Niteroi", "Base de Macae", "Terminal de Imbetiba",
    ]
    for nome in locais_nomes:
        db.add(Local(nome=nome))
    db.flush()

    # Coletas historicas
    hoje = date.today()
    responsaveis = ["Dr. Joao Mendes", "Dra. Maria Costa", "Tec. Paulo Souza", "Tec. Fernanda Lima"]
    tipos = ["Microbiologica", "Fisico-quimica", "Microbiologica e Fisico-quimica"]

    for emb in embarcacoes:
        num = random.randint(6, 12)
        data_base = hoje - timedelta(days=num * 45)

        for i in range(num):
            data_col = data_base + timedelta(days=i * random.randint(30, 60))
            if data_col > hoje:
                break
            coleta = Coleta(
                embarcacao_id=emb.id,
                data_coleta=data_col,
                tipo_analise=random.choice(tipos),
                local=random.choice(locais_nomes),
                status="realizada",
                coletor=random.choice(responsaveis),
            )
            db.add(coleta)

    db.commit()

    # Gerar agenda baseada no historico
    for emb in embarcacoes:
        gerar_agenda_por_historico(db, emb.id, meses_futuro=6)

    return True
