require('dotenv').config();
require('express-async-errors');

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const { sequelize, User } = require('./models');
const routes = require('./routes');
const errorHandler = require('./middleware/errorHandler');
const { migrate } = require('./migrator');
const { hashPassword } = require('./utils/auth');

const app = express();
app.use(helmet());
app.use(cors({ origin: (process.env.CORS_ORIGIN || '*').split(',') }));
app.use(express.json({ limit: '5mb' }));
app.use(morgan('dev'));

app.get('/health', (_req, res) => res.json({ ok: true, service: 'interplumb-inventory' }));
app.use('/api', routes);
app.use(errorHandler);

const port = Number(process.env.PORT) || 4000;
const autoMigrate = (process.env.AUTO_MIGRATE ?? 'true').toLowerCase() !== 'false';

async function bootstrapAdmin() {
  const adminCount = await User.count({ where: { role: 'admin' } });
  if (adminCount > 0) return;
  const email = (process.env.ADMIN_EMAIL || 'admin@interplumb.local').toLowerCase();
  const name = process.env.ADMIN_NAME || 'System Administrator';
  const password = process.env.ADMIN_PASSWORD || 'ChangeMe123!';
  const password_hash = await hashPassword(password);
  await User.create({ email, name, password_hash, role: 'admin' });
  console.log('─'.repeat(70));
  console.log('[bootstrap] No admin found — created default admin account.');
  console.log(`[bootstrap]   Email:    ${email}`);
  console.log(`[bootstrap]   Password: ${process.env.ADMIN_PASSWORD ? '(from ADMIN_PASSWORD env)' : password}`);
  console.log('[bootstrap]   >>> CHANGE THIS PASSWORD IMMEDIATELY. <<<');
  console.log('─'.repeat(70));
}

async function start() {
  try {
    await sequelize.authenticate();
    if (autoMigrate) {
      await migrate();
    } else {
      console.log('[migrate] AUTO_MIGRATE=false — skipping automatic migrations');
    }
    await bootstrapAdmin();
    app.listen(port, () => console.log(`API listening on http://localhost:${port}`));
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

if (require.main === module) start();

module.exports = { app };
