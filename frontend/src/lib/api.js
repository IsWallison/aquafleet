const API_BASE = '/api';

export async function fetchAPI(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: 'Erro desconhecido' }));
    throw new Error(error.detail || `Erro ${res.status}`);
  }
  if (res.status === 204) return null;
  return res.json();
}

// Dashboard
export const getDashboardResumo = (mes, ano) => fetchAPI(`/dashboard/resumo${mes ? `?mes=${mes}&ano=${ano}` : ''}`);
export const getColetasPorEmbarcacao = (mes, ano) => fetchAPI(`/dashboard/por-embarcacao${mes ? `?mes=${mes}&ano=${ano}` : ''}`);
export const getColetasPorEmpresa = (mes, ano) => fetchAPI(`/dashboard/por-empresa${mes ? `?mes=${mes}&ano=${ano}` : ''}`);
export const getPrevisao = (dias = 90) => fetchAPI(`/dashboard/previsao?dias=${dias}`);
export const getAlertas = () => fetchAPI('/dashboard/alertas');
export const getCalendario = (mes, ano) => fetchAPI(`/dashboard/calendario?mes=${mes}&ano=${ano}`);

// Empresas
export const getEmpresas = () => fetchAPI('/empresas/');
export const criarEmpresa = (data) => fetchAPI('/empresas/', { method: 'POST', body: JSON.stringify(data) });
export const deletarEmpresa = (id) => fetchAPI(`/empresas/${id}`, { method: 'DELETE' });

// Embarcacoes
export const getEmbarcacoes = (empresaId) => fetchAPI(`/embarcacoes/${empresaId ? `?empresa_id=${empresaId}` : ''}`);
export const criarEmbarcacao = (data) => fetchAPI('/embarcacoes/', { method: 'POST', body: JSON.stringify(data) });
export const deletarEmbarcacao = (id) => fetchAPI(`/embarcacoes/${id}`, { method: 'DELETE' });
export const silenciarAlerta = (id) => fetchAPI(`/embarcacoes/${id}/silenciar-alerta`, { method: 'PUT' });

// Coletas
export const getColetas = (params = {}) => {
  const qs = new URLSearchParams(params).toString();
  return fetchAPI(`/coletas/${qs ? `?${qs}` : ''}`);
};
export const criarColeta = (data) => fetchAPI('/coletas/', { method: 'POST', body: JSON.stringify(data) });
export const editarColeta = (id, data) => fetchAPI(`/coletas/${id}`, { method: 'PUT', body: JSON.stringify(data) });

// Agenda
export const getAgenda = (params = {}) => {
  const qs = new URLSearchParams(params).toString();
  return fetchAPI(`/agenda/${qs ? `?${qs}` : ''}`);
};
export const criarAgenda = (data) => fetchAPI('/agenda/', { method: 'POST', body: JSON.stringify(data) });
export const cancelarAgenda = (id) => fetchAPI(`/agenda/${id}/cancelar`, { method: 'PUT' });
export const justificarAgenda = (id, justificativa) => fetchAPI(`/agenda/${id}/justificar`, { method: 'PUT', body: JSON.stringify({ justificativa }) });

// Locais
export const getLocais = () => fetchAPI('/locais/');
export const criarLocal = (nome) => fetchAPI('/locais/', { method: 'POST', body: JSON.stringify({ nome }) });
