// Order id generation, kept in its own module so it can be unit-tested without booting the
// server (server.js validates credentials and calls listen() at module load).
import crypto from 'crypto';

// Order ids must be unique across the whole life of the store. The original scheme used the
// last four digits of Date.now() — a 10,000-value space that recycles every 10 seconds, so two
// orders placed 10s apart produced the same id and the second insert failed on the primary key.
// The timestamp prefix keeps ids roughly sortable; the random suffix supplies the uniqueness.
export function generateOrderId(now = Date.now()) {
  const stamp = now.toString(36).toUpperCase();
  const rand = crypto.randomBytes(4).toString('hex').toUpperCase();
  return `TM-${stamp}-${rand}`;
}

// PostgREST surfaces a Postgres unique_violation as SQLSTATE 23505.
export function isUniqueViolation(err) {
  return String(err && err.message).includes('23505');
}
