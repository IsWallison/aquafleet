'use client';
import { useState, useEffect } from 'react';
import { getEmpresas, criarEmpresa, deletarEmpresa } from '@/lib/api';

export default function EmpresasPage() {
  const [empresas, setEmpresas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [form, setForm] = useState({ nome: '', cnpj: '', contato_nome: '', contato_email: '', contato_telefone: '' });

  const load = () => { setLoading(true); getEmpresas().then(setEmpresas).finally(() => setLoading(false)); };
  useEffect(() => { load(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try { await criarEmpresa(form); setShowModal(false); setForm({ nome: '', cnpj: '', contato_nome: '', contato_email: '', contato_telefone: '' }); load(); } catch (err) { alert(err.message); }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    try { await deletarEmpresa(confirmDelete.id); setConfirmDelete(null); load(); } catch (err) { alert(err.message); }
  };

  return (
    <>
      <header className="header">
        <div><h2 className="header-title">Empresas</h2><p className="header-subtitle">Gestao de empresas clientes</p></div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Nova Empresa</button>
      </header>
      <div className="page-content">
        {loading ? <div className="loading-container"><div className="spinner" /></div> : (
          <div className="card"><div className="card-body" style={{ padding: 0 }}>
            <table className="data-table">
              <thead><tr><th>Nome</th><th>CNPJ</th><th>Contato</th><th>Email</th><th>Telefone</th><th style={{ width: 80 }}>Acoes</th></tr></thead>
              <tbody>
                {empresas.map(e => (
                  <tr key={e.id}>
                    <td style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{e.nome}</td>
                    <td>{e.cnpj}</td>
                    <td>{e.contato_nome || '--'}</td>
                    <td>{e.contato_email || '--'}</td>
                    <td>{e.contato_telefone || '--'}</td>
                    <td><button className="btn btn-danger btn-sm" onClick={() => setConfirmDelete(e)} title="Excluir">{'\u2716'}</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div></div>
        )}
      </div>

      {/* Modal Nova Empresa */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h2>Nova Empresa</h2><button className="modal-close" onClick={() => setShowModal(false)}>x</button></div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-row">
                  <div className="form-group"><label className="form-label">Nome *</label><input className="form-input" required value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })} /></div>
                  <div className="form-group"><label className="form-label">CNPJ *</label><input className="form-input" required value={form.cnpj} onChange={e => setForm({ ...form, cnpj: e.target.value })} /></div>
                </div>
                <div className="form-row">
                  <div className="form-group"><label className="form-label">Contato</label><input className="form-input" value={form.contato_nome} onChange={e => setForm({ ...form, contato_nome: e.target.value })} /></div>
                  <div className="form-group"><label className="form-label">Email</label><input className="form-input" type="email" value={form.contato_email} onChange={e => setForm({ ...form, contato_email: e.target.value })} /></div>
                </div>
                <div className="form-group"><label className="form-label">Telefone</label><input className="form-input" value={form.contato_telefone} onChange={e => setForm({ ...form, contato_telefone: e.target.value })} /></div>
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
                Excluir a empresa <strong>{confirmDelete.nome}</strong>?
              </p>
              <p style={{ color: 'var(--danger-400)', fontSize: 13 }}>
                Todas as embarcacoes, coletas e agendas vinculadas serao removidas permanentemente.
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
