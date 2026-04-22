const express = require('express');
const multer = require('multer');
const validate = require('../middleware/validate');
const { requireAuth, requireRole } = require('../middleware/auth');
const { auditMiddleware } = require('../middleware/audit');
const schemas = require('./schemas');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB
});

const items = require('../controllers/items');
const warehouses = require('../controllers/warehouses');
const suppliers = require('../controllers/suppliers');
const projects = require('../controllers/projects');
const openingStock = require('../controllers/openingStock');
const receipts = require('../controllers/receipts');
const issued = require('../controllers/issued');
const transfers = require('../controllers/transfers');
const adjustments = require('../controllers/adjustments');
const stock = require('../controllers/stock');
const reports = require('../controllers/reports');
const uploads = require('../controllers/uploads');
const auth = require('../controllers/auth');
const auditLogs = require('../controllers/auditLogs');

/**
 * Mount standard CRUD with role-based protection.
 *  - list/get: any authenticated user
 *  - create/update/delete: requires the `writeRoles` set (default: both roles)
 */
function mountCrud(
  router,
  path,
  controller,
  schema,
  { writeRoles = ['user', 'admin'] } = {}
) {
  const r = express.Router();
  r.get('/', controller.list);
  r.get('/:id', controller.get);
  r.post(
    '/',
    requireRole(...writeRoles),
    schema ? validate(schema) : (req, _res, next) => next(),
    controller.create
  );
  r.put('/:id', requireRole(...writeRoles), controller.update);
  r.delete('/:id', requireRole(...writeRoles), controller.remove);
  router.use(path, r);
}

const router = express.Router();

// ---------- Public (no auth) ----------
router.post('/auth/login', validate(schemas.login), auth.login);
router.post('/auth/forgot-password', validate(schemas.forgotPassword), auth.forgotPassword);
router.post('/auth/reset-password', validate(schemas.resetPassword), auth.resetPassword);

// ---------- Authenticated ----------
router.use(requireAuth);
router.use(auditMiddleware);

router.get('/auth/me', auth.me);

// Transactional records (both roles can write)
mountCrud(router, '/opening-stock', openingStock, schemas.openingStock);
mountCrud(router, '/receipts', receipts, schemas.receipt);
mountCrud(router, '/issued', issued, schemas.issued);
mountCrud(router, '/transfers', transfers, schemas.transfer);
mountCrud(router, '/adjustments', adjustments, schemas.adjustment);

// Master data — admin-only writes
mountCrud(router, '/items', items, schemas.item, { writeRoles: ['admin'] });
mountCrud(router, '/warehouses', warehouses, schemas.warehouse, { writeRoles: ['admin'] });
mountCrud(router, '/suppliers', suppliers, schemas.supplier, { writeRoles: ['admin'] });
mountCrud(router, '/projects', projects, schemas.project, { writeRoles: ['admin'] });

// Read-only analytics
router.get('/stock/availability', stock.availability);
router.get('/stock/dashboard', stock.dashboard);
router.get('/reports/weekly', reports.weekly);
router.get('/reports/monthly', reports.monthly);
router.get('/reports/trends', reports.trends);

// ---------- Admin-only ----------
router.post('/uploads/excel', requireRole('admin'), upload.single('file'), uploads.uploadExcel);
router.get('/uploads/batches', requireRole('admin'), uploads.listBatches);
router.post('/uploads/batches/:id/revert', requireRole('admin'), uploads.revertBatch);

router.get('/audit-logs', requireRole('admin'), auditLogs.list);

// User admin
router.get('/users', requireRole('admin'), auth.listUsers);
router.post('/users', requireRole('admin'), validate(schemas.user), auth.createUser);
router.put('/users/:id', requireRole('admin'), validate(schemas.userPatch), auth.updateUser);
router.delete('/users/:id', requireRole('admin'), auth.deleteUser);

module.exports = router;
