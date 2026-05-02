'use client';
import { useState, useEffect } from 'react';
import { getAgenda, cancelarAgenda, criarAgenda, criarColeta, getEmbarcacoes, getLocais, criarLocal } from '@/lib/api';

export default function AgendaPage() {
  const [agenda, setAgenda] = useState([]);
  const [embarcacoes, setEmbarcacoes] = useState([]);
  const [locais, setLocais] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtroStatus, setFiltroStatus] = useState('pendente');
  const [confirmCancel, setConfirmCancel] = useState(null);
  const [realizarItem, setRealizarItem] = useState(null);
  const [realizarForm, setRealizarForm] = useState({ data_coleta: '', local: '', coletor: '', observacoes: '' });
  const [showNova, setShowNova] = useState(false);
  const [novaForm, setNovaForm] = useState({ embarcacao_id: '', data_prevista: '', horario: '', tipo_analise: 'Microbiologica', local: '', novoLocal: '', observacoes: '' });

  const hoje = new Date().toISOString().split('T')[0];

  const load = () => {
    setLoading(true);
    const params = {};
    if (filtroStatus) params.status = filtroStatus;
    Promise.all([getAgenda(params), getEmbarcacoes(), getLocais()]).then(([a, e, l]) => { setAgenda(a); setEmbarcacoes(e); setLocais(l); }).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, [filtroStatus]);

  const embMap = {};
  embarcacoes.forEach(e => { embMap[e.id] = e.nome; });

  const handleCancelar = async () => {
    if (!confirmCancel) return;
    try { await cancelarAgenda(confirmCancel.id); setConfirmCancel(null); load(); } catch (err) { alert(err.message); }
  };

  const handleRealizar = async (e) => {
    e.preventDefault();
    if (!realizarItem) return;
    try {
      await criarColeta({
        embarcacao_id: realizarItem.embarcacao_id,
        agenda_id: realizarItem.id,
        data_coleta: realizarForm.data_coleta,
        tipo_analise: realizarItem.tipo_analise,
        local: realizarForm.local || realizarItem.local || null,
        status: 'realizada',
        coletor: realizarForm.coletor || null,
        observacoes: realizarForm.observacoes || null,
      });
      setRealizarItem(null);
      load();
    } catch (err) { alert(err.message); }
  };

  const handleNovaDemanda = async (e) => {
    e.preventDefault();
    let localFinal = novaForm.local;
    if (novaForm.local === '__novo__' && novaForm.novoLocal.trim()) {
      const r = await criarLocal(novaForm.novoLocal.trim());
      localFinal = r.nome;
    }
    try {
      await criarAgenda({
        embarcacao_id: parseInt(novaForm.embarcacao_id),
        data_prevista: novaForm.data_prevista,
        horario: novaForm.horario || null,
        tipo_analise: novaForm.tipo_analise,
        local: localFinal && localFinal !== '__novo__' ? localFinal : null,
        observacoes: novaForm.observacoes || null,
      });
      setShowNova(false);
      setNovaForm({ embarcacao_id: '', data_prevista: hoje, horario: '', tipo_analise: 'Microbiologica', local: '', novoLocal: '', observacoes: '' });
      load();
    } catch (err) { alert(err.message); }
  };

  const counts = {
    total: agenda.length,
    pendente: agenda.filter(a => a.status === 'pendente').length,
    realizada: agenda.filter(a => a.status === 'realizada').length,
    atrasada: agenda.filter(a => a.status === 'atrasada').length,
  };

  return (
    <>
      <header className="header">
        <div><h2 className="header-title">Agenda de Coletas</h2><p className="header-subtitle">Agendamentos manuais de demandas</p></div>
        <button className="btn btn-primary" onClick={() => { setShowNova(true); setNovaForm({ ...novaForm, data_prevista: hoje }); }}>+ Nova Demanda</button>
      </header>
      <div className="page-content">
        <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
          <div className="stat-card blue"><div className="stat-card-value">{counts.total}</div><div className="stat-card-change">Total</div></div>
          <div className="stat-card yellow"><div className="stat-card-value">{counts.pendente}</div><div className="stat-card-change">Pendentes</div></div>
          <div className="stat-card green"><div className="stat-card-value">{counts.realizada}</div><div className="stat-card-change">Realizadas</div></div>
          <div className="stat-card red"><div className="stat-card-value">{counts.atrasada}</div><div className="stat-card-change">Atrasadas</div></div>
        </div>
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Itens da Agenda</h3>
            <div style={{ display: 'flex', gap: 8 }}>
              {['pendente', 'realizada', 'atrasada', 'cancelada', ''].map(s => (
                <button key={s} className={`btn btn-sm ${filtroStatus === s ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setFiltroStatus(s)}>
                  {s || 'Todos'}
                </button>
              ))}
            </div>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            {loading ? <div className="loading-container"><div className="spinner" /></div> : (
              <table className="data-table">
                <thead><tr><th>Data</th><th>Horario</th><th>Embarcacao</th><th>Tipo Analise</th><th>Local</th><th>Status</th><th style={{ width: 120 }}>Acoes</th></tr></thead>
                <tbody>
                  {agenda.map(a => (
                    <tr key={a.id} style={a.status === 'cancelada' ? { opacity: 0.5 } : {}}>
                      <td style={{ fontWeight: 600 }}>{a.data_prevista}</td>
                      <td>{a.horario || '--'}</td>
                      <td style={{ color: 'var(--text-primary)' }}>{embMap[a.embarcacao_id] || `#${a.embarcacao_id}`}</td>
                      <td>{a.tipo_analise}</td>
                      <td>{a.local || '--'}</td>
                      <td><span className={`badge ${a.status}`}>{a.status}</span></td>
                      <td style={{ display: 'flex', gap: 6 }}>
                        {(a.status === 'pendente' || a.status === 'atrasada') && (
                          <>
                            <button className="btn btn-success btn-sm" onClick={() => { setRealizarItem(a); setRealizarForm({ data_coleta: hoje, local: a.local || '', coletor: '', observacoes: '' }); }} title="Marcar como realizada">{'\u2714'}</button>
                            <button className="btn btn-danger btn-sm" onClick={() => setConfirmCancel(a)} title="Cancelar">{'\u2716'}</button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* Modal Nova Demanda */}
      {showNova && (
        <div className="modal-overlay" onClick={() => setShowNova(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h2>Nova Demanda de Coleta</h2><button className="modal-close" onClick={() => setShowNova(false)}>x</button></div>
            <form onSubmit={handleNovaDemanda}>
              <div className="modal-body">
                <div className="form-group"><label className="form-label">Embarcacao *</label>
                  <select className="form-select" required value={novaForm.embarcacao_id} onChange={e => setNovaForm({ ...novaForm, embarcacao_id: e.target.value })}>
                    <option value="">Selecione a embarcacao...</option>
                    {embarcacoes.map(emb => <option key={emb.id} value={emb.id}>{emb.nome}</option>)}
                  </select>
                </div>
                <div className="form-row">
                  <div className="form-group"><label className="form-label">Data Prevista *</label><input className="form-input" type="date" required value={novaForm.data_prevista} onChange={e => setNovaForm({ ...novaForm, data_prevista: e.target.value })} /></div>
                  <div className="form-group"><label className="form-label">Horario</label><input className="form-input" type="time" value={novaForm.horario} onChange={e => setNovaForm({ ...novaForm, horario: e.target.value })} /></div>
                </div>
                <div className="form-row">
                  <div className="form-group"><label className="form-label">Tipo de Analise *</label>
                    <select className="form-select" value={novaForm.tipo_analise} onChange={e => setNovaForm({ ...novaForm, tipo_analise: e.target.value })}>
                      <option>Microbiologica</option><option>Fisico-quimica</option><option>Microbiologica e Fisico-quimica</option>
                    </select>
                  </div>
                  <div className="form-group"><label className="form-label">Local</label>
                    <select className="form-select" value={novaForm.local} onChange={e => setNovaForm({ ...novaForm, local: e.target.value })}>
                      <option value="">Selecione o local...</option>
                      {locais.map(l => <option key={l.id} value={l.nome}>{l.nome}</option>)}
                      <option value="__novo__">+ Cadastrar novo local</option>
                    </select>
                  </div>
                </div>
                {novaForm.local === '__novo__' && (
                  <div className="form-group"><label className="form-label">Nome do Novo Local *</label><input className="form-input" required value={novaForm.novoLocal} onChange={e => setNovaForm({ ...novaForm, novoLocal: e.target.value })} placeholder="Ex: Porto do Acu, Terminal Manguinhos..." /></div>
                )}
                <div className="form-group"><label className="form-label">Observacoes</label><textarea className="form-input" rows={2} value={novaForm.observacoes} onChange={e => setNovaForm({ ...novaForm, observacoes: e.target.value })} placeholder="Detalhes adicionais..." style={{ resize: 'vertical' }} /></div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowNova(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary">Agendar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Realizar Coleta */}
      {realizarItem && (
        <div className="modal-overlay" onClick={() => setRealizarItem(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 500 }}>
            <div className="modal-header"><h2>Registrar Coleta Realizada</h2><button className="modal-close" onClick={() => setRealizarItem(null)}>x</button></div>
            <form onSubmit={handleRealizar}>
              <div className="modal-body">
                <div style={{ background: 'rgba(64,192,87,0.08)', border: '1px solid rgba(64,192,87,0.2)', borderRadius: 8, padding: '12px 16px', marginBottom: 16 }}>
                  <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 4 }}>Agenda</div>
                  <div style={{ fontSize: 15, color: 'var(--text-primary)', fontWeight: 600 }}>{embMap[realizarItem.embarcacao_id] || '?'}</div>
                  <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>
                    {realizarItem.tipo_analise} — prevista para {realizarItem.data_prevista}
                    {realizarItem.horario && ` as ${realizarItem.horario}`}
                    {realizarItem.local && ` — ${realizarItem.local}`}
                  </div>
                </div>
                <div className="form-group"><label className="form-label">Data da Coleta *</label><input className="form-input" type="date" required value={realizarForm.data_coleta} onChange={e => setRealizarForm({ ...realizarForm, data_coleta: e.target.value })} /></div>
                <div className="form-group"><label className="form-label">Local da Coleta</label>
                  <select className="form-select" value={realizarForm.local} onChange={e => setRealizarForm({ ...realizarForm, local: e.target.value })}>
                    <option value="">Selecione...</option>
                    {locais.map(l => <option key={l.id} value={l.nome}>{l.nome}</option>)}
                  </select>
                </div>
                <div className="form-group"><label className="form-label">Coletor</label><input className="form-input" value={realizarForm.coletor} onChange={e => setRealizarForm({ ...realizarForm, coletor: e.target.value })} placeholder="Nome do coletor" /></div>
                <div className="form-group"><label className="form-label">Observacoes</label><textarea className="form-input" rows={2} value={realizarForm.observacoes} onChange={e => setRealizarForm({ ...realizarForm, observacoes: e.target.value })} placeholder="Observacoes opcionais..." style={{ resize: 'vertical' }} /></div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setRealizarItem(null)}>Cancelar</button>
                <button type="submit" className="btn btn-success">Confirmar Coleta</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Confirmacao de Cancelamento */}
      {confirmCancel && (
        <div className="modal-overlay" onClick={() => setConfirmCancel(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 450 }}>
            <div className="modal-header"><h2>Cancelar Agenda</h2><button className="modal-close" onClick={() => setConfirmCancel(null)}>x</button></div>
            <div className="modal-body">
              <p style={{ color: 'var(--text-primary)', fontSize: 15, marginBottom: 8 }}>Cancelar a coleta agendada para <strong>{confirmCancel.data_prevista}</strong>?</p>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Embarcacao: <strong>{embMap[confirmCancel.embarcacao_id] || '?'}</strong> — {confirmCancel.tipo_analise}{confirmCancel.local && ` — ${confirmCancel.local}`}</p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setConfirmCancel(null)}>Voltar</button>
              <button className="btn btn-danger" onClick={handleCancelar}>Cancelar Agenda</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
