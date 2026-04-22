const crypto = require('crypto');
const { importFromBuffer } = require('../importers/excelImporter');
const {
  sequelize,
  UploadBatch,
  OpeningStock,
  StockReceipt,
  IssuedMaterial,
  PriceListEntry,
  User,
} = require('../models');
const { badRequest, HttpError } = require('../utils/errors');

function sha256(buf) {
  return crypto.createHash('sha256').update(buf).digest('hex');
}

async function uploadExcel(req, res) {
  if (!req.file) throw badRequest('No file uploaded. Use field name "file".');
  const name = (req.file.originalname || '').toLowerCase();
  if (!name.endsWith('.xlsx') && !name.endsWith('.xlsm')) {
    throw badRequest('Only .xlsx or .xlsm files are accepted.');
  }

  const file_hash = sha256(req.file.buffer);

  // Warn (not block) on duplicate file. Clients may pass `?force=true` to proceed.
  const dup = await UploadBatch.findOne({
    where: { file_hash, status: 'completed' },
    order: [['id', 'DESC']],
  });
  if (dup && req.query.force !== 'true') {
    return res.status(409).json({
      error: 'This file has already been imported.',
      details: { existing_batch_id: dup.id, filename: dup.filename, created_at: dup.created_at },
      hint: 'Pass ?force=true to import it again.',
    });
  }

  // Create batch first so we can tag inserted rows
  const batch = await UploadBatch.create({
    user_id: req.user?.id || null,
    filename: req.file.originalname,
    size_bytes: req.file.size,
    file_hash,
    status: 'completed',
  });

  try {
    const summary = await importFromBuffer(req.file.buffer, { batchId: batch.id });
    await batch.update({ summary });
    res.json({
      ok: true,
      batch_id: batch.id,
      filename: req.file.originalname,
      size_bytes: req.file.size,
      imported: summary,
    });
  } catch (err) {
    await batch.update({ status: 'failed' });
    throw err;
  }
}

async function listBatches(req, res) {
  const { page = 1, pageSize = 25 } = req.query;
  const limit = Math.min(Number(pageSize) || 25, 200);
  const offset = (Math.max(Number(page) || 1, 1) - 1) * limit;
  const { rows, count } = await UploadBatch.findAndCountAll({
    include: [
      { model: User, as: 'uploader', attributes: ['id', 'email', 'name'] },
      { model: User, as: 'reverter', attributes: ['id', 'email', 'name'] },
    ],
    order: [['id', 'DESC']],
    limit,
    offset,
  });
  res.json({ data: rows, total: count, page: Number(page) || 1, pageSize: limit });
}

/**
 * Delete every transactional row tagged with this batch. Master data
 * (items, warehouses, suppliers, projects) is intentionally left in place
 * because it may be referenced by rows from other batches or manual entries.
 */
async function revertBatch(req, res) {
  const batch = await UploadBatch.findByPk(req.params.id);
  if (!batch) throw new HttpError(404, 'Upload batch not found');
  if (batch.status === 'reverted') {
    throw badRequest('This batch has already been reverted.');
  }
  if (batch.status === 'failed') {
    throw badRequest('This batch failed during import — nothing to revert.');
  }

  const result = await sequelize.transaction(async (t) => {
    const [opening, receipts, issued, price] = await Promise.all([
      OpeningStock.destroy({ where: { upload_batch_id: batch.id }, transaction: t }),
      StockReceipt.destroy({ where: { upload_batch_id: batch.id }, transaction: t }),
      IssuedMaterial.destroy({ where: { upload_batch_id: batch.id }, transaction: t }),
      PriceListEntry.destroy({ where: { upload_batch_id: batch.id }, transaction: t }),
    ]);
    await batch.update(
      { status: 'reverted', reverted_at: new Date(), reverted_by: req.user?.id || null },
      { transaction: t }
    );
    return { opening, receipts, issued, price };
  });

  res.json({
    ok: true,
    batch_id: batch.id,
    reverted: result,
  });
}

module.exports = { uploadExcel, listBatches, revertBatch };
