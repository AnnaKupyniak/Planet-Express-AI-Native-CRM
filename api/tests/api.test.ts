import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../src/app';

describe('Planet Express CRM API Tests', () => {
  let token: string;
  let client_id: number;
  let planet_id: number = 1; // Earth (created by seed)

  beforeAll(async () => {
    // Авторизуємось для отримання токена (користувач створений у seed.ts)
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'professor@planetexpress.com',
        password: 'farnsworth123',
      });
    expect(res.status).toBe(200);
    token = res.body.access_token;
  });

  describe('JWT Authentication Middleware', () => {
    it('should return 401 when no token is provided', async () => {
      const res = await request(app).get('/api/planets');
      expect(res.status).toBe(401);
      expect(res.body.error).toBe('unauthorized');
    });

    it('should return 401 when invalid token is provided', async () => {
      const res = await request(app)
        .get('/api/planets')
        .set('Authorization', 'Bearer invalidtoken123');
      expect(res.status).toBe(401);
      expect(res.body.error).toBe('unauthorized');
    });
  });

  describe('REST Client Endpoints', () => {
    it('should successfully create a new client with token', async () => {
      const res = await request(app)
        .post('/api/clients')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Slurm Queen Corp',
          is_evil: false,
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body.name).toBe('Slurm Queen Corp');
      client_id = res.body.id;
    });

    it('should return 400 validation error when name is missing', async () => {
      const res = await request(app)
        .post('/api/clients')
        .set('Authorization', `Bearer ${token}`)
        .send({
          is_evil: true,
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('validation_error');
    });

    it('should filter clients by search query', async () => {
      const res = await request(app)
        .get('/api/clients')
        .set('Authorization', `Bearer ${token}`)
        .query({ search: 'Slurm' });

      expect(res.status).toBe(200);
      expect(res.body.length).toBeGreaterThan(0);
      expect(res.body[0].name).toContain('Slurm');
    });
  });

  describe('REST Delivery Endpoints', () => {
    it('should successfully create a new delivery with valid ids', async () => {
      const res = await request(app)
        .post('/api/deliveries')
        .set('Authorization', `Bearer ${token}`)
        .send({
          cargo_name: 'Fanta-like Slurm cans',
          reward_cash: 2500,
          planet_id,
          client_id,
        });

      expect(res.status).toBe(201);
      expect(res.body.cargo_name).toBe('Fanta-like Slurm cans');
      expect(res.body.reward_cash).toBe(2500);
    });

    it('should return 404 when planet_id does not exist', async () => {
      const res = await request(app)
        .post('/api/deliveries')
        .set('Authorization', `Bearer ${token}`)
        .send({
          cargo_name: 'Dark Matter',
          reward_cash: 9999,
          planet_id: 999,
          client_id,
        });

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('not_found');
    });
  });

  describe('GraphQL API', () => {
    it('should resolve a graphql query for planets', async () => {
      const query = `
        query {
          planets(search: "Earth") {
            id
            name
            danger_level
          }
        }
      `;

      const res = await request(app)
        .post('/api/graphql')
        .set('Authorization', `Bearer ${token}`)
        .send({ query });

      expect(res.status).toBe(200);
      expect(res.body.data.planets[0].name).toBe('Earth');
    });

    it('should successfully run a mutation to create a client', async () => {
      const query = `
        mutation {
          createClient(name: "Lrrr", is_evil: true) {
            id
            name
            is_evil
          }
        }
      `;

      const res = await request(app)
        .post('/api/graphql')
        .set('Authorization', `Bearer ${token}`)
        .send({ query });

      expect(res.status).toBe(200);
      expect(res.body.data.createClient.name).toBe('Lrrr');
      expect(res.body.data.createClient.is_evil).toBe(true);
    });
  });
});
