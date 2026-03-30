import {
  getStorageValue,
  removeStorageValue,
  setStorageValue,
  storageKeys
} from './storage';

describe('storage utils', () => {
  afterEach(() => {
    localStorage.clear();
  });

  it('salva e recupera valores serializados', () => {
    setStorageValue(storageKeys.materias, [{ nome: 'Fisica' }]);

    expect(getStorageValue(storageKeys.materias, [])).toEqual([{ nome: 'Fisica' }]);
  });

  it('retorna fallback para chaves ausentes', () => {
    expect(getStorageValue(storageKeys.offlineUser, null)).toBeNull();
  });

  it('remove valores existentes', () => {
    setStorageValue(storageKeys.isOnline, true);
    removeStorageValue(storageKeys.isOnline);

    expect(getStorageValue(storageKeys.isOnline, false)).toBe(false);
  });
});
