import request from 'supertest';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { AppModule } from '../src/app.module';
import { db } from '../src/database/database';

describe('Suppliers Endpoints (e2e)', () => {
  let app: INestApplication;
  let adminToken: string;
  let userToken: string;
  let supplierId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
    await app.init();
  });

  beforeEach(async () => {
    db.clear();
    const adminRes = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ username: 'admin', email: 'admin@test.com', password: 'adminpass', role: 'admin' });
    adminToken = adminRes.body.access_token;

    const userRes = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ username: 'user', email: 'user@test.com', password: 'userpass' });
    userToken = userRes.body.access_token;
  });

  afterAll(async () => {
    db.clear();
    await app.close();
  });

  const validSupplier = () => ({
    name: 'Tech Supplies Co.',
    email: 'contact@techsupplies.com',
    phone: '+1-555-0100',
    address: '123 Supplier Ave',
  });

  // ─── CREATE ───────────────────────────────────────────────────────────────
  describe('POST /suppliers', () => {
    it('admin should create a supplier', async () => {
      const res = await request(app.getHttpServer())
        .post('/suppliers')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(validSupplier())
        .expect(201);

      expect(res.body.supplier.id).toBeDefined();
      expect(res.body.supplier.name).toBe('Tech Supplies Co.');
      expect(res.body.supplier.isActive).toBe(true);
    });

    it('should fail with duplicate email (409)', async () => {
      await request(app.getHttpServer())
        .post('/suppliers')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(validSupplier());

      await request(app.getHttpServer())
        .post('/suppliers')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ ...validSupplier(), name: 'Other Supplier' })
        .expect(409);
    });

    it('should fail with invalid email (400)', async () => {
      await request(app.getHttpServer())
        .post('/suppliers')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ ...validSupplier(), email: 'not-valid' })
        .expect(400);
    });

    it('should fail for regular user (403)', async () => {
      await request(app.getHttpServer())
        .post('/suppliers')
        .set('Authorization', `Bearer ${userToken}`)
        .send(validSupplier())
        .expect(403);
    });

    it('should fail without auth (401)', async () => {
      await request(app.getHttpServer())
        .post('/suppliers')
        .send(validSupplier())
        .expect(401);
    });
  });

  // ─── READ ─────────────────────────────────────────────────────────────────
  describe('GET /suppliers', () => {
    beforeEach(async () => {
      const res = await request(app.getHttpServer())
        .post('/suppliers')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(validSupplier());
      supplierId = res.body.supplier.id;
    });

    it('should list all suppliers', async () => {
      const res = await request(app.getHttpServer())
        .get('/suppliers')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.total).toBe(1);
    });

    it('should get a supplier by ID with item count', async () => {
      const res = await request(app.getHttpServer())
        .get(`/suppliers/${supplierId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.supplier.id).toBe(supplierId);
      expect(res.body.itemCount).toBeDefined();
    });

    it('should return 404 for non-existent supplier', async () => {
      await request(app.getHttpServer())
        .get('/suppliers/fake-id')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });
  });

  // ─── UPDATE ───────────────────────────────────────────────────────────────
  describe('PUT /suppliers/:id', () => {
    beforeEach(async () => {
      const res = await request(app.getHttpServer())
        .post('/suppliers')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(validSupplier());
      supplierId = res.body.supplier.id;
    });

    it('should update supplier details', async () => {
      const res = await request(app.getHttpServer())
        .put(`/suppliers/${supplierId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Updated Supplier Name' })
        .expect(200);

      expect(res.body.supplier.name).toBe('Updated Supplier Name');
      expect(res.body.supplier.email).toBe('contact@techsupplies.com');
    });

    it('should fail for non-existent supplier (404)', async () => {
      await request(app.getHttpServer())
        .put('/suppliers/bad-id')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'New Name' })
        .expect(404);
    });
  });

  // ─── DELETE ───────────────────────────────────────────────────────────────
  describe('DELETE /suppliers/:id', () => {
    beforeEach(async () => {
      const res = await request(app.getHttpServer())
        .post('/suppliers')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(validSupplier());
      supplierId = res.body.supplier.id;
    });

    it('should delete a supplier with no active items', async () => {
      const res = await request(app.getHttpServer())
        .delete(`/suppliers/${supplierId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.message).toBe('Supplier deleted successfully');
    });

    it('should fail to delete supplier with active items (409)', async () => {
      await request(app.getHttpServer())
        .post('/inventory')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Mouse', sku: 'SKU-001', quantity: 10, minStockLevel: 2,
          price: 25, supplierId, category: 'Electronics',
        });

      await request(app.getHttpServer())
        .delete(`/suppliers/${supplierId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(409);
    });

    it('should return 404 for already-deleted supplier', async () => {
      await request(app.getHttpServer())
        .delete(`/suppliers/${supplierId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      await request(app.getHttpServer())
        .delete(`/suppliers/${supplierId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });
  });
});
