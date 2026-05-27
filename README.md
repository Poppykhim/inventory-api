# 📦 Inventory Management API

A production-grade Warehouse Inventory Management REST API built with **NestJS**, featuring JWT authentication, full CRUD for inventory items & suppliers, real-time stock tracking, and role-based access control.

---

## 🏗️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | NestJS (Node.js) |
| Language | TypeScript |
| Auth | JWT + Passport |
| Validation | class-validator / class-transformer |
| Docs | Swagger / OpenAPI |
| Testing | Jest + Supertest (unit + e2e) |
| CI/CD | GitHub Actions |

---

## 🚀 Quick Start

```bash
npm install
npm run start:dev
# API: http://localhost:3000
# Swagger: http://localhost:3000/api/docs
```

---

## 📋 API Endpoints

### 🔐 Auth
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/auth/register` | Public | Register (role: user/admin) |
| POST | `/auth/login` | Public | Login → JWT token |
| GET | `/auth/profile` | Any Auth | Current user profile |

### 📦 Inventory
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/inventory` | Admin | Create item |
| GET | `/inventory` | Any Auth | List items (?category=X&lowStockOnly=true) |
| GET | `/inventory/:id` | Any Auth | Get item |
| PUT | `/inventory/:id` | Admin | Update item |
| DELETE | `/inventory/:id` | Admin | Soft-delete item |
| PATCH | `/inventory/:id/stock` | Admin | Adjust stock (+/-) |
| GET | `/inventory/:id/availability` | Any Auth | IN_STOCK / LOW_STOCK / OUT_OF_STOCK |

### 🏭 Suppliers
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/suppliers` | Admin | Create supplier |
| GET | `/suppliers` | Any Auth | List suppliers |
| GET | `/suppliers/:id` | Any Auth | Get supplier + item count |
| PUT | `/suppliers/:id` | Admin | Update supplier |
| DELETE | `/suppliers/:id` | Admin | Delete (blocked if has active items) |

---

## 🧪 Testing (85 tests)

```bash
npm test            # All tests
npm run test:unit   # Unit tests only
npm run test:e2e    # E2E tests only
npm run test:cov    # With coverage
```

---

## ⚙️ GitHub Actions Setup

Add these secrets under **Settings → Secrets → Actions**:

| Secret | Description |
|--------|-------------|
| `MAIL_USERNAME` | Gmail address for sending |
| `MAIL_PASSWORD` | Gmail App Password |
| `JWT_SECRET` | JWT signing secret |

Emails are sent on every push to `main` to:
- The **git committer's email** (auto-detected)
- **srengty@gmail.com**

---

## 🏛️ Project Structure

```
src/
├── auth/               # JWT auth, register, login
├── inventory/          # Full CRUD + stock + availability
├── suppliers/          # Supplier management
├── common/             # Guards, decorators
├── database/           # In-memory Map-based store
└── main.ts             # Bootstrap + Swagger

test/
├── auth.e2e-spec.ts         (14 tests)
├── auth.service.spec.ts     (9 tests)
├── inventory.e2e-spec.ts    (36 tests)
├── inventory.service.spec.ts (20 tests)
└── suppliers.e2e-spec.ts    (15 tests)
```
