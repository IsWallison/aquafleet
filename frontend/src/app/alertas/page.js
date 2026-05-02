'use client';
import { useState, useEffect } from 'react';
import { getAlertas, justificarAgenda, silenciarAlerta } from '@/lib/api';

export default function AlertasPage() {
  const [alertas, setAlertas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showJustModal, setShowJustModal] = useState(null);
  const [justificativa, setJustificativa] = useState('');
  const [confirmRemove, setConfirmRemove] = useState(null);

  const load = () => {
    setLoading(true);
    getAlertas().then(setAlertas).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const handleJustificar = async () => {
    if (!showJustModal) return;
    try {
      if (showJustModal.agenda_id) {
        await justificarAgenda(showJustModal.agenda_id, justificativa);
      } else {
        await silenciarAlerta(showJustModal.embarcacao_id);
      }
      setShowJustModal(null);
      setJustificativa('');
      load();
    } catch (err) { alert(err.message); }
  };

  const handleRemover = async () => {
    if (!confirmRemove) return;
    try {
      if (confirmRemove.agenda_id) {
        await justificarAgenda(confirmRemove.agenda_id, 'Removido pelo usuario');
      } else {
        await silenciarAlerta(confirmRemove.embarcacao_id);
      }
      setConfirmRemove(null);
      load();
    } catch (err) { alert(err.message); }
  };

  return (
    <>
      <header className="header">
        <div><h2 className="header-title">Alertas</h2><p className="header-subtitle">Coletas atrasadas e embarcacoes sem coleta recente</p></div>
      </header>
      <div className="page-content">
        {loading ? <div className="loading-container"><div className="spinner" /></div> : (
          <div className="card">
            <div className="card-header"><h3 className="card-title">Alertas ({alertas.length})</h3></div>
            <div className="card-body" style={{ padding: 0 }}>
              {alertas.length === 0 ? (
                <div className="empty-state" style={{ padding: 60 }}><h3>Tudo em dia!</h3><p>Nenhum alerta ativo.</p></div>
              ) : (
                alertas.map((a, i) => (
                  <div key={i} className="alert-item" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div className={`alert-icon ${a.severidade}`}>{'\u23F0'}</div>
                    <div className="alert-info" style={{ flex: 1 }}>
                      <h4 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        {a.embarcacao_nome}
                        <span className={`badge ${a.severidade}`}>{a.severidade}</span>
                        <span className={`badge ${a.tipo === 'atraso' ? 'pendente' : 'atrasada'}`} style={{ fontSize: 10 }}>{a.tipo === 'atraso' ? 'Agenda atrasada' : 'Sem coleta recente'}</span>
                      </h4>
                      <p style={{ marginTop: 4 }}>{a.mensagem}</p>
                      <p style={{ marginTop: 2, fontSize: 11 }}>Empresa: {a.empresa_nome}</p>
                    </div>
                    <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                      <button className="btn btn-sm btn-secondary" onClick={() => { setShowJustModal(a); setJustificativa(''); }} title="Justificar">
                        Justificar
                      </button>
                      <button className="btn btn-sm btn-danger" onClick={() => setConfirmRemove(a)} title="Remover">
                        {'\u2716'}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modal Justificar */}
      {showJustModal && (
        <div className="modal-overlay" onClick={() => setShowJustModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 500 }}>
            <div className="modal-header"><h2>Justificar Alerta</h2><button className="modal-close" onClick={() => setShowJustModal(null)}>x</button></div>
            <div className="modal-body">
              <div style={{ background: 'rgba(255,159,67,0.08)', border: '1px solid rgba(255,159,67,0.2)', borderRadius: 8, padding: '12px 16px', marginBottom: 16 }}>
                <div style={{ fontSize: 14, color: 'var(--text-primary)', fontWeight: 600 }}>{showJustModal.embarcacao_nome}</div>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>{showJustModal.mensagem}</div>
              </div>
              <div className="form-group">
                <label className="form-label">Justificativa *</label>
                <textarea className="form-input" rows={3} value={justificativa} onChange={e => setJustificativa(e.target.value)} placeholder="Descreva o motivo..." style={{ resize: 'vertical' }} />
              </div>
              {!showJustModal.agenda_id && (
                <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Os alertas desta embarcacao serao silenciados por 90 dias.</p>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowJustModal(null)}>Cancelar</button>
              <button className="btn btn-primary" onClick={handleJustificar} disabled={!justificativa.trim()}>Confirmar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Confirmar Remocao */}
      {confirmRemove && (
        <div className="modal-overlay" onClick={() => setConfirmRemove(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 420 }}>
            <div className="modal-header"><h2>Remover Alerta</h2><button className="modal-close" onClick={() => setConfirmRemove(null)}>x</button></div>
            <div className="modal-body">
              <p style={{ color: 'var(--text-primary)', fontSize: 15 }}>Remover alerta de <strong>{confirmRemove.embarcacao_nome}</strong>?</p>
              <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginTop: 4 }}>
                {confirmRemove.agenda_id ? 'O item da agenda vinculado sera cancelado.' : 'Os alertas desta embarcacao serao silenciados por 90 dias.'}
              </p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setConfirmRemove(null)}>Voltar</button>
              <button className="btn btn-danger" onClick={handleRemover}>Remover</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
