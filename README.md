# Interplumb — Dynamic Inventory Management System

A multi-project, multi-warehouse inventory system modelled on the operational
logic of `INTERPLUMB INVENTORY.xlsx`, rebuilt as a proper web application.

- **Backend:** Node.js + Express + PostgreSQL + Sequelize ORM
- **Frontend:** Next.js (App Router) + Tailwind CSS
- **Importer:** ExcelJS-based loader that seeds the database from the current workbook

---

## 1. System Architecture

```
┌────────────────┐     HTTP JSON     ┌──────────────────────┐     SQL      ┌───────────────┐
│  Next.js UI    │ ───────────────▶ │ Express + Sequelize   │ ───────────▶ │  PostgreSQL   │
│ (app router,   │                   │ services / controllers│              │  (normalised  │
│ Tailwind, SWR) │ ◀─────────────── │                       │ ◀─────────── │   schema)     │
└────────────────┘                   └──────────────────────┘              └───────────────┘
        ▲                                      ▲
        │                                      │
        └──────────── ExcelJS importer ────────┘
           (one-time / recurring Excel → DB seed)
```

Layers inside the backend:

- **Models (`src/models`)** — Sequelize definitions with associations and indexes
- **Services (`src/services`)** — `StockService` (availability, guards), `ReportService` (weekly/monthly rollups)
- **Controllers (`src/controllers`)** — HTTP adapters; a shared `crudFactory` handles uniform CRUD
- **Routes (`src/routes`)** — Joi-validated route wiring
- **Middleware** — `errorHandler`, `validate`
- **Importers** — `excelImporter.js` reads each worksheet and upserts master data + transactions

---

## 2. Database Schema

Tables (snake_case, `underscored: true`):

| Table              | Purpose                                                            |
|--------------------|--------------------------------------------------------------------|
| `items`            | Master list of inventory items (code unique, description, unit, reorder level, price) |
| `warehouses`       | Storage points (e.g. Container 1…N)                                |
| `suppliers`        | Vendors that deliver stock                                         |
| `projects`         | Client/project sites that consume materials (e.g. Stanbic Bank)    |
| `opening_stock`    | Initial quantities per item per warehouse                          |
| `stock_receipts`   | Incoming purchases (item, qty, supplier, invoice, warehouse)       |
| `issued_materials` | Items issued to a project from a warehouse (the `ISSUED TO` link)  |
| `stock_transfers`  | Movements between warehouses (with integrity check)                |
| `stock_adjustments`| Signed +/- corrections (breakage, count variance, write-offs)      |
| `price_list_entries` | Imported price reference from workbook's `Price List`            |

Key constraints / indexes:

- `items.code` is **unique** — primary business key used across all transactions
- All transaction tables carry `item_id`, `warehouse_id`, `transaction_date` indexes
- `stock_transfers` enforces `from_warehouse_id != to_warehouse_id`
- Foreign keys default to `RESTRICT`; `supplier_id` uses `SET NULL`

ER (simplified):

```
items ─┬── opening_stock ── warehouses
       ├── stock_receipts  ── warehouses, suppliers
       ├── issued_materials ── warehouses, projects
       ├── stock_transfers ── warehouses (from, to)
       └── stock_adjustments ── warehouses
suppliers ─── stock_receipts, opening_stock
projects ─── issued_materials
```

---

## 3. Backend Logic for Stock Calculations

Stock is computed **per (item, warehouse)** on demand (no denormalised balance
column — guarantees correctness under concurrent writes):

```
on_hand(item, warehouse) =
    Σ opening_stock.quantity
  + Σ stock_receipts.quantity
  + Σ stock_transfers.quantity WHERE to_warehouse   = warehouse  (transferred_in)
  − Σ stock_transfers.quantity WHERE from_warehouse = warehouse  (transferred_out)
  − Σ issued_materials.quantity
  + Σ stock_adjustments.quantity_delta
```

