const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const {
  filterDisciplinesByQuery,
  parseDepartments
} = require('../../api/unb/sigaa');
const {
  getSnapshotStats,
  loadSnapshot
} = require('../../api/unb/snapshotStore');

const SNAPSHOT_PATH = path.join(
  __dirname,
  '..',
  '..',
  'api',
  'data',
  'snapshots',
  'snapshot-2026-1.json'
);
const PROD_BASE_URL = process.env.UNB_PROD_API_URL || 'https://faltai-unb-api.onrender.com';
const LOCAL_PORT = 8796;

function summarize(values) {
  const sorted = [...values].sort((left, right) => left - right);
  const avg = values.reduce((sum, value) => sum + value, 0) / values.length;
  const pick = (percentile) =>
    sorted[Math.min(sorted.length - 1, Math.max(0, Math.ceil((percentile / 100) * sorted.length) - 1))];

  return {
    count: values.length,
    min: sorted[0],
    p50: pick(50),
    p95: pick(95),
    max: sorted[sorted.length - 1],
    avg
  };
}

function bench(fn, iterations) {
  const samples = [];

  for (let index = 0; index < iterations; index += 1) {
    const startedAt = process.hrtime.bigint();
    fn();
    samples.push(Number(process.hrtime.bigint() - startedAt) / 1e6);
  }

  return summarize(samples);
}

function legacySnapshotStats(snapshot) {
  const departmentIds = Object.keys(snapshot.disciplinesByDepartment || {});
  const activeDepartments = departmentIds.filter(
    (departmentId) => (snapshot.disciplinesByDepartment?.[departmentId] || []).length > 0
  );
  const totalDisciplines = departmentIds.reduce(
    (sum, departmentId) => sum + (snapshot.disciplinesByDepartment?.[departmentId]?.length || 0),
    0
  );
  const totalClasses = departmentIds.reduce(
    (sum, departmentId) =>
      sum +
      (snapshot.disciplinesByDepartment?.[departmentId] || []).reduce(
        (innerSum, discipline) => innerSum + (discipline.classes?.length || 0),
        0
      ),
    0
  );

  return {
    totalDepartments: snapshot.departments?.length || 0,
    activeDepartments: activeDepartments.length,
    totalDisciplines,
    totalClasses
  };
}

async function hit(url, timeoutMs = 60000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  const startedAt = process.hrtime.bigint();

  try {
    const response = await fetch(url, { signal: controller.signal });
    await response.text();
    return Number(process.hrtime.bigint() - startedAt) / 1e6;
  } finally {
    clearTimeout(timeout);
  }
}

async function runSeries(url, repetitions, timeoutMs) {
  const values = [];

  for (let index = 0; index < repetitions; index += 1) {
    values.push(await hit(url, timeoutMs));
  }

  return summarize(values);
}

async function startLocalServer() {
  const child = spawn(process.execPath, ['api/server.js'], {
    cwd: path.join(__dirname, '..', '..'),
    env: {
      ...process.env,
      PORT: String(LOCAL_PORT)
    },
    stdio: 'ignore'
  });

  await new Promise((resolve) => setTimeout(resolve, 2500));
  return child;
}

async function main() {
  if (!fs.existsSync(SNAPSHOT_PATH)) {
    throw new Error(`Snapshot nao encontrado em ${SNAPSHOT_PATH}`);
  }

  const rawSnapshot = JSON.parse(fs.readFileSync(SNAPSHOT_PATH, 'utf8'));
  const preparedSnapshot = loadSnapshot('2026', '1');
  const department508Raw = rawSnapshot.disciplinesByDepartment['508'] || [];
  const department508Prepared = preparedSnapshot.disciplinesByDepartment['508'] || [];
  const queries = ['pesquisa', 'introducao', 'redes', 'jorge', 'lab'];

  const legacyStatsSummary = bench(() => legacySnapshotStats(rawSnapshot), 2000);
  const preparedStatsSummary = bench(() => getSnapshotStats(preparedSnapshot), 2000);

  const legacyQuerySummary = bench(() => {
    queries.forEach((query) => {
      filterDisciplinesByQuery(department508Raw, query);
    });
  }, 500);

  const preparedQuerySummary = bench(() => {
    queries.forEach((query) => {
      filterDisciplinesByQuery(department508Prepared, query);
    });
  }, 500);

  const localServer = await startLocalServer();

  try {
    const localStatus = await runSeries(
      `http://127.0.0.1:${LOCAL_PORT}/api/unb/snapshot/status?year=2026&period=1`,
      10,
      10000
    );
    const localTurmas = await runSeries(
      `http://127.0.0.1:${LOCAL_PORT}/api/unb/turmas?department=508&year=2026&period=1&query=pesquisa`,
      10,
      20000
    );
    const prodTurmas = await runSeries(
      `${PROD_BASE_URL}/api/unb/turmas?department=508&year=2026&period=1&query=pesquisa`,
      10,
      20000
    );

    console.log(
      JSON.stringify(
        {
          snapshot: {
            path: SNAPSHOT_PATH,
            bytes: fs.statSync(SNAPSHOT_PATH).size,
            departments: rawSnapshot.departments.length,
            activeDepartments: legacySnapshotStats(rawSnapshot).activeDepartments,
            disciplines: legacySnapshotStats(rawSnapshot).totalDisciplines,
            classes: legacySnapshotStats(rawSnapshot).totalClasses
          },
          cpuComparison: {
            legacyStats: legacyStatsSummary,
            preparedStats: preparedStatsSummary,
            legacyQuery: legacyQuerySummary,
            preparedQuery: preparedQuerySummary
          },
          apiComparison: {
            localSnapshotStatus: localStatus,
            localSnapshotTurmas: localTurmas,
            prodTurmas
          }
        },
        null,
        2
      )
    );
  } finally {
    localServer.kill('SIGTERM');
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
