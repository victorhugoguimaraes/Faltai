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

function ensureSnapshotDir() {
  if (!fs.existsSync(SNAPSHOT_DIR)) {
    fs.mkdirSync(SNAPSHOT_DIR, { recursive: true });
  }
}

function getDefaultSemester() {
  const now = new Date();
  return {
    year: String(process.env.UNB_SNAPSHOT_YEAR || now.getFullYear()),
    period: String(process.env.UNB_SNAPSHOT_PERIOD || '1')
  };
}

function getSemesterKey(year, period) {
  return `${year}-${period}`;
}

function getSnapshotPath(year, period) {
  ensureSnapshotDir();
  return path.join(SNAPSHOT_DIR, `snapshot-${year}-${period}.json`);
}

function compareDisciplines(left, right) {
  return `${left.code || ''} ${left.name || ''}`.localeCompare(`${right.code || ''} ${right.name || ''}`);
}

function compareClasses(left, right) {
  return String(left.classCode || '').localeCompare(String(right.classCode || ''));
}

function summarizeDiscipline(discipline) {
  return {
    code: discipline.code,
    name: discipline.name,
    classCount: discipline.classes?.length || 0
  };
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
  const sortedClasses = [...(discipline.classes || [])].sort(compareClasses);
  const preparedDiscipline = {
    ...discipline,
    classes: sortedClasses,
    _disciplineSearch: normalizeForSearch(`${discipline.code} ${discipline.name}`),
    _sortKey: `${discipline.code || ''} ${discipline.name || ''}`
  };

  preparedDiscipline.classes = sortedClasses.map((turma) => prepareClass(preparedDiscipline, turma));
  return preparedDiscipline;
}

function buildStats(departments, disciplinesByDepartment) {
  let activeDepartments = 0;
  let totalDisciplines = 0;
  let totalClasses = 0;

  for (const departmentId of Object.keys(disciplinesByDepartment)) {
    const disciplines = disciplinesByDepartment[departmentId];

    if (disciplines.length > 0) {
      activeDepartments += 1;
    }

    totalDisciplines += disciplines.length;

    for (const discipline of disciplines) {
      totalClasses += discipline.classes?.length || 0;
    }
  }

  return {
    totalDepartments: departments.length,
    activeDepartments,
    totalDisciplines,
    totalClasses
  };
}

function buildQueryIndexes(disciplinesByDepartment) {
  const summariesByDepartment = {};
  const codeIndexByDepartment = {};

  for (const [departmentId, disciplines] of Object.entries(disciplinesByDepartment)) {
    summariesByDepartment[departmentId] = disciplines.map(summarizeDiscipline);
    codeIndexByDepartment[departmentId] = Object.fromEntries(
      disciplines.map((discipline) => [String(discipline.code), discipline])
    );
  }

  return {
    summariesByDepartment,
    codeIndexByDepartment
  };
}

function prepareSnapshot(snapshot) {
  const disciplinesByDepartment = {};

  for (const [departmentId, disciplines] of Object.entries(snapshot.disciplinesByDepartment || {})) {
    disciplinesByDepartment[departmentId] = [...disciplines].sort(compareDisciplines).map(prepareDiscipline);
  }

  const stats = snapshot.stats || buildStats(snapshot.departments || [], disciplinesByDepartment);
  const indexes = buildQueryIndexes(disciplinesByDepartment);

  return {
    ...snapshot,
    disciplinesByDepartment,
    stats,
    ...indexes
  };
}

function stripPreparedFields(snapshot) {
  const cleanDepartments = {};

  for (const [departmentId, disciplines] of Object.entries(snapshot.disciplinesByDepartment || {})) {
    cleanDepartments[departmentId] = disciplines.map(({ _disciplineSearch, _sortKey, classes = [], ...discipline }) => ({
      ...discipline,
      classes: classes.map(({ _classSearch, _classroomSearch, _teacherSearch, ...turma }) => turma)
    }));
  }

  return {
    semester: snapshot.semester,
    updatedAt: snapshot.updatedAt,
    departments: snapshot.departments,
    disciplinesByDepartment: cleanDepartments,
    refresh: snapshot.refresh,
    stats: snapshot.stats
  };
}

async function loadSnapshot(year, period) {
  const snapshotPath = getSnapshotPath(year, period);

  try {
    const raw = await fsAsync.readFile(snapshotPath, 'utf8');
    return prepareSnapshot(JSON.parse(raw));
  } catch (error) {
    if (error.code === 'ENOENT') {
      return null;
    }

    throw error;
  }
}

async function saveSnapshot(snapshot) {
  const snapshotPath = getSnapshotPath(snapshot.semester.year, snapshot.semester.period);
  await fsAsync.writeFile(snapshotPath, JSON.stringify(stripPreparedFields(snapshot), null, 2), 'utf8');
  return snapshotPath;
}

function getSnapshotStats(snapshot) {
  return snapshot.stats;
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
          return {
            ok: true,
            departmentId: department.id,
            disciplines: await searchTurmas({
              department: department.id,
              year: normalizedYear,
              period: normalizedPeriod
            })
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

    for (const result of batchResults) {
      disciplinesByDepartment[result.departmentId] = result.ok ? result.disciplines : [];

      if (!result.ok) {
        failures.push({
          departmentId: result.departmentId,
          error: result.error
        });
      }
    }
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
  const departmentId = String(department);
  const disciplines = snapshot?.disciplinesByDepartment?.[departmentId] || [];

  if (!query.trim()) {
    return disciplines;
  }

  return filterDisciplinesByQuery(disciplines, query);
}

function querySnapshotSummaries(snapshot, { department, query = '' }) {
  const departmentId = String(department);

  if (!query.trim()) {
    return snapshot?.summariesByDepartment?.[departmentId] || [];
  }

  return querySnapshot(snapshot, { department, query }).map(summarizeDiscipline);
}

function querySnapshotDisciplineByCode(snapshot, { department, code }) {
  return snapshot?.codeIndexByDepartment?.[String(department)]?.[String(code)] || null;
}

module.exports = {
  getDefaultSemester,
  getSemesterKey,
  getSnapshotPath,
  getSnapshotStats,
  loadSnapshot,
  querySnapshot,
  querySnapshotDisciplineByCode,
  querySnapshotSummaries,
  refreshSnapshot
};
