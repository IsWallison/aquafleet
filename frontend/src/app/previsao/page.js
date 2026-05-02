'use client';
import { useState, useEffect } from 'react';
import { getPrevisao } from '@/lib/api';

const STATUS_COLORS = { critico: '#ee5a5a', atrasado: '#f0a500', alerta: '#ffc048', em_dia: '#40c057', sem_dados: '#5a6a7a' };

export default function PrevisaoPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { getPrevisao().then(setData).finally(() => setLoading(false)); }, []);

  return (
    <>
      <header className="header">
        <div><h2 className="header-title">Previsao de Demanda</h2><p className="header-subtitle">Baseada no historico de coletas</p></div>
      </header>
      <div className="page-content">
        {loading ? <div className="loading-container"><div className="spinner" /></div> : data && (
          <div className="card">
            <div className="card-header"><h3 className="card-title">Previsao por Embarcacao</h3></div>
            <div className="card-body" style={{ padding: 0 }}>
              <table className="data-table">
                <thead><tr><th>Embarcacao</th><th>Empresa</th><th>Proxima Coleta</th><th>Dias</th><th>Freq. Media</th><th>Total Coletas</th><th>Status</th><th>Sugestao</th></tr></thead>
                <tbody>
                  {data.por_embarcacao.map((p, i) => (
                    <tr key={i}>
                      <td style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{p.embarcacao_nome}</td>
                      <td>{p.empresa_nome}</td>
                      <td>{p.proxima_coleta_prevista || '--'}</td>
                      <td style={{ fontWeight: 600, color: p.dias_ate_proxima != null && p.dias_ate_proxima < 0 ? 'var(--danger-400)' : p.dias_ate_proxima != null && p.dias_ate_proxima <= 7 ? 'var(--warning-400)' : 'var(--text-secondary)' }}>
                        {p.dias_ate_proxima != null ? (p.dias_ate_proxima < 0 ? `${Math.abs(p.dias_ate_proxima)} atrasado` : p.dias_ate_proxima) : '--'}
                      </td>
                      <td>{p.frequencia_media_dias ? `${p.frequencia_media_dias} dias` : '--'}</td>
                      <td>{p.total_coletas}</td>
                      <td><span className={`badge ${p.status}`}>{p.status.replace('_', ' ')}</span></td>
                      <td style={{ fontSize: 12, maxWidth: 200 }}>{p.sugestao || '--'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
