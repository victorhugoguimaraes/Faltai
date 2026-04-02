const express = require('express');
const cors = require('cors');
const webPush = require('web-push');
const {
  getDefaultSemester,
  getSemesterKey,
  getSnapshotStats,
  loadSnapshot,
  querySnapshotDisciplineByCode,
  querySnapshotSummaries,
  querySnapshot,
  refreshSnapshot
} = require('./unb/snapshotStore');
const {
  loadSubscriptions,
  removeSubscription,
  resolveVapidKeys,
  updateSubscriptionSettings,
  upsertSubscription
} = require('./pushStore');

const app = express();
const port = Number(process.env.PORT || process.env.UNB_API_PORT || 8787);
const host = process.env.UNB_API_HOST || '0.0.0.0';

const allowedOrigins = String(process.env.CORS_ORIGINS || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);
const PUSH_DISPATCH_INTERVAL = 1000 * 60 * 10;

const vapidKeys = resolveVapidKeys();
webPush.setVapidDetails(vapidKeys.subject, vapidKeys.publicKey, vapidKeys.privateKey);

const snapshotState = {
  snapshots: new Map(),
  refreshLocks: new Map(),
  warmupPromise: null
};

const defaultSemester = getDefaultSemester();

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error('Origin nao permitida pelo CORS.'));
    }
  })
);
app.use(express.json());

const getRequestSemester = (req) => ({
  year: String(req.query.year || req.body?.year || defaultSemester.year),
  period: String(req.query.period || req.body?.period || defaultSemester.period)
});

const getSnapshotFromMemory = ({ year, period }) => {
  const key = getSemesterKey(year, period);

  if (snapshotState.snapshots.has(key)) {
    return snapshotState.snapshots.get(key);
  }
  return null;
};

const refreshSnapshotWithLock = async ({ year, period }) => {
  const key = getSemesterKey(year, period);

  if (snapshotState.refreshLocks.has(key)) {
    console.log(`[snapshot] refresh reutilizado para ${year}/${period}`);
    return snapshotState.refreshLocks.get(key);
  }

  console.log(`[snapshot] refresh iniciado para ${year}/${period}`);
  const refreshPromise = refreshSnapshot({ year, period })
    .then((snapshot) => {
      snapshotState.snapshots.set(key, snapshot);
      console.log(
        `[snapshot] refresh concluido para ${year}/${period} em ${snapshot.refresh?.durationMs || 0}ms`
      );
      return snapshot;
    })
    .catch((error) => {
      console.error(`[snapshot] refresh falhou para ${year}/${period}:`, error.message);
      throw error;
    })
    .finally(() => {
      snapshotState.refreshLocks.delete(key);
    });

  snapshotState.refreshLocks.set(key, refreshPromise);
  return refreshPromise;
};

const warmSnapshotInMemory = async ({ year, period }) => {
  const key = getSemesterKey(year, period);

  if (snapshotState.snapshots.has(key)) {
    return snapshotState.snapshots.get(key);
  }

  const snapshot = await loadSnapshot(year, period);

  if (snapshot) {
    snapshotState.snapshots.set(key, snapshot);
    console.log(`[snapshot] carregado do disco para ${year}/${period}`);
  }

  return snapshot || null;
};

const ensureWarmSnapshot = async ({ year, period }) => {
  const key = getSemesterKey(year, period);

  if (snapshotState.snapshots.has(key)) {
    return snapshotState.snapshots.get(key);
  }

  if (!snapshotState.warmupPromise) {
    snapshotState.warmupPromise = warmSnapshotInMemory({ year, period }).finally(() => {
      snapshotState.warmupPromise = null;
    });
  }

  return snapshotState.warmupPromise;
};

const getReadySnapshot = async (semester) => {
  const snapshot = getSnapshotFromMemory(semester);

  if (snapshot) {
    return snapshot;
  }

  return ensureWarmSnapshot(semester);
};

const isLoopbackRequest = (req) => {
  const remoteAddress = String(req.ip || req.socket?.remoteAddress || '');
  return remoteAddress.includes('127.0.0.1') || remoteAddress.includes('::1');
};

const canRefreshSnapshot = (req) => {
  const adminKey = process.env.UNB_SNAPSHOT_ADMIN_KEY;

  if (adminKey) {
    return req.get('x-snapshot-admin-key') === adminKey;
  }

  return isLoopbackRequest(req);
};

const parseWeeklyReminderDate = (settings = {}, now = new Date()) => {
  const reminderDay = Number(settings.weeklyReminderDay ?? 6);
  const reminderTime = String(settings.weeklyReminderTime || '13:00');
  const [hours = '13', minutes = '00'] = reminderTime.split(':');
  const scheduledDate = new Date(now);

  scheduledDate.setHours(Number(hours), Number(minutes), 0, 0);

  const today = now.getDay();
  let daysUntil = reminderDay - today;

  if (daysUntil < 0) {
    daysUntil += 7;
  }

  scheduledDate.setDate(now.getDate() + daysUntil);

  if (daysUntil === 0 && scheduledDate > now) {
    return null;
  }

  return scheduledDate;
};

