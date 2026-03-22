// Allowed roles per action — used across all route files
const ROLES = {
  SUPERADMIN:    'SuperAdmin',
  ADMIN:         'Admin',
  DOCTOR:        'Doctor',
  PHARMACIST:    'Pharmacist',
  NURSE:         'Nurse',
  STUDENT:       'Student',
  FACULTY:       'Faculty',
  STAFF:         'Staff',
  TECHNICIAN:    'Technician',
  SUPPORT_STAFF: 'Support Staff',
};

// Helper: check if req.user has at least one of the required roles
function hasRole(user, ...roles) {
  return user.roles.some(r => roles.includes(r));
}

// Middleware factory: require one of the given roles
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    if (!hasRole(req.user, ...roles)) {
      return res.status(403).json({
        error: 'Access denied',
        required: roles,
        yours: req.user.roles,
      });
    }
    next();
  };
}

// Middleware: SuperAdmin or Admin only
const adminOnly = requireRole(ROLES.SUPERADMIN, ROLES.ADMIN);

// Middleware: Any clinical role
const clinicalStaff = requireRole(
  ROLES.SUPERADMIN, ROLES.ADMIN,
  ROLES.DOCTOR, ROLES.NURSE, ROLES.PHARMACIST
);

// Middleware: Any authenticated user (just needs valid JWT)
const anyAuthenticated = (req, res, next) => {
  if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
  next();
};

module.exports = { requireRole, adminOnly, clinicalStaff, anyAuthenticated, hasRole, ROLES };