This matches and generalises the spreadsheet formula:
`opening + received − issued` (per CODE), extending it to warehouse-level
granularity, transfers, and signed adjustments.

Implementation: `src/services/StockService.js` → `getAvailability({...})`.

Stock-integrity guards (used before mutating writes):

- `ensureSufficient({ itemId, warehouseId, quantity })` — throws HTTP 400 if
  requested qty exceeds on-hand. Applied in:
  - Issued material creation and updates
  - Stock transfers (from-side)
  - Negative adjustments

All mutating flows that depend on availability run inside a Sequelize
transaction (`sequelize.transaction`), so the availability check and the
insert are atomic.

---

## 4. Frontend / Dashboard Structure

Pages (`frontend/app/…`):

```
/                    Dashboard (KPIs, most issued, low stock, monthly trends)
/stock               Stock availability table (live balances + filters)
/items               Master item list + create form
/opening-stock       Opening stock entries
/receipts            Stock received (purchases)
/issued              Issued material per project
/transfers           Warehouse-to-warehouse transfers
/reports/weekly      Weekly issued summary (per project + totals)
/reports/monthly     Monthly summary (issued + received + totals)
/projects            Projects CRUD
/warehouses          Warehouses CRUD
/suppliers           Suppliers CRUD
```

Shared components:

- `Sidebar`, `PageHeader`, `KPICard`, `DataTable`, `SearchBar`, `SimpleMasterPage`
- `lib/api.ts` — thin fetch wrapper, SWR-friendly
- `next.config.js` — `/api/:path*` rewrites to the backend for same-origin requests

---

## 5. Weekly and Monthly Reporting Logic

### Weekly (`GET /api/reports/weekly`)

Query params: `from`, `to`, `projectId`, `warehouseId`.

```sql
SELECT DATE_TRUNC('week', transaction_date)::date + INTERVAL '6 days' AS week_ending,
       project_id, item_id, warehouse_id, SUM(quantity) AS quantity
FROM   issued_materials
WHERE  transaction_date BETWEEN :from AND :to
       [AND project_id = :projectId]
       [AND warehouse_id = :warehouseId]
GROUP BY DATE_TRUNC('week', transaction_date), project_id, item_id, warehouse_id
ORDER BY DATE_TRUNC('week', transaction_date);
```

The service shape-shifts rows into:

```json
[
  {
    "week_ending": "2026-01-25",
    "total_issued_all_projects": 345,
    "projects": [
      { "project_name": "Stanbic Bank", "total_quantity": 120, "items": [...] },
      { "project_name": "Acacia Mall",  "total_quantity": 225, "items": [...] }
    ]
  }
]
```

### Monthly (`GET /api/reports/monthly`)

Query params: `year`, `projectId`, `warehouseId`. Aggregates `issued_materials`
**and** `stock_receipts` by month and bundles them with per-project breakdowns.
Also returns global totals per month across all projects.

### Trends (`GET /api/reports/trends`)

Returns two parallel month-bucketed series: `issued` and `received`, used by
the dashboard.

---

## 6. Validation Rules for Stock Integrity

Schema-level (Joi — `src/routes/schemas.js`):

- All required FKs (`item_id`, `warehouse_id`, etc.) are positive integers
- `quantity` must be strictly `> 0` on every transaction
- `stock_transfers.to_warehouse_id` cannot equal `from_warehouse_id`
- `stock_adjustments.quantity_delta` can be negative, but `reason` is required

Runtime (service level):

- **No oversell / over-issue**: an issue that would drive on-hand below zero
  is rejected with `400` and a payload including `available` vs `requested`.
- **Transfer feasibility**: transfer quantity must be ≤ on-hand at the source.
- **Negative adjustments**: treated as consumption; same feasibility check.
- **Atomicity**: each mutating endpoint wraps its availability check and insert
  in a DB transaction to avoid TOCTOU races.

