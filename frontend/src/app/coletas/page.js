'use client';
import { useState, useEffect } from 'react';
import { getColetas, criarColeta, editarColeta, getEmbarcacoes, getLocais } from '@/lib/api';

export default function ColetasPage() {
  const [coletas, setColetas] = useState([]);
  const [embarcacoes, setEmbarcacoes] = useState([]);
  const [locais, setLocais] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editando, setEditando] = useState(null);
  const hoje = new Date().toISOString().split('T')[0];
  const [form, setForm] = useState({ embarcacao_id: '', data_coleta: hoje, tipo_analise: '', local: '', coletor: '', status: 'realizada', observacoes: '' });

  const load = () => {
    setLoading(true);
    Promise.all([getColetas(), getEmbarcacoes(), getLocais()]).then(([c, e, l]) => { setColetas(c); setEmbarcacoes(e); setLocais(l); }).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const embMap = {};
  embarcacoes.forEach(e => { embMap[e.id] = e.nome; });

  const abrirNova = () => {
    setEditando(null);
    setForm({ embarcacao_id: '', data_coleta: hoje, tipo_analise: '', local: '', coletor: '', status: 'realizada', observacoes: '' });
    setShowModal(true);
  };

  const abrirEditar = (c) => {
    setEditando(c);
    setForm({ data_coleta: c.data_coleta, tipo_analise: c.tipo_analise || '', local: c.local || '', coletor: c.coletor || '', status: c.status || 'realizada', observacoes: c.observacoes || '' });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editando) {
        await editarColeta(editando.id, { 
            data_coleta: form.data_coleta, 
            tipo_analise: form.tipo_analise || null, 
            local: form.local || null, 
            coletor: form.coletor || null, 
            status: form.status,
            observacoes: form.observacoes || null 
        });
      } else {
        await criarColeta({ 
            ...form, 
            embarcacao_id: parseInt(form.embarcacao_id), 
            local: form.local || null, 
            tipo_analise: form.tipo_analise || null,
            coletor: form.coletor || null
        });
      }
      setShowModal(false);
      load();
    } catch (err) { alert(err.message); }
  };

  return (
    <>
      <header className="header">
        <div><h2 className="header-title">Coletas</h2><p className="header-subtitle">Historico e controle de coletas</p></div>
        <button className="btn btn-primary" onClick={abrirNova}>+ Registrar Coleta</button>
      </header>
      <div className="page-content">
        {loading ? <div className="loading-container"><div className="spinner" /></div> : (
          <div className="card"><div className="card-body" style={{ padding: 0 }}>
            <table className="data-table">
              <thead><tr><th>Data</th><th>Embarcacao</th><th>Tipo Analise</th><th>Local</th><th>Status</th><th>Coletor</th><th style={{ width: 80 }}>Acoes</th></tr></thead>
              <tbody>
                {coletas.map(c => (
                  <tr key={c.id}>
                    <td style={{ fontWeight: 500 }}>{c.data_coleta}</td>
                    <td style={{ color: 'var(--text-primary)' }}>{embMap[c.embarcacao_id] || `#${c.embarcacao_id}`}</td>
                    <td>{c.tipo_analise || '--'}</td>
                    <td>{c.local || '--'}</td>
                    <td><span className={`badge ${c.status}`}>{c.status}</span></td>
                    <td>{c.coletor || '--'}</td>
                    <td><button className="btn btn-secondary btn-sm" onClick={() => abrirEditar(c)} title="Editar">{'\u270E'}</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div></div>
        )}
      </div>
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h2>{editando ? 'Editar Coleta' : 'Registrar Coleta'}</h2><button className="modal-close" onClick={() => setShowModal(false)}>x</button></div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                {!editando && (
                  <div className="form-group"><label className="form-label">Embarcacao *</label>
                    <select className="form-select" required value={form.embarcacao_id} onChange={e => setForm({ ...form, embarcacao_id: e.target.value })}>
                      <option value="">Selecione...</option>
                      {embarcacoes.map(emb => <option key={emb.id} value={emb.id}>{emb.nome}</option>)}
                    </select>
                  </div>
                )}
                <div className="form-row">
                  <div className="form-group"><label className="form-label">Data *</label><input className="form-input" type="date" required value={form.data_coleta} onChange={e => setForm({ ...form, data_coleta: e.target.value })} /></div>
                  <div className="form-group"><label className="form-label">Status *</label>
                    <select className="form-select" required value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                      <option value="pendente">Pendente</option>
                      <option value="realizada">Realizada</option>
                      <option value="cancelada">Cancelada</option>
                    </select>
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group"><label className="form-label">Tipo de Analise</label>
                    <select className="form-select" value={form.tipo_analise} onChange={e => setForm({ ...form, tipo_analise: e.target.value })}>
                      <option value="">Nao especificado</option>
                      <option value="Microbiologica">Microbiologica</option>
                      <option value="Fisico-quimica">Fisico-quimica</option>
                      <option value="Microbiologica e Fisico-quimica">Microbiologica e Fisico-quimica</option>
                    </select>
                  </div>
                  <div className="form-group"><label className="form-label">Local da Coleta</label>
                    <select className="form-select" value={form.local} onChange={e => setForm({ ...form, local: e.target.value })}>
                      <option value="">Selecione...</option>
                      {locais.map(l => <option key={l.id} value={l.nome}>{l.nome}</option>)}
                    </select>
                  </div>
                </div>
                <div className="form-group"><label className="form-label">Coletor</label><input className="form-input" value={form.coletor} onChange={e => setForm({ ...form, coletor: e.target.value })} placeholder="Nome de quem realizou a coleta" /></div>
                <div className="form-group"><label className="form-label">Observacoes</label><input className="form-input" value={form.observacoes} onChange={e => setForm({ ...form, observacoes: e.target.value })} /></div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary">{editando ? 'Atualizar' : 'Salvar'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
