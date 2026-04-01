export const getEnvValue = (viteKey, legacyKey, fallbackValue = '') => {
  const viteValue =
    typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env[viteKey] : undefined;

  if (viteValue !== undefined && viteValue !== '') {
    return viteValue;
  }

  const legacyValue =
    typeof process !== 'undefined' && process.env ? process.env[legacyKey] : undefined;

  if (legacyValue !== undefined && legacyValue !== '') {
    return legacyValue;
  }

  return fallbackValue;
};

export const getBaseUrl = () => {
  const baseUrl = getEnvValue('BASE_URL', 'PUBLIC_URL', '/');
  return baseUrl || '/';
};

export const getApiBaseUrl = () => {
  const configuredApiBaseUrl =
    getEnvValue('VITE_API_URL', 'REACT_APP_API_URL', '') ||
    getEnvValue('VITE_UNB_API_URL', 'UNB_API_URL', '');

  if (configuredApiBaseUrl) {
    return configuredApiBaseUrl.replace(/\/$/, '');
  }

  if (typeof window !== 'undefined') {
    const { hostname } = window.location;

    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'http://localhost:8787';
    }
  }

  return '';
};
