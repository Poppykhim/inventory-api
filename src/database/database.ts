import { v4 as uuidv4 } from 'uuid';

export interface User {
  id: string;
  username: string;
  email: string;
  password: string;
  role: 'admin' | 'user';
  createdAt: Date;
}

export interface InventoryItem {
  id: string;
  name: string;
  sku: string;
  description: string;
  quantity: number;
  minStockLevel: number;
  price: number;
  supplierId: string;
  category: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Supplier {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

class InMemoryDatabase {
  private users: Map<string, User> = new Map();
  private inventoryItems: Map<string, InventoryItem> = new Map();
  private suppliers: Map<string, Supplier> = new Map();

  // ---------- USERS ----------
  createUser(data: Omit<User, 'id' | 'createdAt'>): User {
    const user: User = { id: uuidv4(), createdAt: new Date(), ...data };
    this.users.set(user.id, user);
    return user;
  }

  findUserById(id: string): User | undefined {
    return this.users.get(id);
  }

  findUserByUsername(username: string): User | undefined {
    return Array.from(this.users.values()).find(u => u.username === username);
  }

  findUserByEmail(email: string): User | undefined {
    return Array.from(this.users.values()).find(u => u.email === email);
  }

  getAllUsers(): User[] {
    return Array.from(this.users.values());
  }

  // ---------- INVENTORY ----------
  createItem(data: Omit<InventoryItem, 'id' | 'createdAt' | 'updatedAt'>): InventoryItem {
    const item: InventoryItem = {
      id: uuidv4(),
      createdAt: new Date(),
      updatedAt: new Date(),
      ...data,
    };
    this.inventoryItems.set(item.id, item);
    return item;
  }

  findItemById(id: string): InventoryItem | undefined {
    return this.inventoryItems.get(id);
  }

  findItemBySku(sku: string): InventoryItem | undefined {
    return Array.from(this.inventoryItems.values()).find(i => i.sku === sku);
  }

  getAllItems(): InventoryItem[] {
    return Array.from(this.inventoryItems.values());
  }

  updateItem(id: string, data: Partial<Omit<InventoryItem, 'id' | 'createdAt'>>): InventoryItem | undefined {
    const item = this.inventoryItems.get(id);
    if (!item) return undefined;
    const updated = { ...item, ...data, updatedAt: new Date() };
    this.inventoryItems.set(id, updated);
    return updated;
  }

  deleteItem(id: string): boolean {
    return this.inventoryItems.delete(id);
  }

  // ---------- SUPPLIERS ----------
  createSupplier(data: Omit<Supplier, 'id' | 'createdAt' | 'updatedAt'>): Supplier {
    const supplier: Supplier = {
      id: uuidv4(),
      createdAt: new Date(),
      updatedAt: new Date(),
      ...data,
    };
    this.suppliers.set(supplier.id, supplier);
    return supplier;
  }

  findSupplierById(id: string): Supplier | undefined {
    return this.suppliers.get(id);
  }

  getAllSuppliers(): Supplier[] {
    return Array.from(this.suppliers.values());
  }

  updateSupplier(id: string, data: Partial<Omit<Supplier, 'id' | 'createdAt'>>): Supplier | undefined {
    const supplier = this.suppliers.get(id);
    if (!supplier) return undefined;
    const updated = { ...supplier, ...data, updatedAt: new Date() };
    this.suppliers.set(id, updated);
    return updated;
  }

  deleteSupplier(id: string): boolean {
    return this.suppliers.delete(id);
  }

  // ---------- UTILS ----------
  clear() {
    this.users.clear();
    this.inventoryItems.clear();
    this.suppliers.clear();
  }
}

export const db = new InMemoryDatabase();
