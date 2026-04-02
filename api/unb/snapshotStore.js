const fs = require('fs');
const { promises: fsAsync } = fs;
const path = require('path');
const {
  filterDisciplinesByQuery,
  getInitialForm,
  normalizeForSearch,
  parseDepartments,
  searchTurmas
} = require('./sigaa');

const SNAPSHOT_DIR = path.join(__dirname, '..', 'data', 'snapshots');
const REFRESH_INTERVAL_MS = 7 * 24 * 60 * 60 * 1000;

function ensureSnapshotDir() {
  fs.mkdirSync(SNAPSHOT_DIR, { recursive: true });
}

function buildDepartmentStats(disciplinesByDepartment = {}, totalDepartments = 0) {
  const values = Object.values(disciplinesByDepartment);
  const activeDepartments = values.filter((disciplines) => disciplines.length > 0).length;
  const totalDisciplines = values.reduce((sum, disciplines) => sum + disciplines.length, 0);
  const totalClasses = values.reduce(
    (sum, disciplines) =>
      sum +
      disciplines.reduce((innerSum, discipline) => innerSum + (discipline.classes?.length || 0), 0),
    0
  );

  return {
    totalDepartments,
    activeDepartments,
    totalDisciplines,
    totalClasses
  };
}

function compareClasses(left, right) {
  return String(left.classCode || '').localeCompare(String(right.classCode || ''));
}

function compareDisciplines(left, right) {
  return `${left.code || ''} ${left.name || ''}`.localeCompare(`${right.code || ''} ${right.name || ''}`);
}

function prepareClass(discipline, turma) {
  const teacherText = turma.teachers.join(' ');
  const classroomText = turma.classroom || '';

  return {
    ...turma,
    _teacherSearch: normalizeForSearch(teacherText),
    _classroomSearch: normalizeForSearch(classroomText),
    _classSearch: normalizeForSearch(
      [
        discipline.code,
        discipline.name,
        turma.classCode,
        teacherText,
        classroomText,
        turma.scheduleCode,
        turma.scheduleText.join(' ')
      ].join(' ')
    )
  };
}

function prepareDiscipline(discipline) {
  const classes = [...(discipline.classes || [])].sort(compareClasses);
  const preparedDiscipline = {
    ...discipline,
    classes,
    _disciplineSearch: normalizeForSearch(`${discipline.code} ${discipline.name}`),
    _sortKey: `${discipline.code || ''} ${discipline.name || ''}`
  };

  preparedDiscipline.classes = classes.map((turma) => prepareClass(preparedDiscipline, turma));
  return preparedDiscipline;
}

function prepareSnapshot(snapshot) {
  const disciplinesByDepartment = Object.fromEntries(
    Object.entries(snapshot.disciplinesByDepartment || {}).map(([departmentId, disciplines]) => [
      departmentId,
      [...disciplines].sort(compareDisciplines).map(prepareDiscipline)
    ])
  );

  return {
    ...snapshot,
    disciplinesByDepartment,
    stats:
      snapshot.stats ||
      buildDepartmentStats(disciplinesByDepartment, snapshot.departments?.length || 0)
  };
}

function stripPreparedFields(snapshot) {
  return {
    ...snapshot,
    disciplinesByDepartment: Object.fromEntries(
      Object.entries(snapshot.disciplinesByDepartment || {}).map(([departmentId, disciplines]) => [
        departmentId,
        disciplines.map(({ _disciplineSearch, _sortKey, classes = [], ...discipline }) => ({
          ...discipline,
          classes: classes.map(
            ({ _classSearch, _classroomSearch, _teacherSearch, ...turma }) => turma
          )
        }))
      ])
    )
  };
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

  return prepareSnapshot(JSON.parse(fs.readFileSync(snapshotPath, 'utf8')));
}

async function saveSnapshot(snapshot) {
  const snapshotPath = getSnapshotPath(snapshot.semester.year, snapshot.semester.period);
  await fsAsync.writeFile(snapshotPath, JSON.stringify(stripPreparedFields(snapshot), null, 2), 'utf8');
  return snapshotPath;
}

function getSnapshotStats(snapshot) {
  if (snapshot.stats) {
    return snapshot.stats;
  }

  return buildDepartmentStats(snapshot.disciplinesByDepartment, snapshot.departments?.length || 0);
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

  const snapshot = prepareSnapshot({
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
  });

  await saveSnapshot(snapshot);
  return snapshot;
}

function querySnapshot(snapshot, { department, query = '' }) {
  const disciplines = snapshot?.disciplinesByDepartment?.[String(department)] || [];
  return filterDisciplinesByQuery(disciplines, query);
}

function summarizeDiscipline(discipline) {
  return {
    code: discipline.code,
    name: discipline.name,
    classCount: discipline.classes?.length || 0
  };
}

function querySnapshotSummaries(snapshot, { department, query = '' }) {
  return querySnapshot(snapshot, { department, query }).map(summarizeDiscipline);
}

function querySnapshotDisciplineByCode(snapshot, { department, code }) {
  const disciplines = snapshot?.disciplinesByDepartment?.[String(department)] || [];
  return disciplines.find((discipline) => discipline.code === String(code)) || null;
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
  querySnapshotDisciplineByCode,
  querySnapshotSummaries,
  querySnapshot,
  refreshSnapshot,
  shouldRefreshSnapshot
};
