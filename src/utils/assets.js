import { getBaseUrl } from '../lib/env';

export const getPublicAssetPath = (assetPath = '') => {
  const normalizedBase = getBaseUrl().replace(/\/$/, '');
  const normalizedPath = assetPath.startsWith('/') ? assetPath : `/${assetPath}`;

  return `${normalizedBase}${normalizedPath}`;
};
