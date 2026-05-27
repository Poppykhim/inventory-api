import request from 'supertest';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { AppModule } from '../src/app.module';
import { db } from '../src/database/database';

describe('Inventory Endpoints (e2e)', () => {
  let app: INestApplication;
  let adminToken: string;
  let userToken: string;
  let supplierId: string;
  let itemId: string;

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

    // Create admin
    const adminRes = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ username: 'admin', email: 'admin@test.com', password: 'adminpass', role: 'admin' });
    adminToken = adminRes.body.access_token;

    // Create regular user
    const userRes = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ username: 'user', email: 'user@test.com', password: 'userpass', role: 'user' });
    userToken = userRes.body.access_token;

    // Create a supplier for item tests
    const supplierRes = await request(app.getHttpServer())
      .post('/suppliers')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Test Supplier', email: 'supplier@test.com', phone: '+1-555-0101', address: '1 Supplier St' });
    supplierId = supplierRes.body.supplier.id;
  });

  afterAll(async () => {
    db.clear();
    await app.close();
  });

  const validItem = () => ({
    name: 'Wireless Mouse',
    sku: 'SKU-001',
    description: 'A premium mouse',
    quantity: 50,
    minStockLevel: 10,
    price: 29.99,
    supplierId,
    category: 'Electronics',
  });

  // ─── CREATE ───────────────────────────────────────────────────────────────
  describe('POST /inventory', () => {
    it('admin should create an item successfully', async () => {
      const res = await request(app.getHttpServer())
        .post('/inventory')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(validItem())
        .expect(201);

      expect(res.body.item.name).toBe('Wireless Mouse');
      expect(res.body.item.sku).toBe('SKU-001');
      expect(res.body.item.id).toBeDefined();
      expect(res.body.lowStock).toBe(false);
    });

    it('should detect low stock on creation', async () => {
      const res = await request(app.getHttpServer())
        .post('/inventory')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ ...validItem(), quantity: 5, minStockLevel: 10 })
        .expect(201);

      expect(res.body.lowStock).toBe(true);
    });

    it('should fail with duplicate SKU (409)', async () => {
      await request(app.getHttpServer())
        .post('/inventory')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(validItem());

      await request(app.getHttpServer())
        .post('/inventory')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ ...validItem(), name: 'Another Item' })
        .expect(409);
    });

    it('should fail with non-existent supplier (404)', async () => {
      await request(app.getHttpServer())
        .post('/inventory')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ ...validItem(), supplierId: 'non-existent-id' })
        .expect(404);
    });

    it('should fail for regular user (403)', async () => {
      await request(app.getHttpServer())
        .post('/inventory')
        .set('Authorization', `Bearer ${userToken}`)
        .send(validItem())
        .expect(403);
    });

    it('should fail without auth (401)', async () => {
      await request(app.getHttpServer())
        .post('/inventory')
        .send(validItem())
        .expect(401);
    });

    it('should fail with missing required fields (400)', async () => {
      await request(app.getHttpServer())
        .post('/inventory')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Incomplete Item' })
        .expect(400);
    });

    it('should fail with negative price (400)', async () => {
      await request(app.getHttpServer())
        .post('/inventory')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ ...validItem(), price: -5 })
        .expect(400);
    });

    it('should fail with negative quantity (400)', async () => {
      await request(app.getHttpServer())
        .post('/inventory')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ ...validItem(), quantity: -1 })
        .expect(400);
    });
  });

  // ─── READ ALL ─────────────────────────────────────────────────────────────
  describe('GET /inventory', () => {
    beforeEach(async () => {
      await request(app.getHttpServer())
        .post('/inventory')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(validItem());
      await request(app.getHttpServer())
        .post('/inventory')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ ...validItem(), name: 'Keyboard', sku: 'SKU-002', category: 'Electronics', quantity: 5, minStockLevel: 10 });
      await request(app.getHttpServer())
        .post('/inventory')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ ...validItem(), name: 'Desk Chair', sku: 'SKU-003', category: 'Furniture', quantity: 20, minStockLevel: 5 });
    });

    it('should list all active items', async () => {
      const res = await request(app.getHttpServer())
        .get('/inventory')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.total).toBe(3);
      expect(Array.isArray(res.body.items)).toBe(true);
    });

    it('should filter by category', async () => {
      const res = await request(app.getHttpServer())
        .get('/inventory?category=Electronics')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.total).toBe(2);
      expect(res.body.items.every(i => i.category === 'Electronics')).toBe(true);
    });

    it('should filter low stock items only', async () => {
      const res = await request(app.getHttpServer())
        .get('/inventory?lowStockOnly=true')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.total).toBe(1);
      expect(res.body.items[0].name).toBe('Keyboard');
    });

    it('should return lowStockCount in response', async () => {
      const res = await request(app.getHttpServer())
        .get('/inventory')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.lowStockCount).toBe(1);
    });

    it('should allow regular users to list items', async () => {
      await request(app.getHttpServer())
        .get('/inventory')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);
    });
  });

  // ─── READ ONE ─────────────────────────────────────────────────────────────
  describe('GET /inventory/:id', () => {
    beforeEach(async () => {
      const res = await request(app.getHttpServer())
        .post('/inventory')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(validItem());
      itemId = res.body.item.id;
    });

    it('should get a single item by ID', async () => {
      const res = await request(app.getHttpServer())
        .get(`/inventory/${itemId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.item.id).toBe(itemId);
      expect(res.body.item.name).toBe('Wireless Mouse');
      expect(res.body.supplier).toBeDefined();
    });

    it('should return 404 for non-existent item', async () => {
      await request(app.getHttpServer())
        .get('/inventory/non-existent-id')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });
  });

  // ─── UPDATE ───────────────────────────────────────────────────────────────
  describe('PUT /inventory/:id', () => {
    beforeEach(async () => {
      const res = await request(app.getHttpServer())
        .post('/inventory')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(validItem());
      itemId = res.body.item.id;
    });

    it('admin should update an item', async () => {
      const res = await request(app.getHttpServer())
        .put(`/inventory/${itemId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Updated Mouse', price: 39.99 })
        .expect(200);

      expect(res.body.item.name).toBe('Updated Mouse');
      expect(res.body.item.price).toBe(39.99);
      expect(res.body.item.sku).toBe('SKU-001'); // unchanged
    });

    it('should fail with duplicate SKU on update (409)', async () => {
      await request(app.getHttpServer())
        .post('/inventory')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ ...validItem(), sku: 'SKU-002', name: 'Keyboard' });

      await request(app.getHttpServer())
        .put(`/inventory/${itemId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ sku: 'SKU-002' })
        .expect(409);
    });

    it('should fail for non-existent item (404)', async () => {
      await request(app.getHttpServer())
        .put('/inventory/bad-id')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'New Name' })
        .expect(404);
    });

    it('should fail for regular user (403)', async () => {
      await request(app.getHttpServer())
        .put(`/inventory/${itemId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ name: 'Hacked' })
        .expect(403);
    });
  });

  // ─── DELETE ───────────────────────────────────────────────────────────────
  describe('DELETE /inventory/:id', () => {
    beforeEach(async () => {
      const res = await request(app.getHttpServer())
        .post('/inventory')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(validItem());
      itemId = res.body.item.id;
    });

    it('admin should soft-delete an item', async () => {
      const res = await request(app.getHttpServer())
        .delete(`/inventory/${itemId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.message).toBe('Item deleted successfully');

      // Item should no longer appear in list
      const list = await request(app.getHttpServer())
        .get('/inventory')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(list.body.total).toBe(0);
    });

    it('should return 404 when deleting again (already deleted)', async () => {
      await request(app.getHttpServer())
        .delete(`/inventory/${itemId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      await request(app.getHttpServer())
        .delete(`/inventory/${itemId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });

    it('should fail for regular user (403)', async () => {
      await request(app.getHttpServer())
        .delete(`/inventory/${itemId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
    });

    it('should fail for non-existent item (404)', async () => {
      await request(app.getHttpServer())
        .delete('/inventory/ghost-id')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });
  });

  // ─── STOCK ADJUSTMENT ─────────────────────────────────────────────────────
  describe('PATCH /inventory/:id/stock', () => {
    beforeEach(async () => {
      const res = await request(app.getHttpServer())
        .post('/inventory')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(validItem()); // quantity: 50
      itemId = res.body.item.id;
    });

    it('should increase stock', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/inventory/${itemId}/stock`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ adjustment: 25, reason: 'Restocked' })
        .expect(200);

      expect(res.body.newQuantity).toBe(75);
      expect(res.body.previousQuantity).toBe(50);
    });

    it('should decrease stock', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/inventory/${itemId}/stock`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ adjustment: -20 })
        .expect(200);

      expect(res.body.newQuantity).toBe(30);
    });

    it('should fail when adjustment causes negative stock (400)', async () => {
      await request(app.getHttpServer())
        .patch(`/inventory/${itemId}/stock`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ adjustment: -999 })
        .expect(400);
    });

    it('should allow adjustment to exactly zero', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/inventory/${itemId}/stock`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ adjustment: -50 })
        .expect(200);

      expect(res.body.newQuantity).toBe(0);
    });
  });

  // ─── AVAILABILITY ─────────────────────────────────────────────────────────
  describe('GET /inventory/:id/availability', () => {
    it('should report IN_STOCK status', async () => {
      const itemRes = await request(app.getHttpServer())
        .post('/inventory')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ ...validItem(), quantity: 50, minStockLevel: 10 });

      const res = await request(app.getHttpServer())
        .get(`/inventory/${itemRes.body.item.id}/availability`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.status).toBe('IN_STOCK');
      expect(res.body.available).toBe(true);
    });

    it('should report LOW_STOCK status', async () => {
      const itemRes = await request(app.getHttpServer())
        .post('/inventory')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ ...validItem(), quantity: 5, minStockLevel: 10 });

      const res = await request(app.getHttpServer())
        .get(`/inventory/${itemRes.body.item.id}/availability`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.status).toBe('LOW_STOCK');
    });

    it('should report OUT_OF_STOCK status', async () => {
      const itemRes = await request(app.getHttpServer())
        .post('/inventory')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ ...validItem(), quantity: 0, minStockLevel: 10 });

      const res = await request(app.getHttpServer())
        .get(`/inventory/${itemRes.body.item.id}/availability`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.status).toBe('OUT_OF_STOCK');
      expect(res.body.available).toBe(false);
    });
  });
});
