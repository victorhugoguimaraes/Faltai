const express = require('express');
const cors = require('cors');
const webPush = require('web-push');
const {
  getInitialForm,
  parseDepartments,
  searchTurmas,
  filterDisciplinesByQuery
} = require('./unb/sigaa');
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

const cache = {
  departments: null,
  departmentsAt: 0,
  baseSearches: new Map()
};

const DEPARTMENTS_TTL = 1000 * 60 * 60 * 6;
const SEARCH_TTL = 1000 * 60 * 30;
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
    return snapshotState.refreshLocks.get(key);
  }

  const refreshPromise = refreshSnapshot({ year, period })
    .then((snapshot) => {
      snapshotState.snapshots.set(key, snapshot);
      return snapshot;
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
    return snapshot;
  }

  return refreshSnapshotWithLock({ year, period });
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
    const snapshot = await ensureWarmSnapshot(semester);

    if (snapshot?.departments?.length) {
      res.json({
        departments: snapshot.departments,
        cached: true,
        source: 'snapshot',
        semester
      });
      return;
    }

    const now = Date.now();

    if (cache.departments && now - cache.departmentsAt < DEPARTMENTS_TTL) {
      res.json({ departments: cache.departments, cached: true });
      return;
    }

    const { html } = await getInitialForm();
    const departments = parseDepartments(html);

    cache.departments = departments;
    cache.departmentsAt = now;

    res.json({ departments, cached: false });
  } catch (error) {
    res.status(500).json({
      message: 'Nao foi possivel carregar os departamentos da UnB.',
      detail: error.message
    });
  }
});

app.get('/api/unb/snapshot/status', (req, res) => {
  const semester = getRequestSemester(req);
  const snapshot = getSnapshotFromMemory(semester);

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
});

app.post('/api/unb/snapshot/refresh', async (req, res) => {
  if (!canRefreshSnapshot(req)) {
    res.status(403).json({
      message: 'Refresh manual do snapshot nao autorizado.'
    });
    return;
  }

  try {
    const semester = getRequestSemester(req);
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
    const snapshot = await ensureWarmSnapshot(semester);

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

    const cacheKey = `${department}:${year}:${period}`;
    const cached = cache.baseSearches.get(cacheKey);

    let disciplines;
    let cachedBase = false;

    if (cached && Date.now() - cached.at < SEARCH_TTL) {
      disciplines = cached.data;
      cachedBase = true;
    } else {
      disciplines = await searchTurmas({ department, year, period });
      cache.baseSearches.set(cacheKey, { data: disciplines, at: Date.now() });
    }

    const filteredDisciplines = filterDisciplinesByQuery(disciplines, query);

    res.json({
      disciplines: filteredDisciplines,
      cached: cachedBase,
      queryCached: Boolean(query) && cachedBase
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
    const snapshot = await ensureWarmSnapshot(semester);

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

    const disciplines = await searchTurmas({ department, year, period });
    const discipline = disciplines.find((item) => item.code === code);

    if (!discipline) {
      res.status(404).json({ message: 'Disciplina nao encontrada para esse departamento.' });
      return;
    }

    res.json({
      discipline,
      cached: false,
      source: 'sigaa',
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

ensureWarmSnapshot(defaultSemester)
  .catch((error) => {
    console.error(`Erro ao preparar snapshot ${defaultSemester.year}/${defaultSemester.period}:`, error.message);
  })
  .finally(() => {
    app.listen(port, host, () => {
      console.log(`UnB API disponivel em http://${host}:${port}`);
    });
  });

module.exports = app;
