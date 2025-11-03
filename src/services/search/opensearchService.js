const { Client } = require('@opensearch-project/opensearch');

const OPENSEARCH_NODE = process.env.OPENSEARCH_NODE || 'http://localhost:9200';
const OPENSEARCH_USERNAME = process.env.OPENSEARCH_USERNAME || undefined;
const OPENSEARCH_PASSWORD = process.env.OPENSEARCH_PASSWORD || undefined;

const INDEX = process.env.OPENSEARCH_JOBS_INDEX || 'jobs';

let client;
function getClient() {
  if (client) return client;
  const auth = OPENSEARCH_USERNAME && OPENSEARCH_PASSWORD
    ? { username: OPENSEARCH_USERNAME, password: OPENSEARCH_PASSWORD }
    : undefined;
  client = new Client({ node: OPENSEARCH_NODE, auth });
  return client;
}

async function ensureIndex() {
  const c = getClient();
  const exists = await c.indices.exists({ index: INDEX });
  if (!exists.body) {
    await c.indices.create({
      index: INDEX,
      body: {
        settings: {
          number_of_shards: 1,
          number_of_replicas: 0,
        },
        mappings: {
          properties: {
            id: { type: 'keyword' },
            title: { type: 'text' },
            description: { type: 'text' },
            budget: { type: 'double' },
            budgetType: { type: 'keyword' },
            minBudget: { type: 'double' },
            maxBudget: { type: 'double' },
            skills: { type: 'keyword' },
            experienceLevel: { type: 'keyword' },
            projectDuration: { type: 'keyword' },
            timezone: { type: 'keyword' },
            status: { type: 'keyword' },
            isFeatured: { type: 'boolean' },
            isUrgent: { type: 'boolean' },
            clientId: { type: 'keyword' },
            createdAt: { type: 'date' },
          },
        },
      },
    });
  }
}

function toDoc(job) {
  return {
    id: String(job.id),
    title: job.title,
    description: job.description,
    budget: job.budget ?? null,
    budgetType: job.budgetType,
    minBudget: job.minBudget ?? null,
    maxBudget: job.maxBudget ?? null,
    skills: Array.isArray(job.skills) ? job.skills : [],
    experienceLevel: job.experienceLevel,
    projectDuration: job.projectDuration,
    timezone: job.timezone,
    status: job.status,
    isFeatured: !!job.isFeatured,
    isUrgent: !!job.isUrgent,
    clientId: String(job.clientId),
    createdAt: job.createdAt || new Date().toISOString(),
  };
}

async function indexJob(job) {
  await ensureIndex();
  const c = getClient();
  await c.index({ index: INDEX, id: String(job.id), body: toDoc(job), refresh: true });
}

async function updateJob(job) {
  await ensureIndex();
  const c = getClient();
  await c.update({
    index: INDEX,
    id: String(job.id),
    body: { doc: toDoc(job) },
    refresh: true,
  });
}

async function deleteJob(id) {
  await ensureIndex();
  const c = getClient();
  await c.delete({ index: INDEX, id: String(id), refresh: true }).catch(() => {});
}

async function searchJobs({
  q,
  skills = [],
  budgetMin,
  budgetMax,
  jobType,
  experienceLevel,
  page = 1,
  limit = 10,
}) {
  await ensureIndex();
  const c = getClient();

  const must = [];
  const filter = [
    { term: { status: 'active' } },
  ];

  if (q) {
    must.push({
      multi_match: {
        query: q,
        fields: ['title^3', 'description'],
        type: 'best_fields',
        operator: 'and',
      },
    });
  }

  if (skills.length) {
    filter.push({ terms: { skills: skills } });
  }
  if (budgetMin != null || budgetMax != null) {
    const range = {};
    if (budgetMin != null) range.gte = budgetMin;
    if (budgetMax != null) range.lte = budgetMax;
    filter.push({ range: { budget: range } });
  }
  if (jobType) filter.push({ term: { budgetType: jobType } });
  if (experienceLevel) filter.push({ term: { experienceLevel } });

  const from = (Number(page) - 1) * Number(limit);

  const { body } = await c.search({
    index: INDEX,
    body: {
      query: {
        bool: { must, filter },
      },
      sort: [
        { isFeatured: 'desc' },
        { createdAt: 'desc' },
      ],
      from,
      size: Number(limit),
      highlight: q ? {
        fields: { title: {}, description: {} },
      } : undefined,
    },
  });

  const hits = body.hits?.hits || [];
  const total = typeof body.hits?.total === 'object' ? body.hits.total.value : (body.hits?.total || 0);

  return {
    results: hits.map(h => ({ id: h._id, ...h._source, _score: h._score, highlight: h.highlight })),
    total,
  };
}

// Lightweight title suggestions for prefix typing
async function suggestJobTitles({ q, limit = 5 }) {
  await ensureIndex();
  const c = getClient();
  const term = (q || '').trim();
  if (!term) return [];

  const { body } = await c.search({
    index: INDEX,
    body: {
      query: {
        bool: {
          must: [
            {
              match_bool_prefix: { title: { query: term } },
            },
          ],
          filter: [{ term: { status: 'active' } }],
        },
      },
      _source: ['title'],
      size: Number(limit),
    },
  });

  const hits = body.hits?.hits || [];
  // Return id and title only
  return hits.map((h) => ({ id: h._id, title: h._source?.title })).filter((x) => !!x.title);
}

module.exports = {
  indexJob,
  updateJob,
  deleteJob,
  searchJobs,
  suggestJobTitles,
};
