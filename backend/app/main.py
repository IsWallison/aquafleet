"""
AquaFleet - FastAPI Application (Simplificado)
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .database import init_db, SessionLocal
from .seed import seed_database
from .routers import empresas, embarcacoes, coletas, agenda, dashboard, locais

app = FastAPI(
    title="AquaFleet API",
    description="Sistema de gestao de coletas de agua em embarcacoes offshore",
    version="2.0.0",
    docs_url="/docs",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(empresas.router)
app.include_router(embarcacoes.router)
app.include_router(coletas.router)
app.include_router(agenda.router)
app.include_router(dashboard.router)
app.include_router(locais.router)


@app.on_event("startup")
def startup():
    init_db()
    db = SessionLocal()
    try:
        result = seed_database(db)
        if result:
            print("[OK] Banco populado com dados de demonstracao")
        else:
            print("[INFO] Banco ja contem dados")
    finally:
        db.close()


@app.get("/")
def root():
    return {"app": "AquaFleet", "version": "2.0.0", "docs": "/docs"}


@app.get("/api/health")
def health():
    return {"status": "ok"}
