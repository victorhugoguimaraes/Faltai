import { getFirebaseDb } from '../../../firebase';
import { getStorageValue, removeStorageValue, setStorageValue, storageKeys } from '../../../utils/storage';
import { sanitizeMateria } from '../../../utils/validation';

const SUBJECTS_COLLECTION = 'subjects';
const STORAGE_SCOPE_OFFLINE = 'offline';

const sortByName = (left, right) => String(left?.nome || '').localeCompare(String(right?.nome || ''), 'pt-BR');

const buildStorageKey = (baseKey, scope) => `${baseKey}:${scope || STORAGE_SCOPE_OFFLINE}`;

const createStableId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return `materia-${Date.now()}-${Math.random().toString(16).slice(2, 10)}`;
};

const buildSearchTokens = (materia) => {
  const source = [
    materia.nome,
    materia.local,
    ...(Array.isArray(materia.horarioResumo) ? materia.horarioResumo : []),
    materia.turmaUnb?.codigo,
    materia.turmaUnb?.turma,
    ...(Array.isArray(materia.turmaUnb?.professores) ? materia.turmaUnb.professores : [])
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, ' ')
    .replace(/[^a-z0-9\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  return Array.from(new Set(source.split(' ').filter(Boolean))).slice(0, 40);
};

export const normalizeMateriaRecord = (materia) => {
  const sanitized = sanitizeMateria(materia);
  const id = String(sanitized.id || materia?.id || createStableId());
  const faltas = Number(sanitized.faltas) || 0;
  const maxFaltas = Number(sanitized.maxFaltas) || 0;
  const usedAbsencePercent = maxFaltas > 0 ? Number(((faltas / maxFaltas) * 100).toFixed(1)) : 0;
  const presencePercent = Math.max(0, Number((100 - usedAbsencePercent).toFixed(1)));
  const nextEvaluationAt = (sanitized.avaliacoes || [])
    .map((avaliacao) => avaliacao?.data)
    .filter(Boolean)
    .filter((data) => new Date(data).getTime() >= new Date().setHours(0, 0, 0, 0))
    .sort()[0] || null;

  const riskLevel =
    usedAbsencePercent >= 90 ? 3
      : usedAbsencePercent >= 75 ? 2
        : usedAbsencePercent >= 50 ? 1
          : 0;

  const normalized = {
    ...sanitized,
    id,
    updatedAt: materia?.updatedAt || new Date().toISOString(),
    presencePercent,
    usedAbsencePercent,
    riskLevel,
    nextEvaluationAt,
    searchTokens: buildSearchTokens(sanitized)
  };

  return normalized;
};

export const normalizeMateriaList = (materias = []) =>
  materias.map((materia) => normalizeMateriaRecord(materia)).sort(sortByName);

const toFirestorePayload = (materia) => {
  const normalized = normalizeMateriaRecord(materia);
  const { syncStatus, ...persistedMateria } = normalized;
  return {
    ...persistedMateria
  };
};

export const getMateriasStorageScope = (user) => (user?.uid ? user.uid : STORAGE_SCOPE_OFFLINE);

export const loadLocalMaterias = (scope) =>
  normalizeMateriaList(getStorageValue(buildStorageKey(storageKeys.materias, scope), []));

export const saveLocalMaterias = (scope, materias) =>
  setStorageValue(buildStorageKey(storageKeys.materias, scope), normalizeMateriaList(materias));

const loadQueueState = (scope) =>
  getStorageValue(buildStorageKey(storageKeys.materiasSyncQueue, scope), { upserts: {}, deletes: [] });

const saveQueueState = (scope, queue) => setStorageValue(buildStorageKey(storageKeys.materiasSyncQueue, scope), queue);

export const getPendingSyncState = (scope) => loadQueueState(scope);

export const clearPendingSyncState = (scope) => removeStorageValue(buildStorageKey(storageKeys.materiasSyncQueue, scope));

export const queueMateriaUpsert = (scope, materia) => {
  const queue = loadQueueState(scope);
  const normalized = normalizeMateriaRecord(materia);
  const nextQueue = {
    upserts: {
      ...queue.upserts,
      [normalized.id]: normalized
    },
    deletes: queue.deletes.filter((currentId) => currentId !== normalized.id)
  };

  saveQueueState(scope, nextQueue);
  return nextQueue;
};

export const queueMateriaDelete = (scope, materiaId) => {
  const id = String(materiaId);
  const queue = loadQueueState(scope);
  const nextUpserts = { ...queue.upserts };
  delete nextUpserts[id];

  const nextQueue = {
    upserts: nextUpserts,
    deletes: Array.from(new Set([...queue.deletes, id]))
  };

  saveQueueState(scope, nextQueue);
  return nextQueue;
};

export const markMateriasWithPendingState = (materias, queue) => {
  const pendingUpserts = new Set(Object.keys(queue?.upserts || {}));
  const pendingDeletes = new Set(queue?.deletes || []);

  return normalizeMateriaList(materias)
    .filter((materia) => !pendingDeletes.has(String(materia.id)))
    .map((materia) => ({
      ...materia,
      syncStatus: pendingUpserts.has(String(materia.id)) ? 'pending' : 'synced'
    }));
};

export const mergeRemoteMateriasWithPending = ({ remoteMaterias, localMaterias, queue }) => {
  const pendingUpserts = queue?.upserts || {};
  const pendingDeletes = new Set(queue?.deletes || []);
  const byId = new Map();

  normalizeMateriaList(remoteMaterias).forEach((materia) => {
    byId.set(String(materia.id), materia);
  });

  normalizeMateriaList(localMaterias).forEach((materia) => {
    if (!byId.has(String(materia.id))) {
      byId.set(String(materia.id), materia);
    }
  });

  Object.values(pendingUpserts).forEach((materia) => {
    byId.set(String(materia.id), normalizeMateriaRecord(materia));
  });

  pendingDeletes.forEach((materiaId) => {
    byId.delete(String(materiaId));
  });

  return markMateriasWithPendingState(Array.from(byId.values()), queue);
};

const getUserDocRef = (firestoreModule, db, userId) => firestoreModule.doc(db, 'usuarios', userId);
const getSubjectDocRef = (firestoreModule, db, userId, materiaId) =>
  firestoreModule.doc(db, 'usuarios', userId, SUBJECTS_COLLECTION, String(materiaId));

const migrateLegacyMaterias = async ({ firestoreModule, db, userId, userDocData }) => {
  const legacyMaterias = Array.isArray(userDocData?.materias) ? userDocData.materias : [];

  if (legacyMaterias.length === 0) {
    return [];
  }

  const batch = firestoreModule.writeBatch(db);
  const normalized = normalizeMateriaList(legacyMaterias);

  normalized.forEach((materia) => {
    batch.set(getSubjectDocRef(firestoreModule, db, userId, materia.id), toFirestorePayload(materia), { merge: true });
  });

  batch.update(getUserDocRef(firestoreModule, db, userId), {
    materias: firestoreModule.deleteField()
  });

  await batch.commit();
  return normalized;
};

export const loadRemoteMaterias = async (userId) => {
  const db = await getFirebaseDb();

  if (!db || !userId) {
    return [];
  }

  const firestoreModule = await import('firebase/firestore');
  const subjectsSnapshot = await firestoreModule.getDocs(
    firestoreModule.collection(db, 'usuarios', userId, SUBJECTS_COLLECTION)
  );

  if (!subjectsSnapshot.empty) {
    return normalizeMateriaList(subjectsSnapshot.docs.map((docSnapshot) => ({
      id: docSnapshot.id,
      ...docSnapshot.data()
    })));
  }

  const userDocSnapshot = await firestoreModule.getDoc(getUserDocRef(firestoreModule, db, userId));

  if (!userDocSnapshot.exists()) {
    return [];
  }

  return migrateLegacyMaterias({
    firestoreModule,
    db,
    userId,
    userDocData: userDocSnapshot.data()
  });
};

export const flushMateriasSync = async (userId, scope) => {
  const queue = loadQueueState(scope);
  const upserts = Object.values(queue.upserts || {});
  const deletes = queue.deletes || [];

  if (!userId || (upserts.length === 0 && deletes.length === 0)) {
    return { synced: false };
  }

  const db = await getFirebaseDb();

  if (!db) {
    throw new Error('Firestore indisponivel');
  }

  const firestoreModule = await import('firebase/firestore');
  const batch = firestoreModule.writeBatch(db);

  upserts.forEach((materia) => {
    batch.set(
      getSubjectDocRef(firestoreModule, db, userId, materia.id),
      toFirestorePayload({
        ...materia,
        updatedAt: new Date().toISOString()
      }),
      { merge: true }
    );
  });

  deletes.forEach((materiaId) => {
    batch.delete(getSubjectDocRef(firestoreModule, db, userId, materiaId));
  });

  await batch.commit();
  clearPendingSyncState(scope);
  return { synced: true, upserts: upserts.length, deletes: deletes.length };
};
