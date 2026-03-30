import { getEnvValue } from '../../../lib/env';

const configuredApiBaseUrl = getEnvValue('VITE_UNB_API_URL', 'UNB_API_URL', '').replace(/\/$/, '');

const resolveApiBaseUrl = () => {
  if (configuredApiBaseUrl) {
    return configuredApiBaseUrl;
  }

  if (typeof window !== 'undefined') {
    const { hostname } = window.location;

    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'http://localhost:8787';
    }
  }

  return '';
};

const withBaseUrl = (path) => {
  const apiBaseUrl = resolveApiBaseUrl();
  return apiBaseUrl ? `${apiBaseUrl}${path}` : path;
};

async function requestJson(path) {
  let response;

  try {
    response = await fetch(withBaseUrl(path));
  } catch (error) {
    throw new Error(
      'A API local da UnB não respondeu. Inicie `npm run dev:api` ou configure `VITE_UNB_API_URL`.'
    );
  }

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(errorBody.message || 'Erro ao consultar a API da UnB.');
  }

  return response.json();
}

export const fetchUnbDepartments = async () => {
  const data = await requestJson('/api/unb/departamentos');
  return data.departments || [];
};

export const fetchUnbClasses = async ({ department, year, period, query }) => {
  const params = new URLSearchParams({
    department: String(department),
    year: String(year),
    period: String(period),
    query: query || ''
  });

  const data = await requestJson(`/api/unb/turmas?${params.toString()}`);
  return data.disciplines || [];
};
