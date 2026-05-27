import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { db } from '../database/database';
import { CreateInventoryItemDto, UpdateInventoryItemDto, AdjustStockDto } from './dto/inventory.dto';

@Injectable()
export class InventoryService {

  // ── CREATE ──────────────────────────────────────────────────────────────
  create(dto: CreateInventoryItemDto) {
    if (db.findItemBySku(dto.sku)) {
      throw new ConflictException(`SKU '${dto.sku}' already exists`);
    }
    const supplier = db.findSupplierById(dto.supplierId);
    if (!supplier) {
      throw new NotFoundException(`Supplier '${dto.supplierId}' not found`);
    }
    if (!supplier.isActive) {
      throw new BadRequestException('Supplier is inactive');
    }

    const item = db.createItem({
      name: dto.name,
      sku: dto.sku,
      description: dto.description || '',
      quantity: dto.quantity,
      minStockLevel: dto.minStockLevel,
      price: dto.price,
      supplierId: dto.supplierId,
      category: dto.category,
      isActive: true,
    });

    return { message: 'Item created', item, lowStock: item.quantity < item.minStockLevel };
  }

  // ── READ ALL ─────────────────────────────────────────────────────────────
  findAll(category?: string, lowStockOnly?: string) {
    let items = db.getAllItems().filter(i => i.isActive);
    if (category) items = items.filter(i => i.category.toLowerCase() === category.toLowerCase());
    if (lowStockOnly === 'true') items = items.filter(i => i.quantity < i.minStockLevel);
    return {
      total: items.length,
      items,
      lowStockCount: items.filter(i => i.quantity < i.minStockLevel).length,
    };
  }

  // ── READ ONE ─────────────────────────────────────────────────────────────
  findOne(id: string) {
    const item = db.findItemById(id);
    if (!item || !item.isActive) throw new NotFoundException(`Item '${id}' not found`);
    const supplier = db.findSupplierById(item.supplierId);
    return { item, supplier: supplier || null, lowStock: item.quantity < item.minStockLevel };
  }

  // ── UPDATE ───────────────────────────────────────────────────────────────
  update(id: string, dto: UpdateInventoryItemDto) {
    const existing = db.findItemById(id);
    if (!existing || !existing.isActive) throw new NotFoundException(`Item '${id}' not found`);

    if (dto.sku && dto.sku !== existing.sku) {
      const skuConflict = db.findItemBySku(dto.sku);
      if (skuConflict) throw new ConflictException(`SKU '${dto.sku}' already exists`);
    }
    if (dto.supplierId && dto.supplierId !== existing.supplierId) {
      const supplier = db.findSupplierById(dto.supplierId);
      if (!supplier) throw new NotFoundException(`Supplier '${dto.supplierId}' not found`);
    }

    const item = db.updateItem(id, dto);
    return { message: 'Item updated', item, lowStock: item.quantity < item.minStockLevel };
  }

  // ── DELETE (soft) ────────────────────────────────────────────────────────
  remove(id: string) {
    const item = db.findItemById(id);
    if (!item || !item.isActive) throw new NotFoundException(`Item '${id}' not found`);
    db.updateItem(id, { isActive: false });
    return { message: 'Item deleted successfully' };
  }

  // ── STOCK ADJUSTMENT ─────────────────────────────────────────────────────
  adjustStock(id: string, dto: AdjustStockDto) {
    const item = db.findItemById(id);
    if (!item || !item.isActive) throw new NotFoundException(`Item '${id}' not found`);

    const newQty = item.quantity + dto.adjustment;
    if (newQty < 0) {
      throw new BadRequestException(
        `Adjustment would result in negative stock (current: ${item.quantity}, adjustment: ${dto.adjustment})`,
      );
    }

    const updated = db.updateItem(id, { quantity: newQty });
    return {
      message: 'Stock adjusted',
      previousQuantity: item.quantity,
      adjustment: dto.adjustment,
      newQuantity: updated.quantity,
      lowStock: updated.quantity < updated.minStockLevel,
      reason: dto.reason || 'Manual adjustment',
    };
  }

  // ── AVAILABILITY ──────────────────────────────────────────────────────────
  getAvailability(id: string) {
    const item = db.findItemById(id);
    if (!item || !item.isActive) throw new NotFoundException(`Item '${id}' not found`);
    return {
      id: item.id,
      name: item.name,
      sku: item.sku,
      available: item.quantity > 0,
      quantity: item.quantity,
      minStockLevel: item.minStockLevel,
      lowStock: item.quantity < item.minStockLevel,
      status: item.quantity === 0 ? 'OUT_OF_STOCK' : item.quantity < item.minStockLevel ? 'LOW_STOCK' : 'IN_STOCK',
    };
  }
}
