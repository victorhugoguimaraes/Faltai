const cheerio = require('cheerio');
const { decodeSigaaSchedule } = require('./horarios');

const SIGAA_PUBLIC_URL = 'https://sigaa.unb.br/sigaa/public/';
const SIGAA_SEARCH_URL = 'https://sigaa.unb.br/sigaa/public/turmas/listar.jsf';
const SIGAA_SEARCH_PAGE_URL = `${SIGAA_SEARCH_URL}?aba=p-ensino`;

const headers = {
  'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
  Referer: SIGAA_SEARCH_PAGE_URL
};

function normalizeText(value = '') {
  return value.replace(/\s+/g, ' ').trim();
}

function normalizeForSearch(value = '') {
  return normalizeText(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function getSearchTokens(query = '') {
  return normalizeForSearch(query)
    .split(/\s+/)
    .map((token) => token.trim())
    .filter(Boolean);
}

function extractViewState(html) {
  const $ = cheerio.load(html);
  return $('input[name="javax.faces.ViewState"]').val() || 'j_id1';
}

function extractSearchButtonName(html) {
  const $ = cheerio.load(html);
  return $('input[value="Buscar"]').attr('name') || 'formTurma:j_id_jsp_1370969402_11';
}

function extractSetCookies(response) {
  if (typeof response.headers.getSetCookie === 'function') {
    return response.headers.getSetCookie();
  }

  const header = response.headers.get('set-cookie');
  return header ? [header] : [];
}

function updateCookieJar(cookieJar, response) {
  extractSetCookies(response).forEach((cookie) => {
    const [cookiePart] = cookie.split(';');
    const separatorIndex = cookiePart.indexOf('=');

    if (separatorIndex <= 0) {
      return;
    }

    const name = cookiePart.slice(0, separatorIndex).trim();
    const value = cookiePart.slice(separatorIndex + 1).trim();

    if (name && value) {
      cookieJar.set(name, value);
    }
  });
}

function serializeCookieJar(cookieJar) {
  return Array.from(cookieJar.entries())
    .map(([name, value]) => `${name}=${value}`)
    .join('; ');
}

async function requestWithCookies(url, cookieJar, options = {}) {
  const nextHeaders = {
    ...headers,
    ...(options.headers || {})
  };

  const cookieHeader = serializeCookieJar(cookieJar);
  if (cookieHeader) {
    nextHeaders.Cookie = cookieHeader;
  }

  const response = await fetch(url, {
    ...options,
    headers: nextHeaders
  });
  updateCookieJar(cookieJar, response);

  return response;
}

async function getInitialForm() {
  const cookieJar = new Map();

  await requestWithCookies(SIGAA_PUBLIC_URL, cookieJar);
  const response = await requestWithCookies(SIGAA_SEARCH_PAGE_URL, cookieJar);
  const html = await response.text();

  return {
    html,
    cookieJar
  };
}

function parseDepartments(html) {
  const $ = cheerio.load(html);

  return $('#formTurma\\:inputDepto option')
    .toArray()
    .map((option) => {
      const value = $(option).attr('value');
      return {
        id: value,
        name: normalizeText($(option).text())
      };
    })
    .filter((department) => department.id && department.id !== '0');
}

function extractWorkloadHours(text = '') {
  const matches = Array.from(text.matchAll(/\((\d+)h\)/gi));

  if (matches.length === 0) {
    return null;
  }

  const totalHours = matches.reduce((sum, match) => sum + Number(match[1] || 0), 0);
  return totalHours > 0 ? totalHours : null;
}

function parseDateRange(scheduleCellText = '') {
  const match = scheduleCellText.match(/\((\d{2}\/\d{2}\/\d{4})\s*-\s*(\d{2}\/\d{2}\/\d{4})\)/);

  if (!match) {
    return { startDate: '', endDate: '' };
  }

  const toIso = (value) => {
    const [day, month, year] = value.split('/');
    return `${year}-${month}-${day}`;
  };

  return {
    startDate: toIso(match[1]),
    endDate: toIso(match[2])
  };
}

function parseClassRows(html) {
  const $ = cheerio.load(html);
  const table = $('table.listagem').first();

  if (!table.length) {
    return [];
  }

  const classes = [];
  let currentDiscipline = null;

  table.find('tr').each((_, row) => {
    const $row = $(row);

    if ($row.hasClass('agrupador')) {
      const title = normalizeText($row.find('.tituloDisciplina').text());

      if (!title.includes(' - ')) {
        currentDiscipline = null;
        return;
      }

      const [code, ...nameParts] = title.split(' - ');
      currentDiscipline = {
        code: normalizeText(code),
        name: normalizeText(nameParts.join(' - ')),
        classes: []
      };
      classes.push(currentDiscipline);
      return;
    }

    if (!currentDiscipline || (!$row.hasClass('linhaPar') && !$row.hasClass('linhaImpar'))) {
      return;
    }

    const cells = $row.find('td');
    const teacherText = normalizeText($(cells[2]).text());
    const scheduleText = normalizeText($(cells[3]).text());
    const rawScheduleCode = normalizeText(scheduleText.split('(')[0]);
    const decodedSchedule = decodeSigaaSchedule(rawScheduleCode);
    const { startDate, endDate } = parseDateRange(scheduleText);

    currentDiscipline.classes.push({
      classCode: normalizeText($(cells[0]).text()),
      yearPeriod: normalizeText($(cells[1]).text()),
      teachers: teacherText
        .split(')')
        .map((chunk) => normalizeText(chunk.replace('(', '')))
        .filter(Boolean)
        .map((chunk) => chunk.replace(/\s+\d+h$/i, '').trim()),
      teacherWorkloadLabel: teacherText,
      workloadHours: extractWorkloadHours(teacherText),
      scheduleCode: rawScheduleCode,
      scheduleText: decodedSchedule.translated,
      scheduleMeetings: decodedSchedule.meetings,
      absenceWeight: decodedSchedule.absenceWeight,
      startDate,
      endDate,
      vacanciesOffered: normalizeText($(cells[5]).text()),
      vacanciesOccupied: normalizeText($(cells[6]).text()),
      classroom: normalizeText($(cells[7]).text())
    });
  });

  return classes;
}

function rankDisciplineMatch(discipline, tokens) {
  const disciplineHaystack =
    discipline._disciplineSearch || normalizeForSearch(`${discipline.code} ${discipline.name}`);

  if (!tokens.every((token) => disciplineHaystack.includes(token))) {
    return null;
  }

  return tokens.reduce((score, token) => {
    if (discipline.code === token) {
      return score + 200;
    }

    if (discipline.code.startsWith(token)) {
      return score + 130;
    }

    if (discipline.name.startsWith(token)) {
      return score + 110;
    }

    if (disciplineHaystack.includes(token)) {
      return score + 80;
    }

    return score;
  }, 0);
}

function rankClassMatch(discipline, turma, tokens) {
  const classHaystack =
    turma._classSearch ||
    normalizeForSearch(
      [
        discipline.code,
        discipline.name,
        turma.classCode,
        turma.teachers.join(' '),
        turma.classroom,
        turma.scheduleCode,
        turma.scheduleText.join(' ')
      ].join(' ')
    );

  if (!tokens.every((token) => classHaystack.includes(token))) {
    return null;
  }

  return tokens.reduce((score, token) => {
    if (turma.classCode === token) {
      return score + 120;
    }

    if (turma.classCode.startsWith(token)) {
      return score + 90;
    }

    if ((turma._teacherSearch || normalizeForSearch(turma.teachers.join(' '))).includes(token)) {
      return score + 35;
    }

    if ((turma._classroomSearch || normalizeForSearch(turma.classroom)).includes(token)) {
      return score + 25;
    }

    return score + 20;
  }, 0);
}

function filterDisciplinesByQuery(disciplines, query = '') {
  const tokens = getSearchTokens(query);

  if (tokens.length === 0) {
    return disciplines;
  }

  return disciplines
    .map((discipline) => {
      const disciplineScore = rankDisciplineMatch(discipline, tokens);
      const matchingClasses = discipline.classes
        .map((turma) => ({
          turma,
          score: rankClassMatch(discipline, turma, tokens)
        }))
        .filter((item) => item.score !== null)
        .sort((left, right) => right.score - left.score || left.turma.classCode.localeCompare(right.turma.classCode));

      if (disciplineScore === null && matchingClasses.length === 0) {
        return null;
      }

      return {
        ...discipline,
        classes: disciplineScore !== null ? discipline.classes : matchingClasses.map((item) => item.turma),
        relevanceScore: Math.max(disciplineScore || 0, matchingClasses[0]?.score || 0)
      };
    })
    .filter(Boolean)
    .sort((left, right) => {
      if (right.relevanceScore !== left.relevanceScore) {
        return right.relevanceScore - left.relevanceScore;
      }

      return `${left.code} ${left.name}`.localeCompare(`${right.code} ${right.name}`);
    })
    .map(({ relevanceScore, ...discipline }) => discipline);
}

async function searchTurmas({ department, year, period }) {
  const { html, cookieJar } = await getInitialForm();
  const viewState = extractViewState(html);
  const submitName = extractSearchButtonName(html);

  const formData = new URLSearchParams();
  formData.set('formTurma', 'formTurma');
  formData.set('formTurma:inputNivel', 'G');
  formData.set('formTurma:inputDepto', department);
  formData.set('formTurma:inputAno', String(year));
  formData.set('formTurma:inputPeriodo', String(period));
  formData.set(submitName, 'Buscar');
  formData.set('javax.faces.ViewState', viewState);

  const response = await requestWithCookies(SIGAA_SEARCH_URL, cookieJar, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Referer: SIGAA_SEARCH_PAGE_URL,
      Origin: 'https://sigaa.unb.br'
    },
    body: formData.toString(),
    redirect: 'follow'
  });

  const resultHtml = await response.text();
  return parseClassRows(resultHtml);
}

module.exports = {
  filterDisciplinesByQuery,
  getInitialForm,
  normalizeForSearch,
  parseClassRows,
  parseDepartments,
  searchTurmas
};
