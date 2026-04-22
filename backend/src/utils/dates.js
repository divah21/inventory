// Week ending logic: we treat weeks as ending on Sunday (ISO-style), matching
// the "WEEK ENDING" convention used in the source Excel workbook.

function toDate(value) {
  if (!value) return null;
  if (value instanceof Date) return value;
  return new Date(value);
}

function weekEnding(date) {
  const d = toDate(date);
  if (!d) return null;
  const day = d.getUTCDay(); // 0 Sun .. 6 Sat
  const offset = (7 - day) % 7; // days to add to reach Sunday
  const we = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + offset));
  return we.toISOString().slice(0, 10);
}

function monthKey(date) {
  const d = toDate(date);
  if (!d) return null;
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

function isoDate(date) {
  const d = toDate(date);
  return d ? d.toISOString().slice(0, 10) : null;
}

module.exports = { weekEnding, monthKey, isoDate, toDate };
