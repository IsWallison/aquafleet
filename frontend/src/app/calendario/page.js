'use client';
import { useState, useEffect, useMemo } from 'react';
import { getCalendario } from '@/lib/api';

const MESES = ['Janeiro', 'Fevereiro', 'Marco', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
const DIAS_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'];

const STATUS_CONFIG = {
  pendente: { cor: '#f0a500', label: 'Agendada' },
  realizada: { cor: '#40c057', label: 'Realizada' },
  atrasada: { cor: '#ee5a5a', label: 'Atrasada' },
  cancelada: { cor: '#5a6a7a', label: 'Cancelada' },
};

function getDiasDoMes(ano, mes) {
  const primeiro = new Date(ano, mes - 1, 1);
  const diaInicio = primeiro.getDay();
  const totalDias = new Date(ano, mes, 0).getDate();

  const dias = [];
  // Dias vazios do mes anterior
  for (let i = 0; i < diaInicio; i++) {
    dias.push({ dia: null, data: null });
  }
  // Dias do mes
  for (let d = 1; d <= totalDias; d++) {
    const data = `${ano}-${String(mes).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    dias.push({ dia: d, data });
  }
  return dias;
}

export default function CalendarioPage() {
  const hoje = new Date();
  const [mes, setMes] = useState(hoje.getMonth() + 1);
  const [ano, setAno] = useState(hoje.getFullYear());
  const [eventos, setEventos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [diaSelecionado, setDiaSelecionado] = useState(null);

  useEffect(() => {
    setLoading(true);
    getCalendario(mes, ano).then(d => setEventos(d.eventos)).finally(() => setLoading(false));
  }, [mes, ano]);

  const dias = useMemo(() => getDiasDoMes(ano, mes), [ano, mes]);

  // Agrupar eventos por data
  const eventosPorDia = useMemo(() => {
    const map = {};
    eventos.forEach(e => {
      if (!map[e.data]) map[e.data] = [];
      map[e.data].push(e);
    });
    return map;
  }, [eventos]);

  const hojeStr = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}-${String(hoje.getDate()).padStart(2, '0')}`;

  const navMes = (delta) => {
    let m = mes + delta;
    let a = ano;
    if (m < 1) { m = 12; a--; }
    if (m > 12) { m = 1; a++; }
    setMes(m);
    setAno(a);
    setDiaSelecionado(null);
  };

  const eventosDia = diaSelecionado ? (eventosPorDia[diaSelecionado] || []) : [];

  // Stats do mes
  const stats = {
    agendadas: eventos.filter(e => e.tipo === 'agenda' && e.status === 'pendente').length,
    realizadas: eventos.filter(e => e.status === 'realizada').length,
    atrasadas: eventos.filter(e => e.status === 'atrasada').length,
  };

  return (
    <>
      <header className="header">
        <div><h2 className="header-title">Calendario</h2><p className="header-subtitle">Visualizacao de coletas e agendamentos</p></div>
      </header>
      <div className="page-content">
        {/* Legenda */}
        <div style={{ display: 'flex', gap: 20, marginBottom: 20, flexWrap: 'wrap' }}>
          {Object.entries(STATUS_CONFIG).map(([k, v]) => (
            <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text-secondary)' }}>
              <span style={{ width: 12, height: 12, borderRadius: 3, background: v.cor, display: 'inline-block' }} />
              {v.label}
            </div>
          ))}
        </div>

        {/* Stats do mes */}
        <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: 20 }}>
          <div className="stat-card yellow"><div className="stat-card-value">{stats.agendadas}</div><div className="stat-card-change">Agendadas no mes</div></div>
          <div className="stat-card green"><div className="stat-card-value">{stats.realizadas}</div><div className="stat-card-change">Realizadas no mes</div></div>
          <div className="stat-card red"><div className="stat-card-value">{stats.atrasadas}</div><div className="stat-card-change">Atrasadas no mes</div></div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20 }}>
          {/* Calendario */}
          <div className="card">
            <div className="card-header">
              <button className="btn btn-secondary btn-sm" onClick={() => navMes(-1)}>{'\u25C0'}</button>
              <h3 className="card-title" style={{ textAlign: 'center', flex: 1 }}>{MESES[mes - 1]} {ano}</h3>
              <button className="btn btn-secondary btn-sm" onClick={() => navMes(1)}>{'\u25B6'}</button>
            </div>
            <div className="card-body" style={{ padding: 12 }}>
              {loading ? <div className="loading-container"><div className="spinner" /></div> : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
                  {/* Header dias da semana */}
                  {DIAS_SEMANA.map(d => (
                    <div key={d} style={{ textAlign: 'center', padding: '8px 0', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1 }}>
                      {d}
                    </div>
                  ))}
                  {/* Dias */}
                  {dias.map((d, i) => {
                    if (!d.dia) return <div key={`empty-${i}`} />;
                    const evts = eventosPorDia[d.data] || [];
                    const isHoje = d.data === hojeStr;
                    const isSelecionado = d.data === diaSelecionado;

                    return (
                      <div
                        key={d.data}
                        onClick={() => setDiaSelecionado(d.data === diaSelecionado ? null : d.data)}
                        style={{
                          padding: '8px 4px',
                          minHeight: 70,
                          borderRadius: 8,
                          cursor: 'pointer',
                          border: isSelecionado ? '2px solid var(--primary-400)' : isHoje ? '2px solid var(--accent-400)' : '1px solid var(--border-color)',
                          background: isSelecionado ? 'rgba(0,148,207,0.1)' : isHoje ? 'rgba(0,184,148,0.06)' : 'transparent',
                          transition: 'all 150ms ease',
                        }}
                      >
                        <div style={{ fontSize: 13, fontWeight: isHoje ? 700 : 500, color: isHoje ? 'var(--accent-400)' : 'var(--text-primary)', marginBottom: 4 }}>
                          {d.dia}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                          {evts.slice(0, 3).map((ev, j) => {
                            const cor = STATUS_CONFIG[ev.status]?.cor || '#5a6a7a';
                            return (
                              <div key={j} style={{
                                fontSize: 9,
                                padding: '2px 4px',
                                borderRadius: 3,
                                background: `${cor}22`,
                                color: cor,
                                fontWeight: 600,
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                              }}>
                                {ev.embarcacao_nome}
                              </div>
                            );
                          })}
                          {evts.length > 3 && (
                            <div style={{ fontSize: 9, color: 'var(--text-muted)', textAlign: 'center' }}>+{evts.length - 3} mais</div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Detalhes do dia selecionado */}
          <div className="card" style={{ alignSelf: 'start' }}>
            <div className="card-header">
              <h3 className="card-title">
                {diaSelecionado ? `${diaSelecionado.split('-')[2]}/${diaSelecionado.split('-')[1]}/${diaSelecionado.split('-')[0]}` : 'Selecione um dia'}
              </h3>
              {eventosDia.length > 0 && <span className="badge alerta">{eventosDia.length}</span>}
            </div>
            <div className="card-body" style={{ padding: 0, maxHeight: 500, overflowY: 'auto' }}>
              {!diaSelecionado ? (
                <div className="empty-state" style={{ padding: 40 }}><p>Clique em um dia do calendario para ver os detalhes</p></div>
              ) : eventosDia.length === 0 ? (
                <div className="empty-state" style={{ padding: 40 }}><p>Nenhum evento neste dia</p></div>
              ) : (
                eventosDia.map((ev, i) => {
                  const cor = STATUS_CONFIG[ev.status]?.cor || '#5a6a7a';
                  const tipoLabel = 'Agendada';
                  return (
                    <div key={i} style={{ padding: '14px 16px', borderBottom: '1px solid var(--border-color)', borderLeft: `3px solid ${cor}` }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                        <span className={`badge ${ev.status}`}>{tipoLabel}</span>
                        <span className={`badge ${ev.status}`}>{ev.status}</span>
                      </div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>{ev.embarcacao_nome}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{ev.tipo_analise}</div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
