'use client';
import { useState, useEffect } from 'react';
import { getEmbarcacoes, criarEmbarcacao, deletarEmbarcacao, getEmpresas } from '@/lib/api';

export default function EmbarcacoesPage() {
  const [embarcacoes, setEmbarcacoes] = useState([]);
  const [empresas, setEmpresas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [form, setForm] = useState({ nome: '', empresa_id: '', tipo: '', imo_number: '' });

  const load = () => {
    setLoading(true);
    Promise.all([getEmbarcacoes(), getEmpresas()]).then(([e, emp]) => { setEmbarcacoes(e); setEmpresas(emp); }).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const empresaMap = {};
  empresas.forEach(e => { empresaMap[e.id] = e.nome; });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await criarEmbarcacao({ ...form, empresa_id: parseInt(form.empresa_id) });
      setShowModal(false);
      setForm({ nome: '', empresa_id: '', tipo: '', imo_number: '' });
      load();
    } catch (err) { alert(err.message); }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    try { await deletarEmbarcacao(confirmDelete.id); setConfirmDelete(null); load(); } catch (err) { alert(err.message); }
  };

  return (
    <>
      <header className="header">
        <div><h2 className="header-title">Embarcacoes</h2><p className="header-subtitle">Gestao de embarcacoes monitoradas</p></div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Nova Embarcacao</button>
      </header>
      <div className="page-content">
        {loading ? <div className="loading-container"><div className="spinner" /></div> : (
          <div className="card"><div className="card-body" style={{ padding: 0 }}>
            <table className="data-table">
              <thead><tr><th>Nome</th><th>Empresa</th><th>Tipo</th><th>IMO</th><th>Status</th><th style={{ width: 80 }}>Acoes</th></tr></thead>
              <tbody>
                {embarcacoes.map(e => (
                  <tr key={e.id}>
                    <td style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{e.nome}</td>
                    <td>{empresaMap[e.empresa_id] || '--'}</td>
                    <td>{e.tipo || '--'}</td>
                    <td>{e.imo_number || '--'}</td>
                    <td><span className={`badge ${e.status}`}>{e.status}</span></td>
                    <td><button className="btn btn-danger btn-sm" onClick={() => setConfirmDelete(e)} title="Excluir">{'\u2716'}</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div></div>
        )}
      </div>

      {/* Modal Nova Embarcacao */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h2>Nova Embarcacao</h2><button className="modal-close" onClick={() => setShowModal(false)}>x</button></div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group"><label className="form-label">Empresa *</label>
                  <select className="form-select" required value={form.empresa_id} onChange={e => setForm({ ...form, empresa_id: e.target.value })}>
                    <option value="">Selecione...</option>
                    {empresas.map(emp => <option key={emp.id} value={emp.id}>{emp.nome}</option>)}
                  </select>
                </div>
                <div className="form-row">
                  <div className="form-group"><label className="form-label">Nome *</label><input className="form-input" required value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })} /></div>
                  <div className="form-group"><label className="form-label">Tipo</label>
                    <select className="form-select" value={form.tipo} onChange={e => setForm({ ...form, tipo: e.target.value })}>
                      <option value="">Selecione...</option>
                      <option value="FPSO">FPSO</option><option value="Navio-sonda">Navio-sonda</option>
                      <option value="Plataforma">Plataforma</option><option value="Navio-tanque">Navio-tanque</option>
                    </select>
                  </div>
                </div>
                <div className="form-group"><label className="form-label">IMO Number</label><input className="form-input" value={form.imo_number} onChange={e => setForm({ ...form, imo_number: e.target.value })} /></div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary">Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Confirmacao de Exclusao */}
      {confirmDelete && (
        <div className="modal-overlay" onClick={() => setConfirmDelete(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 450 }}>
            <div className="modal-header"><h2>Confirmar Exclusao</h2><button className="modal-close" onClick={() => setConfirmDelete(null)}>x</button></div>
            <div className="modal-body">
              <p style={{ color: 'var(--text-primary)', fontSize: 15, marginBottom: 8 }}>
                Excluir a embarcacao <strong>{confirmDelete.nome}</strong>?
              </p>
              <p style={{ color: 'var(--danger-400)', fontSize: 13 }}>
                Todas as coletas e agendas vinculadas serao removidas permanentemente.
              </p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setConfirmDelete(null)}>Cancelar</button>
              <button className="btn btn-danger" onClick={handleDelete}>Excluir</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
