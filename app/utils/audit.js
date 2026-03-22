const fs   = require('fs');
const path = require('path');

const LOG_PATH = path.join(__dirname, '..', 'audit.log');

/**
 * Append one audit entry to audit.log as a single JSON line.
 *
 * @param {object} opts
 * @param {object} opts.user      - req.user from JWT { userLoginID, username, roles, entityType }
 * @param {string} opts.action    - 'CREATE' | 'UPDATE' | 'DELETE'
 * @param {string} opts.table     - DB table name e.g. 'Member'
 * @param {number|null} opts.recordID  - PK of the affected row
 * @param {object} [opts.changes] - req.body or diff object
 * @param {string} [opts.ip]      - req.ip
 * @param {string} [opts.note]    - any extra context
 */
function logAudit({ user, action, table, recordID, changes = {}, ip = '', note = '' }) {
  const entry = {
    timestamp:   new Date().toISOString(),
    source:      'API',                        // always API when going through our server
    userLoginID: user?.userLoginID ?? null,
    username:    user?.username    ?? 'unknown',
    roles:       user?.roles       ?? [],
    entityType:  user?.entityType  ?? null,
    action,                                    // CREATE | UPDATE | DELETE
    table,
    recordID:    recordID ?? null,
    changes:     sanitise(changes),            // strip passwords before logging
    ip,
    note,
  };

  const line = JSON.stringify(entry) + '\n';

  // Append synchronously so nothing is lost on crash
  try {
    fs.appendFileSync(LOG_PATH, line, 'utf8');
  } catch (err) {
    // Never let a logging failure crash the API
    console.error('[audit] Failed to write log entry:', err.message);
  }
}

// Remove sensitive fields before logging
function sanitise(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  const REDACTED = ['password', 'newPassword', 'currentPassword', 'PasswordHash'];
  const clean = { ...obj };
  for (const key of REDACTED) {
    if (key in clean) clean[key] = '[REDACTED]';
  }
  return clean;
}

module.exports = { logAudit };