const shouldSendWeeklyReminder = (record, now = new Date()) => {
  if (!record?.settings?.systemNotifications || !record?.settings?.weeklyReminders) {
    return false;
  }

  const scheduledDate = parseWeeklyReminderDate(record.settings, now);

  if (!scheduledDate || scheduledDate > now) {
    return false;
  }

  const lastSentAt = record.lastWeeklyReminderAt ? new Date(record.lastWeeklyReminderAt) : null;

  if (!lastSentAt) {
    return true;
  }

  return now.getTime() - lastSentAt.getTime() > 6 * 24 * 60 * 60 * 1000;
};

const sendPushMessage = async (subscription, payload) => {
  const body = JSON.stringify(payload);
  return webPush.sendNotification(subscription, body);
};

const persistSubscriptionRecord = (record) => {
  upsertSubscription({
    subscription: record.subscription,
    settings: record.settings,
    metadata: record.metadata,
    lastWeeklyReminderAt: record.lastWeeklyReminderAt
  });
};

const dispatchWeeklyReminders = async () => {
  const now = new Date();
  const subscriptions = loadSubscriptions();

  await Promise.all(
    subscriptions.map(async (record) => {
      if (!shouldSendWeeklyReminder(record, now)) {
        return;
      }

      try {
        await sendPushMessage(record.subscription, {
          title: record.metadata?.weeklyReminderTitle || 'Faltai',
          body: record.metadata?.weeklyReminderBody || 'Hora de revisar as faltas da semana e deixar o semestre em ordem.',
          tag: 'weekly-reminder',
          url: `${record.metadata?.baseUrl || '/'}?action=review-faltas`
        });

        record.lastWeeklyReminderAt = now.toISOString();
        persistSubscriptionRecord(record);
      } catch (error) {
        if (error.statusCode === 404 || error.statusCode === 410) {
          removeSubscription(record.subscription);
        } else {
          console.error('Erro ao enviar push semanal:', error.message);
        }
      }
    })
  );
};

app.get('/', (_req, res) => {
  res.json({
    name: 'Faltai UnB API',
    ok: true,
    endpoints: [
      '/api/health',
      '/api/unb/departamentos',
      '/api/unb/turmas',
      '/api/unb/disciplina',
      '/api/unb/snapshot/status',
      '/api/unb/snapshot/refresh',
      '/api/push/public-key',
      '/api/push/subscribe',
      '/api/push/settings',
      '/api/push/unsubscribe',
      '/api/push/test'
    ]
  });
});

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

app.get('/api/push/public-key', (_req, res) => {
  res.json({
    publicKey: vapidKeys.publicKey
  });
});

app.post('/api/push/subscribe', async (req, res) => {
  const { subscription, settings = {}, metadata = {} } = req.body || {};

  if (!subscription?.endpoint) {
    res.status(400).json({ message: 'Subscription invalida.' });
    return;
  }

  const record = upsertSubscription({
    subscription,
    settings,
    metadata
  });

  res.json({
    ok: true,
    subscriptionId: record.id
  });
});

app.post('/api/push/settings', async (req, res) => {
  const { subscription, settings = {}, metadata = {} } = req.body || {};

  if (!subscription?.endpoint) {
    res.status(400).json({ message: 'Subscription invalida.' });
    return;
  }

  const record = updateSubscriptionSettings({
    subscription,
    settings,
    metadata
  });

  res.json({
    ok: true,
    subscriptionId: record.id
  });
});

app.post('/api/push/unsubscribe', async (req, res) => {
  const { subscription } = req.body || {};

  if (!subscription?.endpoint) {
    res.status(400).json({ message: 'Subscription invalida.' });
    return;
  }

  removeSubscription(subscription);
  res.json({ ok: true });
});

app.post('/api/push/test', async (req, res) => {
  const { subscription } = req.body || {};

  if (!subscription?.endpoint) {
    res.status(400).json({ message: 'Subscription invalida.' });
    return;
  }

  try {
    await sendPushMessage(subscription, {
      title: 'Faltai',
      body: 'Push real enviado pela API. Seu dispositivo esta conectado.',
      tag: 'push-test',
      url: `${req.body?.metadata?.baseUrl || '/'}?action=review-faltas`
    });

    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({
      message: 'Nao foi possivel enviar o push de teste.',
      detail: error.message
    });
  }
});

