import { getPublicAssetPath } from './assets';

describe('getPublicAssetPath', () => {
  const originalPublicUrl = process.env.PUBLIC_URL;

  afterEach(() => {
    process.env.PUBLIC_URL = originalPublicUrl;
  });

  it('usa o base path do Vite quando PUBLIC_URL nao esta definido', () => {
    delete process.env.PUBLIC_URL;

    expect(getPublicAssetPath('/icon-192.png')).toBe('/Faltai/icon-192.png');
  });

  it('concatena o subpath do GitHub Pages sem barra duplicada', () => {
    process.env.PUBLIC_URL = '/Faltai';

    expect(getPublicAssetPath('/sw/sw.js')).toBe('/Faltai/sw/sw.js');
    expect(getPublicAssetPath('icon-192.png')).toBe('/Faltai/icon-192.png');
  });
});
