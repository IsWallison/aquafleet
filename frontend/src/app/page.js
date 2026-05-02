'use client';
import { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { getDashboardResumo, getColetasPorEmbarcacao, getColetasPorEmpresa, getAlertas } from '@/lib/api';

const COLORS = ['#0094cf', '#00b894', '#f0a500', '#ee5a5a', '#a78bfa', '#00d4aa', '#ff6b6b', '#ffc048'];

export default function Dashboard() {
  const [resumo, setResumo] = useState(null);
  const [porEmb, setPorEmb] = useState([]);
  const [porEmp, setPorEmp] = useState([]);
  const [alertas, setAlertas] = useState([]);
  const [loading, setLoading] = useState(true);

  const hoje = new Date();
  const [mes, setMes] = useState(hoje.getMonth() + 1);
  const [ano, setAno] = useState(hoje.getFullYear());

  useEffect(() => {
    setLoading(true);
    Promise.all([getDashboardResumo(mes, ano), getColetasPorEmbarcacao(mes, ano), getColetasPorEmpresa(mes, ano), getAlertas()])
      .then(([r, emb, emp, al]) => { setResumo(r); setPorEmb(emb); setPorEmp(emp); setAlertas(al); })
      .finally(() => setLoading(false));
  }, [mes, ano]);

  const changeAno = (e) => setAno(parseInt(e.target.value));
  const changeMes = (e) => setMes(e.target.value ? parseInt(e.target.value) : '');

  if (loading && !resumo) return (
    <><header className="header"><div><h2 className="header-title">Dashboard</h2></div></header>
      <div className="page-content"><div className="loading-container"><div className="spinner" /><p className="loading-text">Carregando...</p></div></div></>
  );

  const anoAtual = hoje.getFullYear();
  const anos = Array.from({ length: anoAtual - 2020 + 1 }, (_, i) => anoAtual - i);
  const meses = [
    { v: 1, l: 'Janeiro' }, { v: 2, l: 'Fevereiro' }, { v: 3, l: 'Marco' },
    { v: 4, l: 'Abril' }, { v: 5, l: 'Maio' }, { v: 6, l: 'Junho' },
    { v: 7, l: 'Julho' }, { v: 8, l: 'Agosto' }, { v: 9, l: 'Setembro' },
    { v: 10, l: 'Outubro' }, { v: 11, l: 'Novembro' }, { v: 12, l: 'Dezembro' }
  ];

  return (
    <>
      <header className="header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div><h2 className="header-title">Dashboard</h2><p className="header-subtitle">Visao geral do sistema</p></div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <select className="form-select" value={ano} onChange={changeAno} style={{ width: 100, margin: 0 }}>
            {anos.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
          <select className="form-select" value={mes} onChange={changeMes} style={{ width: 140, margin: 0 }}>
            <option value="">Anual (Todos)</option>
            {meses.map(m => <option key={m.v} value={m.v}>{m.l}</option>)}
          </select>
        </div>
      </header>
      <div className="page-content">
        {loading && <div className="loading-overlay" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(10,14,23,0.5)', zIndex: 10, display: 'flex', justifyContent: 'center', alignItems: 'center' }}><div className="spinner" /></div>}
        <div className="stats-grid">
          <div className="stat-card blue">
            <div className="stat-card-header"><span className="stat-card-label">Empresas</span><div className="stat-card-icon blue">{'\u2616'}</div></div>
            <div className="stat-card-value">{resumo.total_empresas}</div>
            <div className="stat-card-change">Cadastradas</div>
          </div>
          <div className="stat-card green">
            <div className="stat-card-header"><span className="stat-card-label">Embarcacoes</span><div className="stat-card-icon green">{'\u2693'}</div></div>
            <div className="stat-card-value">{resumo.total_embarcacoes}</div>
            <div className="stat-card-change">Monitoradas</div>
          </div>
          <div className="stat-card purple">
            <div className="stat-card-header"><span className="stat-card-label">Total de Coletas</span><div className="stat-card-icon purple">{'\u2620'}</div></div>
            <div className="stat-card-value">{resumo.total_coletas}</div>
            <div className="stat-card-change">{resumo.coletas_mes} neste mes</div>
          </div>
          <div className="stat-card yellow">
            <div className="stat-card-header"><span className="stat-card-label">Agendadas</span><div className="stat-card-icon yellow">{'\u231B'}</div></div>
            <div className="stat-card-value">{resumo.agendas_pendentes}</div>
            <div className="stat-card-change">Pendentes</div>
          </div>
          <div className="stat-card red">
            <div className="stat-card-header"><span className="stat-card-label">Alertas</span><div className="stat-card-icon red">{'\u26A0'}</div></div>
            <div className="stat-card-value">{resumo.total_alertas}</div>
            <div className="stat-card-change negative">Requerem atencao</div>
          </div>
        </div>

        <div className="grid-2">
          <div className="card">
            <div className="card-header"><h3 className="card-title">Coletas por Embarcacao</h3></div>
            <div className="card-body">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={porEmb} margin={{ left: -10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="nome" tick={{ fill: '#8899aa', fontSize: 11 }} angle={-25} textAnchor="end" height={60} />
                  <YAxis tick={{ fill: '#8899aa', fontSize: 11 }} />
                  <Tooltip contentStyle={{ background: '#1a2035', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, color: '#f0f4f8' }} />
                  <Bar dataKey="total_coletas" fill="url(#barGrad)" radius={[6, 6, 0, 0]} />
                  <defs><linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#0094cf" /><stop offset="100%" stopColor="#006d9b" /></linearGradient></defs>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="card">
            <div className="card-header"><h3 className="card-title">Coletas por Empresa</h3></div>
            <div className="card-body">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={porEmp} layout="vertical" margin={{ left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis type="number" tick={{ fill: '#8899aa', fontSize: 11 }} />
                  <YAxis type="category" dataKey="nome" tick={{ fill: '#8899aa', fontSize: 11 }} width={120} />
                  <Tooltip contentStyle={{ background: '#1a2035', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, color: '#f0f4f8' }} />
                  <Bar dataKey="total_coletas" radius={[0, 6, 6, 0]}>
                    {porEmp.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Alertas */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Alertas Recentes</h3>
            {alertas.length > 0 && <span className="badge critica">{alertas.length} alertas</span>}
          </div>
          <div className="card-body" style={{ padding: 0, maxHeight: 320, overflowY: 'auto' }}>
            {alertas.length === 0 ? (
              <div className="empty-state"><p>Nenhum alerta ativo</p></div>
            ) : (
              alertas.slice(0, 10).map((a, i) => (
                <div key={i} className="alert-item">
                  <div className={`alert-icon ${a.severidade}`}>{'\u23F0'}</div>
                  <div className="alert-info">
                    <h4>{a.embarcacao_nome} <span className={`badge ${a.severidade}`}>{a.severidade}</span></h4>
                    <p>{a.mensagem}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </>
  );
}