app.get('/api/unb/departamentos', async (_req, res) => {
  try {
    const semester = getRequestSemester(_req);
    const snapshot = await getReadySnapshot(semester);

    if (snapshot?.departments?.length) {
      res.json({
        departments: snapshot.departments,
        cached: true,
        source: 'snapshot',
        semester
      });
      return;
    }

    res.status(503).json({
      message: 'Snapshot da UnB indisponivel. Atualize manualmente antes de consultar departamentos.',
      semester
    });
    return;

  } catch (error) {
    res.status(500).json({
      message: 'Nao foi possivel carregar os departamentos da UnB.',
      detail: error.message
    });
  }
});

app.get('/api/unb/snapshot/status', async (req, res) => {
  try {
    const semester = getRequestSemester(req);
    const snapshot = await getReadySnapshot(semester);

    if (!snapshot) {
      res.json({
        ok: true,
        available: false,
        semester
      });
      return;
    }

    res.json({
      ok: true,
      available: true,
      semester,
      updatedAt: snapshot.updatedAt,
      refresh: snapshot.refresh,
      stats: getSnapshotStats(snapshot)
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      message: 'Nao foi possivel consultar o status do snapshot.',
      detail: error.message
    });
  }
});

app.post('/api/unb/snapshot/refresh', async (req, res) => {
  const semester = getRequestSemester(req);
  console.log(`[snapshot] POST /refresh recebido para ${semester.year}/${semester.period}`);

  if (!canRefreshSnapshot(req)) {
    console.warn(`[snapshot] refresh negado para ${semester.year}/${semester.period}`);
    res.status(403).json({
      message: 'Refresh manual do snapshot nao autorizado.'
    });
    return;
  }

  try {
    console.log(`[snapshot] refresh autorizado para ${semester.year}/${semester.period}`);
    const snapshot = await refreshSnapshotWithLock(semester);

    res.json({
      ok: true,
      semester,
      updatedAt: snapshot.updatedAt,
      stats: getSnapshotStats(snapshot),
      refresh: snapshot.refresh
    });
  } catch (error) {
    res.status(500).json({
      message: 'Nao foi possivel atualizar o snapshot do semestre.',
      detail: error.message
    });
  }
});

app.get('/api/unb/turmas', async (req, res) => {
  try {
    const department = String(req.query.department || '');
    const { year, period } = getRequestSemester(req);
    const query = String(req.query.query || '');

    if (!department) {
      res.status(400).json({ message: 'O parametro "department" e obrigatorio.' });
      return;
    }

    const semester = { year, period };
    const snapshot = await getReadySnapshot(semester);

    if (snapshot) {
      const disciplines = querySnapshotSummaries(snapshot, { department, query });

      res.json({
        disciplines,
        cached: true,
        queryCached: true,
        source: 'snapshot',
        semester
      });
      return;
    }

    res.status(503).json({
      message: 'Snapshot da UnB indisponivel. Atualize manualmente antes de consultar turmas.',
      semester
    });
  } catch (error) {
    res.status(500).json({
      message: 'Nao foi possivel consultar as turmas da UnB.',
      detail: error.message
    });
  }
});

app.get('/api/unb/disciplina', async (req, res) => {
  try {
    const department = String(req.query.department || '');
    const { year, period } = getRequestSemester(req);
    const code = String(req.query.code || '');

    if (!department) {
      res.status(400).json({ message: 'O parametro "department" e obrigatorio.' });
      return;
    }

    if (!code) {
      res.status(400).json({ message: 'O parametro "code" e obrigatorio.' });
      return;
    }

    const semester = { year, period };
    const snapshot = await getReadySnapshot(semester);

    if (snapshot) {
      const discipline = querySnapshotDisciplineByCode(snapshot, { department, code });

      if (!discipline) {
        res.status(404).json({ message: 'Disciplina nao encontrada para esse departamento.' });
        return;
      }

      res.json({
        discipline,
        cached: true,
        source: 'snapshot',
        semester
      });
      return;
    }

    res.status(503).json({
      message: 'Snapshot da UnB indisponivel. Atualize manualmente antes de consultar disciplinas.',
      semester
    });
  } catch (error) {
    res.status(500).json({
      message: 'Nao foi possivel consultar a disciplina da UnB.',
      detail: error.message
    });
  }
});

setInterval(() => {
  dispatchWeeklyReminders().catch((error) => {
    console.error('Erro ao despachar lembretes semanais:', error.message);
  });
}, PUSH_DISPATCH_INTERVAL);

warmSnapshotInMemory(defaultSemester).catch((error) => {
  console.error(`Erro ao carregar snapshot ${defaultSemester.year}/${defaultSemester.period}:`, error.message);
});

app.listen(port, host, () => {
  console.log(`UnB API disponivel em http://${host}:${port}`);
});

module.exports = app;
