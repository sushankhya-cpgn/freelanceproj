const { Client } = require('@opensearch-project/opensearch');

const OPENSEARCH_NODE = process.env.OPENSEARCH_NODE || 'http://localhost:9200';
const OPENSEARCH_USERNAME = process.env.OPENSEARCH_USERNAME || undefined;
const OPENSEARCH_PASSWORD = process.env.OPENSEARCH_PASSWORD || undefined;

const INDEX = process.env.OPENSEARCH_FREELANCERS_INDEX || 'freelancers';

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
        settings: { number_of_shards: 1, number_of_replicas: 0 },
        mappings: {
          properties: {
            id: { type: 'keyword' },
            userId: { type: 'keyword' },
            name: { type: 'text' },
            shortBio: { type: 'text' },
            expertise: { type: 'text' },
            skills: { type: 'keyword' },
            category: { type: 'keyword' },
            country: { type: 'keyword' },
            city: { type: 'keyword' },
            visibility: { type: 'keyword' },
            userType: { type: 'keyword' },
            yearsOfExperience: { type: 'keyword' },
            createdAt: { type: 'date' },
          },
        },
      },
    });
  }
}

function toDoc(f) {
  const user = f.freelancerUser || f.user || {};
  return {
    id: String(f.id),
    userId: f.userId != null ? String(f.userId) : undefined,
    name: [user.firstName, user.lastName].filter(Boolean).join(' ').trim() || undefined,
    shortBio: f.shortBio || '',
    expertise: f.expertise || '',
    skills: Array.isArray(f.skills) ? f.skills : (Array.isArray(f.category) ? f.category : []),
    category: Array.isArray(f.category) ? f.category : [],
    country: f.country || '',
    city: f.city || '',
    visibility: f.visibility || 'public',
    userType: f.userType || '',
    yearsOfExperience: f.yearsOfExperience || '',
    createdAt: f.createdAt || new Date().toISOString(),
  };
}

async function indexFreelancer(freelancer) {
  await ensureIndex();
  const c = getClient();
  await c.index({ index: INDEX, id: String(freelancer.id), body: toDoc(freelancer), refresh: true });
}

async function updateFreelancer(freelancer) {
  await ensureIndex();
  const c = getClient();
  await c.update({ index: INDEX, id: String(freelancer.id), body: { doc: toDoc(freelancer) }, refresh: true });
}

async function deleteFreelancer(id) {
  await ensureIndex();
  const c = getClient();
  await c.delete({ index: INDEX, id: String(id), refresh: true }).catch(() => {});
}

async function searchFreelancers({ q, skills = [], location, page = 1, limit = 10 }) {
  await ensureIndex();
  const c = getClient();

  const must = [];
  const filter = [ { term: { visibility: 'public' } } ];

  if (q) {
    must.push({
      multi_match: {
        query: q,
        fields: ['name^3', 'expertise^2', 'shortBio'],
        type: 'best_fields',
        operator: 'and',
      },
    });
  }

  if (skills.length) filter.push({ terms: { skills } });

  if (location) {
    filter.push({
      bool: { should: [ { term: { country: location } }, { term: { city: location } } ] },
    });
  }

  const from = (Number(page) - 1) * Number(limit);
  const { body } = await c.search({
    index: INDEX,
    body: {
      query: { bool: { must, filter } },
      sort: [ { createdAt: 'desc' } ],
      from,
      size: Number(limit),
      highlight: q ? { fields: { name: {}, expertise: {}, shortBio: {} } } : undefined,
    },
  });

  const hits = body.hits?.hits || [];
  const total = typeof body.hits?.total === 'object' ? body.hits.total.value : (body.hits?.total || 0);

  return {
    results: hits.map(h => ({ id: Number(h._id), _score: h._score, highlight: h.highlight })),
    total,
  };
}

// Lightweight suggestions for typing (by name/expertise)
async function suggestFreelancers({ q, limit = 5 }) {
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
              bool: {
                should: [
                  { match_bool_prefix: { name: { query: term } } },
                  { match_bool_prefix: { expertise: { query: term } } },
                ],
              }
            }
          ],
          filter: [{ term: { visibility: 'public' } }],
        },
      },
      _source: ['name', 'expertise'],
      size: Number(limit),
    },
  });

  const hits = body.hits?.hits || [];
  return hits.map(h => ({ id: Number(h._id), name: h._source?.name, expertise: h._source?.expertise })).filter(x => x.name || x.expertise);
}

module.exports = { indexFreelancer, updateFreelancer, deleteFreelancer, searchFreelancers, suggestFreelancers };
