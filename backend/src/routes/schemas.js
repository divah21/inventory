const Joi = require('joi');

const id = Joi.number().integer().positive();
const qty = Joi.number().greater(0);
const date = Joi.date().iso();

const item = Joi.object({
  code: Joi.string().max(64).required(),
  description: Joi.string().required(),
  unit: Joi.string().max(32).default('pcs'),
  category: Joi.string().allow('', null),
  reorder_level: Joi.number().min(0).default(0),
  unit_price: Joi.number().min(0).allow(null),
  currency: Joi.string().max(8).allow(null),
  is_active: Joi.boolean().default(true),
});

const warehouse = Joi.object({
  name: Joi.string().max(128).required(),
  code: Joi.string().max(64).allow('', null),
  location: Joi.string().max(255).allow('', null),
  is_active: Joi.boolean().default(true),
});

const supplier = Joi.object({
  name: Joi.string().max(255).required(),
  contact_person: Joi.string().allow('', null),
  phone: Joi.string().allow('', null),
  email: Joi.string().email().allow('', null),
  address: Joi.string().allow('', null),
  is_active: Joi.boolean().default(true),
});

const project = Joi.object({
  code: Joi.string().trim().uppercase().max(64).allow('', null),
  name: Joi.string().trim().max(255).required(),
  client: Joi.string().allow('', null),
  site_location: Joi.string().allow('', null),
  start_date: date.allow(null),
  end_date: date.allow(null),
  status: Joi.string().valid('active', 'on_hold', 'completed', 'cancelled').default('active'),
});

const openingStock = Joi.object({
  item_id: id.required(),
  warehouse_id: id.required(),
  supplier_id: id.allow(null),
  quantity: qty.required(),
  unit: Joi.string().allow('', null),
  transaction_date: date.required(),
  notes: Joi.string().allow('', null),
});

const receipt = Joi.object({
  item_id: id.required(),
  warehouse_id: id.required(),
  supplier_id: id.allow(null),
  quantity: qty.required(),
  unit: Joi.string().allow('', null),
  invoice_no: Joi.string().allow('', null),
  unit_price: Joi.number().min(0).allow(null),
  currency: Joi.string().max(8).allow(null),
  transaction_date: date.required(),
  notes: Joi.string().allow('', null),
});

const issued = Joi.object({
  item_id: id.required(),
  warehouse_id: id.required(),
  project_id: id.required(),
  quantity: qty.required(),
  unit: Joi.string().allow('', null),
  issued_to: Joi.string().allow('', null),
  transaction_date: date.required(),
  week_ending: date.allow(null),
  notes: Joi.string().allow('', null),
});

const transfer = Joi.object({
  item_id: id.required(),
  from_warehouse_id: id.required(),
  to_warehouse_id: id.required().disallow(Joi.ref('from_warehouse_id')),
  quantity: qty.required(),
  unit: Joi.string().allow('', null),
  transaction_date: date.required(),
  reference_no: Joi.string().allow('', null),
  notes: Joi.string().allow('', null),
});

const adjustment = Joi.object({
  item_id: id.required(),
  warehouse_id: id.required(),
  quantity_delta: Joi.number().required(),
  reason: Joi.string().required(),
  transaction_date: date.required(),
  notes: Joi.string().allow('', null),
});

// tlds:false lets intranet/self-hosted addresses like admin@interplumb.local pass
// — the format is still validated, just not the TLD against ICANN's allowlist.
const email = Joi.string().email({ tlds: false });

const login = Joi.object({
  email: email.required(),
  password: Joi.string().min(1).required(),
});

const forgotPassword = Joi.object({
  email: email.required(),
});

const resetPassword = Joi.object({
  token: Joi.string().min(20).max(256).required(),
  password: Joi.string().min(8).max(128).required(),
});

const user = Joi.object({
  email: email.required(),
  name: Joi.string().min(1).max(255).required(),
  password: Joi.string().min(8).max(128).required(),
  role: Joi.string().valid('user', 'admin').default('user'),
});

const userPatch = Joi.object({
  email: email,
  name: Joi.string().min(1).max(255),
  password: Joi.string().min(8).max(128),
  role: Joi.string().valid('user', 'admin'),
  is_active: Joi.boolean(),
}).min(1);

module.exports = {
  item,
  warehouse,
  supplier,
  project,
  openingStock,
  receipt,
  issued,
  transfer,
  adjustment,
  login,
  forgotPassword,
  resetPassword,
  user,
  userPatch,
};
