const fs = require('fs');
const path = require('path');
const {
  filterDisciplinesByQuery,
  getInitialForm,
  parseDepartments,
  searchTurmas
} = require('./sigaa');

const SNAPSHOT_DIR = path.join(__dirname, '..', 'data', 'snapshots');
const REFRESH_INTERVAL_MS = 7 * 24 * 60 * 60 * 1000;

function ensureSnapshotDir() {
  fs.mkdirSync(SNAPSHOT_DIR, { recursive: true });
}

function getSemesterKey(year, period) {
  return `${year}-${period}`;
}

function getSnapshotPath(year, period) {
  ensureSnapshotDir();
  return path.join(SNAPSHOT_DIR, `snapshot-${year}-${period}.json`);
}

function getDefaultSemester() {
  const now = new Date();
  const defaultYear = String(process.env.UNB_SNAPSHOT_YEAR || now.getFullYear());
  const defaultPeriod = String(process.env.UNB_SNAPSHOT_PERIOD || '1');

  return {
    year: defaultYear,
    period: defaultPeriod
  };
}

function loadSnapshot(year, period) {
  const snapshotPath = getSnapshotPath(year, period);

  if (!fs.existsSync(snapshotPath)) {
    return null;
  }

  return JSON.parse(fs.readFileSync(snapshotPath, 'utf8'));
}

function saveSnapshot(snapshot) {
  const snapshotPath = getSnapshotPath(snapshot.semester.year, snapshot.semester.period);
  fs.writeFileSync(snapshotPath, JSON.stringify(snapshot, null, 2));
  return snapshotPath;
}

function getSnapshotStats(snapshot) {
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

async function refreshSnapshot({
  year,
  period,
  concurrency = Number(process.env.UNB_SNAPSHOT_CONCURRENCY || 3)
}) {
  const normalizedYear = String(year);
  const normalizedPeriod = String(period);
  const startedAt = Date.now();
  const { html } = await getInitialForm();
  const departments = parseDepartments(html);
  const disciplinesByDepartment = {};
  const failures = [];

  for (let startIndex = 0; startIndex < departments.length; startIndex += concurrency) {
    const batch = departments.slice(startIndex, startIndex + concurrency);
    const batchResults = await Promise.all(
      batch.map(async (department) => {
        try {
          const disciplines = await searchTurmas({
            department: department.id,
            year: normalizedYear,
            period: normalizedPeriod
          });
          return {
            ok: true,
            departmentId: department.id,
            disciplines
          };
        } catch (error) {
          return {
            ok: false,
            departmentId: department.id,
            error: error.message
          };
        }
      })
    );

    batchResults.forEach((result) => {
      if (result.ok) {
        disciplinesByDepartment[result.departmentId] = result.disciplines;
      } else {
        failures.push({
          departmentId: result.departmentId,
          error: result.error
        });
        disciplinesByDepartment[result.departmentId] = [];
      }
    });
  }

  const snapshot = {
    semester: {
      year: normalizedYear,
      period: normalizedPeriod
    },
    updatedAt: new Date().toISOString(),
    departments,
    disciplinesByDepartment,
    refresh: {
      durationMs: Date.now() - startedAt,
      failures,
      source: 'sigaa'
    }
  };

  saveSnapshot(snapshot);
  return snapshot;
}

function querySnapshot(snapshot, { department, query = '' }) {
  const disciplines = snapshot?.disciplinesByDepartment?.[String(department)] || [];
  return filterDisciplinesByQuery(disciplines, query);
}

function shouldRefreshSnapshot(snapshot) {
  if (!snapshot?.updatedAt) {
    return true;
  }

  const updatedAt = new Date(snapshot.updatedAt);
  if (Number.isNaN(updatedAt.getTime())) {
    return true;
  }

  return Date.now() - updatedAt.getTime() >= REFRESH_INTERVAL_MS;
}

module.exports = {
  REFRESH_INTERVAL_MS,
  getDefaultSemester,
  getSemesterKey,
  getSnapshotPath,
  getSnapshotStats,
  loadSnapshot,
  querySnapshot,
  refreshSnapshot,
  shouldRefreshSnapshot
};
