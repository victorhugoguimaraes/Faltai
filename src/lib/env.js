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
