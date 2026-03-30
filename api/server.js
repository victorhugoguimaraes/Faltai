const express = require('express');
const cors = require('cors');
const { getInitialForm, parseDepartments, searchTurmas } = require('./unb/sigaa');

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
  searches: new Map()
};

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error('Origin não permitida pelo CORS.'));
    }
  })
);
app.use(express.json());

app.get('/', (_req, res) => {
  res.json({
    name: 'Faltai UnB API',
    ok: true,
    endpoints: ['/api/health', '/api/unb/departamentos', '/api/unb/turmas']
  });
});

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

app.get('/api/unb/departamentos', async (_req, res) => {
  try {
    const now = Date.now();

    if (cache.departments && now - cache.departmentsAt < 1000 * 60 * 60 * 6) {
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
      message: 'Não foi possível carregar os departamentos da UnB.',
      detail: error.message
    });
  }
});

app.get('/api/unb/turmas', async (req, res) => {
  try {
    const department = String(req.query.department || '');
    const year = String(req.query.year || new Date().getFullYear());
    const period = String(req.query.period || '1');
    const query = String(req.query.query || '');

    if (!department) {
      res.status(400).json({ message: 'O parâmetro "department" é obrigatório.' });
      return;
    }

    const cacheKey = `${department}:${year}:${period}:${query}`;
    const cached = cache.searches.get(cacheKey);

    if (cached && Date.now() - cached.at < 1000 * 60 * 30) {
      res.json({ disciplines: cached.data, cached: true });
      return;
    }

    const disciplines = await searchTurmas({ department, year, period, query });
    cache.searches.set(cacheKey, { data: disciplines, at: Date.now() });

    res.json({ disciplines, cached: false });
  } catch (error) {
    res.status(500).json({
      message: 'Não foi possível consultar as turmas da UnB.',
      detail: error.message
    });
  }
});

app.listen(port, host, () => {
  console.log(`UnB API disponível em http://${host}:${port}`);
});

module.exports = app;
