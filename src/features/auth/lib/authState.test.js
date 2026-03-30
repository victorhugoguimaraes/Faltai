import {
  buildOfflineUser,
  clearPersistedSession,
  getOfflineAuthState,
  persistOfflineSession,
  persistOnlineSession,
  resolveAuthState
} from './authState';
import { storageKeys } from '../../../utils/storage';

describe('authState helpers', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('persiste sessao online', () => {
    const session = persistOnlineSession({ uid: '123', displayName: 'Victor' });

    expect(session.isOnline).toBe(true);
    expect(JSON.parse(localStorage.getItem(storageKeys.isOnline))).toBe(true);
  });

  it('monta e persiste sessao offline', () => {
    const session = persistOfflineSession({ displayName: 'Teste' });

    expect(buildOfflineUser().isOffline).toBe(true);
    expect(session.user.displayName).toBe('Teste');
    expect(JSON.parse(localStorage.getItem(storageKeys.isOnline))).toBe(false);
    expect(getOfflineAuthState().user.displayName).toBe('Teste');
  });

  it('resolve estado autenticado com dados remotos', () => {
    const state = resolveAuthState({
      firebaseUser: { uid: 'abc', email: 'aluno@example.com', displayName: 'Aluno' },
      isOnline: true,
      userDocData: { nome: 'Aluno', materias: [] },
      offlineUser: null
    });

    expect(state.isOnline).toBe(true);
    expect(state.user.uid).toBe('abc');
    expect(state.user.materias).toEqual([]);
  });

  it('limpa sessao persistida no logout', () => {
    persistOfflineSession({ displayName: 'Teste' });
    const state = clearPersistedSession();

    expect(state.user).toBeNull();
    expect(state.isOnline).toBe(false);
    expect(localStorage.getItem(storageKeys.offlineUser)).toBeNull();
  });
});
