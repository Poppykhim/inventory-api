import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InventoryService } from '../src/inventory/inventory.service';
import { db } from '../src/database/database';

describe('InventoryService (unit)', () => {
  let service: InventoryService;
  let supplierId: string;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [InventoryService],
    }).compile();
    service = module.get<InventoryService>(InventoryService);
  });

  beforeEach(() => {
    db.clear();
    const supplier = db.createSupplier({
      name: 'Unit Test Supplier', email: 's@test.com',
      phone: '+1-555-0000', address: '1 St', isActive: true,
    });
    supplierId = supplier.id;
  });

  const dto = () => ({
    name: 'Test Item', sku: 'UNIT-001', description: 'desc',
    quantity: 100, minStockLevel: 20, price: 9.99,
    supplierId, category: 'Tools',
  });

  describe('create()', () => {
    it('creates item successfully', () => {
      const result = service.create(dto());
      expect(result.item.sku).toBe('UNIT-001');
      expect(result.item.isActive).toBe(true);
    });

    it('throws ConflictException for duplicate SKU', () => {
      service.create(dto());
      expect(() => service.create(dto())).toThrow(ConflictException);
    });

    it('throws NotFoundException for invalid supplier', () => {
      expect(() => service.create({ ...dto(), supplierId: 'bad-id' })).toThrow(NotFoundException);
    });

    it('throws BadRequestException for inactive supplier', () => {
      db.updateSupplier(supplierId, { isActive: false });
      expect(() => service.create(dto())).toThrow(BadRequestException);
    });
  });

  describe('findAll()', () => {
    it('returns all active items', () => {
      service.create(dto());
      service.create({ ...dto(), sku: 'UNIT-002', name: 'Item2' });
      const result = service.findAll();
      expect(result.total).toBe(2);
    });

    it('filters by category', () => {
      service.create(dto()); // category: Tools
      service.create({ ...dto(), sku: 'UNIT-002', name: 'B', category: 'Office' });
      const result = service.findAll('Tools');
      expect(result.total).toBe(1);
    });

    it('filters low stock items', () => {
      service.create({ ...dto(), quantity: 5, minStockLevel: 20 });
      service.create({ ...dto(), sku: 'UNIT-002', name: 'B', quantity: 100, minStockLevel: 10 });
      const result = service.findAll(undefined, 'true');
      expect(result.total).toBe(1);
    });
  });

  describe('findOne()', () => {
    it('returns item with supplier', () => {
      const created = service.create(dto());
      const result = service.findOne(created.item.id);
      expect(result.item.id).toBe(created.item.id);
      expect(result.supplier).not.toBeNull();
    });

    it('throws NotFoundException for bad ID', () => {
      expect(() => service.findOne('no-id')).toThrow(NotFoundException);
    });
  });

  describe('update()', () => {
    it('updates item fields', () => {
      const { item } = service.create(dto());
      const result = service.update(item.id, { name: 'Updated', price: 19.99 });
      expect(result.item.name).toBe('Updated');
      expect(result.item.sku).toBe('UNIT-001');
    });

    it('throws NotFoundException for bad ID', () => {
      expect(() => service.update('bad', { name: 'x' })).toThrow(NotFoundException);
    });
  });

  describe('remove()', () => {
    it('soft-deletes item', () => {
      const { item } = service.create(dto());
      const result = service.remove(item.id);
      expect(result.message).toContain('deleted');
      expect(() => service.findOne(item.id)).toThrow(NotFoundException);
    });
  });

  describe('adjustStock()', () => {
    it('increases stock', () => {
      const { item } = service.create({ ...dto(), quantity: 50 });
      const result = service.adjustStock(item.id, { adjustment: 30 });
      expect(result.newQuantity).toBe(80);
    });

    it('decreases stock', () => {
      const { item } = service.create({ ...dto(), quantity: 50 });
      const result = service.adjustStock(item.id, { adjustment: -20 });
      expect(result.newQuantity).toBe(30);
    });

    it('throws BadRequestException on negative result', () => {
      const { item } = service.create({ ...dto(), quantity: 10 });
      expect(() => service.adjustStock(item.id, { adjustment: -20 })).toThrow(BadRequestException);
    });
  });

  describe('getAvailability()', () => {
    it('returns IN_STOCK', () => {
      const { item } = service.create({ ...dto(), quantity: 50, minStockLevel: 10 });
      const r = service.getAvailability(item.id);
      expect(r.status).toBe('IN_STOCK');
    });

    it('returns LOW_STOCK', () => {
      const { item } = service.create({ ...dto(), quantity: 5, minStockLevel: 10 });
      const r = service.getAvailability(item.id);
      expect(r.status).toBe('LOW_STOCK');
    });

    it('returns OUT_OF_STOCK', () => {
      const { item } = service.create({ ...dto(), quantity: 0, minStockLevel: 10 });
      const r = service.getAvailability(item.id);
      expect(r.status).toBe('OUT_OF_STOCK');
      expect(r.available).toBe(false);
    });
  });
});
