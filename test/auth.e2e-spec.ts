import request from 'supertest';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { AppModule } from '../src/app.module';
import { db } from '../src/database/database';

describe('Auth Endpoints (e2e)', () => {
  let app: INestApplication;
  let adminToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
    await app.init();
  });

  beforeEach(() => db.clear());

  afterAll(async () => {
    db.clear();
    await app.close();
  });

  // ─── REGISTER ─────────────────────────────────────────────────────────────
  describe('POST /auth/register', () => {
    it('should register a new user and return a token', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/register')
        .send({ username: 'alice', email: 'alice@test.com', password: 'password123' })
        .expect(201);

      expect(res.body.access_token).toBeDefined();
      expect(res.body.user.username).toBe('alice');
      expect(res.body.user.role).toBe('user');
      expect(res.body.user.password).toBeUndefined();
    });

    it('should register an admin user when role is specified', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/register')
        .send({ username: 'admin', email: 'admin@test.com', password: 'adminpass', role: 'admin' })
        .expect(201);

      expect(res.body.user.role).toBe('admin');
    });

    it('should fail with duplicate username (409)', async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({ username: 'alice', email: 'alice@test.com', password: 'password123' });

      await request(app.getHttpServer())
        .post('/auth/register')
        .send({ username: 'alice', email: 'different@test.com', password: 'password123' })
        .expect(409);
    });

    it('should fail with duplicate email (409)', async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({ username: 'alice', email: 'alice@test.com', password: 'password123' });

      await request(app.getHttpServer())
        .post('/auth/register')
        .send({ username: 'bob', email: 'alice@test.com', password: 'password123' })
        .expect(409);
    });

    it('should fail with missing username (400)', async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({ email: 'alice@test.com', password: 'password123' })
        .expect(400);
    });

    it('should fail with invalid email format (400)', async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({ username: 'alice', email: 'not-an-email', password: 'password123' })
        .expect(400);
    });

    it('should fail with password shorter than 6 chars (400)', async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({ username: 'alice', email: 'alice@test.com', password: '123' })
        .expect(400);
    });

    it('should fail with invalid role (400)', async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({ username: 'alice', email: 'alice@test.com', password: 'password123', role: 'superuser' })
        .expect(400);
    });
  });

  // ─── LOGIN ────────────────────────────────────────────────────────────────
  describe('POST /auth/login', () => {
    beforeEach(async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({ username: 'alice', email: 'alice@test.com', password: 'password123' });
    });

    it('should login with valid credentials and return a token', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ username: 'alice', password: 'password123' })
        .expect(201);

      expect(res.body.access_token).toBeDefined();
      expect(res.body.message).toBe('Login successful');
    });

    it('should fail with wrong password (401)', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({ username: 'alice', password: 'wrongpassword' })
        .expect(401);
    });

    it('should fail with non-existent username (401)', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({ username: 'nobody', password: 'password123' })
        .expect(401);
    });

    it('should fail with missing fields (400)', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({ username: 'alice' })
        .expect(400);
    });
  });

  // ─── PROFILE ──────────────────────────────────────────────────────────────
  describe('GET /auth/profile', () => {
    beforeEach(async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/register')
        .send({ username: 'alice', email: 'alice@test.com', password: 'password123' });
      adminToken = res.body.access_token;
    });

    it('should return profile for authenticated user', async () => {
      const res = await request(app.getHttpServer())
        .get('/auth/profile')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.username).toBe('alice');
      expect(res.body.password).toBeUndefined();
    });

    it('should fail without token (401)', async () => {
      await request(app.getHttpServer()).get('/auth/profile').expect(401);
    });

    it('should fail with invalid token (401)', async () => {
      await request(app.getHttpServer())
        .get('/auth/profile')
        .set('Authorization', 'Bearer invalid.token.here')
        .expect(401);
    });
  });
});
