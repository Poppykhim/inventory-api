import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { db } from '../database/database';
import { CreateSupplierDto, UpdateSupplierDto } from './dto/supplier.dto';

@Injectable()
export class SuppliersService {
  create(dto: CreateSupplierDto) {
    const existing = db.getAllSuppliers().find(s => s.email === dto.email);
    if (existing) throw new ConflictException('Supplier email already registered');

    const supplier = db.createSupplier({ ...dto, isActive: true });
    return { message: 'Supplier created', supplier };
  }

  findAll() {
    const suppliers = db.getAllSuppliers().filter(s => s.isActive);
    return { total: suppliers.length, suppliers };
  }

  findOne(id: string) {
    const supplier = db.findSupplierById(id);
    if (!supplier || !supplier.isActive) throw new NotFoundException(`Supplier '${id}' not found`);
    const items = db.getAllItems().filter(i => i.supplierId === id && i.isActive);
    return { supplier, itemCount: items.length };
  }

  update(id: string, dto: UpdateSupplierDto) {
    const existing = db.findSupplierById(id);
    if (!existing || !existing.isActive) throw new NotFoundException(`Supplier '${id}' not found`);
    const updated = db.updateSupplier(id, dto);
    return { message: 'Supplier updated', supplier: updated };
  }

  remove(id: string) {
    const supplier = db.findSupplierById(id);
    if (!supplier || !supplier.isActive) throw new NotFoundException(`Supplier '${id}' not found`);
    const activeItems = db.getAllItems().filter(i => i.supplierId === id && i.isActive);
    if (activeItems.length > 0) {
      throw new ConflictException(`Cannot delete supplier with ${activeItems.length} active item(s)`);
    }
    db.updateSupplier(id, { isActive: false });
    return { message: 'Supplier deleted successfully' };
  }
}
