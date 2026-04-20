const rolePermissions = {
  superadmin: ['*'],
  admin: ['users.read', 'users.write', 'sites.read', 'sites.write', 'parameters.write', 'assignments.write', 'attendance.read', 'submissions.read', 'submissions.review', 'dashboard.read', 'reports.read'],
  employee: ['attendance.mark', 'attendance.read.self', 'submissions.write', 'submissions.read.self', 'sites.read.self']
}

function hasPermission (role, permission) {
  const permissions = rolePermissions[role] || []
  return permissions.includes('*') || permissions.includes(permission)
}

module.exports = { rolePermissions, hasPermission }