Database-level:

- Unique `items.code`, `warehouses.name`, `suppliers.name`, `projects.name`
- `onDelete: RESTRICT` on item/warehouse/project to prevent cascading loss
- Indexes on `transaction_date`, `item_id`, `warehouse_id`, `week_ending`

---

## 7. Improvements Over the Current Excel Workflow

Observed issues in the workbook that are fixed here:

| Issue in Excel                                                   | Fix in the system                                                  |
|------------------------------------------------------------------|--------------------------------------------------------------------|
| `LOCATION` typos (`CONAINER 45`, `container 47`, `Container 9 `) | Normalised on import; warehouses deduplicated by canonical name    |
| `SUPLLIER` column misspelling carried through                    | Imported into a clean `suppliers` table                            |
| Stock availability only as a SUMIF per code (no warehouse split) | On-hand computed per `(item, warehouse)` with transfers/adjustments|
| No stock-out guard — you can issue more than you have            | `ensureSufficient` blocks over-issuance at the API level           |
| Projects not a first-class entity (`ISSUED TO` free text)        | `projects` table; every issuance FK-linked to a project            |
| `MONTHLY SUMMARY` sheet must be rebuilt manually                 | `GET /api/reports/monthly` computes it live                        |
| No audit trail / history                                         | Every movement is an append-only row with `created_at` / `updated_at`|
| Limited concurrent access                                        | Server-backed; many users can work at once                         |
| Reorder levels not tracked                                       | `items.reorder_level`; dashboard surfaces low stock in real time   |
| Price list is a disconnected sheet                               | `price_list_entries` linkable by `material_code`                   |

Further recommendations:

1. **Role-based access** (admin / storekeeper / project manager) — add an auth layer (JWT + roles) before rolling out to the warehouse.
2. **Barcode / QR code scanning** — add `items.barcode` and a mobile-friendly scan page for faster issuance.
3. **Inventory snapshots** — a nightly job that persists `(item, warehouse, on_hand)` so historical balances are queryable without replaying all transactions.
4. **Cycle counts** — UI for counting + reconciliation posting adjustments with reason codes.
5. **Exports** — PDF/Excel export of weekly/monthly reports for operations.
6. **Audit log** — optional `audit_events` table recording who posted what (only once auth is in).

---

## Running Locally

### Backend

```bash
cd backend
cp .env.example .env
# edit DB_* as needed
npm install
npm run db:migrate
npm run dev
```

Seed from the workbook:

```bash
npm run import:excel
# or explicitly:
node src/importers/excelImporter.js "C:/Users/Smart.David/Downloads/INTERPLUMB INVENTORY.xlsx"
```

### Frontend

```bash
cd frontend
cp .env.local.example .env.local
npm install
npm run dev
```

Open http://localhost:3000. The Next.js app proxies `/api/*` to the Express
backend on `http://localhost:4000`.

---

## API Reference (summary)

CRUD (all support `?page=&pageSize=&search=` where applicable):

- `GET/POST/PUT/DELETE /api/items`
- `GET/POST/PUT/DELETE /api/warehouses`
- `GET/POST/PUT/DELETE /api/suppliers`
- `GET/POST/PUT/DELETE /api/projects`
- `GET/POST/PUT/DELETE /api/opening-stock`
- `GET/POST/PUT/DELETE /api/receipts`
- `GET/POST/PUT/DELETE /api/issued`
- `GET/POST/PUT/DELETE /api/transfers`
- `GET/POST/PUT/DELETE /api/adjustments`

Stock & reports:

- `GET /api/stock/availability?search=&warehouseId=&lowStockOnly=true`
- `GET /api/stock/dashboard`
- `GET /api/reports/weekly?from=&to=&projectId=&warehouseId=`
- `GET /api/reports/monthly?year=&projectId=&warehouseId=`
- `GET /api/reports/trends?from=&to=`
