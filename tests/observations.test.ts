// Mock external services before any app module is imported.
// Jest hoists jest.mock() calls to the top of the compiled output.

jest.mock('../src/utils/cloudinary', () => ({
  uploadBuffer: jest.fn().mockResolvedValue('https://mock.cloudinary.com/test.jpg'),
}));

jest.mock('../src/modules/ai/ai.service', () => ({
  predictSpecies: jest.fn().mockResolvedValue(null),
}));

jest.mock('../src/modules/geospatial/gbif.validator', () => ({
  validateGeographicSanity: jest.fn().mockResolvedValue({
    valid: true,
    speciesName: 'test-species',
    lat: 51.5,
    lng: -0.1,
    nearbyCount: 5,
    globalCount: 100,
  }),
}));

import request from 'supertest';
import app from '../src/app';
import { prisma, cleanDatabase } from './helpers/db';

// Shared auth state — rebuilt in beforeEach so every test starts clean.
let authToken: string;

afterAll(async () => {
  await cleanDatabase();
  await prisma.$disconnect();
});

beforeEach(async () => {
  await cleanDatabase();

  const res = await request(app)
    .post('/api/auth/register')
    .send({ email: 'observer@example.com', password: 'secret123', name: 'Observer' });

  authToken = res.body.token;
});

// ── Observations — public reads ───────────────────────────────────────────────

describe('GET /api/observations', () => {
  it('returns an empty array when no observations exist', async () => {
    const res = await request(app).get('/api/observations');

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body).toHaveLength(0);
  });

  it('returns the created observation after it is added', async () => {
    await request(app)
      .post('/api/observations')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ latitude: 51.5, longitude: -0.1, description: 'A fox near the river' });

    const res = await request(app).get('/api/observations');

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].description).toBe('A fox near the river');
  });
});

describe('GET /api/observations/taxa', () => {
  it('returns an empty array when the taxonomy table is empty', async () => {
    const res = await request(app).get('/api/observations/taxa');

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});

describe('GET /api/observations/:id', () => {
  it('returns 404 for a non-existent observation', async () => {
    const res = await request(app).get('/api/observations/99999');

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error');
  });

  it('returns the observation when it exists', async () => {
    const createRes = await request(app)
      .post('/api/observations')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ latitude: 48.8, longitude: 2.3, description: 'Pigeon on Notre-Dame' });

    const obsId = createRes.body.id;

    const res = await request(app).get(`/api/observations/${obsId}`);

    expect(res.status).toBe(200);
    expect(res.body.id).toBe(obsId);
    expect(res.body.description).toBe('Pigeon on Notre-Dame');
  });
});

// ── Observations — create ─────────────────────────────────────────────────────

describe('POST /api/observations', () => {
  it('returns 401 when no token is provided', async () => {
    const res = await request(app)
      .post('/api/observations')
      .send({ latitude: 51.5, longitude: -0.1 });

    expect(res.status).toBe(401);
    expect(res.body.message).toBe('No token provided');
  });

  it('returns 401 for an invalid token', async () => {
    const res = await request(app)
      .post('/api/observations')
      .set('Authorization', 'Bearer bad.token.value')
      .send({ latitude: 51.5, longitude: -0.1 });

    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Invalid token');
  });

  it('creates an observation and returns 201 with the new record', async () => {
    const res = await request(app)
      .post('/api/observations')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        latitude: 51.5074,
        longitude: -0.1278,
        description: 'Red kite soaring above the park',
      });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body.latitude).toBe(51.5074);
    expect(res.body.longitude).toBe(-0.1278);
    expect(res.body.description).toBe('Red kite soaring above the park');
    expect(res.body.status).toBe('CASUAL'); // no media → CASUAL grade
    expect(res.body.aiPrediction).toBeNull();
  });
});

// ── Identifications ───────────────────────────────────────────────────────────

describe('POST /api/observations/:id/identifications', () => {
  let obsId: number;

  beforeEach(async () => {
    const createRes = await request(app)
      .post('/api/observations')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ latitude: 51.5, longitude: -0.1 });

    obsId = createRes.body.id;
  });

  it('returns 401 when no token is provided', async () => {
    const res = await request(app)
      .post(`/api/observations/${obsId}/identifications`)
      .send({ taxonName: 'Vulpes vulpes' });

    expect(res.status).toBe(401);
    expect(res.body.message).toBe('No token provided');
  });

  it('returns 400 when neither taxonId nor taxonName is supplied', async () => {
    const res = await request(app)
      .post(`/api/observations/${obsId}/identifications`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ body: 'Looks like a red fox' });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Taxon is required');
  });

  it('creates an identification and returns 201', async () => {
    const res = await request(app)
      .post(`/api/observations/${obsId}/identifications`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ taxonName: 'Vulpes vulpes', body: 'Classic red fox features' });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.identification).toHaveProperty('id');
    expect(res.body.identification.taxon.name).toBe('Vulpes vulpes');
  });
});

// ── Comments ──────────────────────────────────────────────────────────────────

describe('POST /api/observations/:id/comments', () => {
  let obsId: number;

  beforeEach(async () => {
    const createRes = await request(app)
      .post('/api/observations')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ latitude: 51.5, longitude: -0.1 });

    obsId = createRes.body.id;
  });

  it('returns 401 when no token is provided', async () => {
    const res = await request(app)
      .post(`/api/observations/${obsId}/comments`)
      .send({ body: 'Great sighting!' });

    expect(res.status).toBe(401);
    expect(res.body.message).toBe('No token provided');
  });

  it('returns 400 when comment body is missing', async () => {
    const res = await request(app)
      .post(`/api/observations/${obsId}/comments`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Comment body is required');
  });

  it('creates a comment and returns 201 with the comment record', async () => {
    const res = await request(app)
      .post(`/api/observations/${obsId}/comments`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ body: 'Excellent documentation of this species!' });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body.body).toBe('Excellent documentation of this species!');
    expect(res.body.user).toHaveProperty('id');
  });
});
