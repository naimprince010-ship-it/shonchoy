const prisma = require('./prisma');

/**
 * Builds a Prisma 'where' clause for role-based access control.
 * @param {number} userId - The user ID from req.user
 * @param {string} userRole - The role from req.user
 * @param {string} entity - The entity we are querying ('client', 'loan', 'schedule', 'repayment')
 * @returns {Promise<Object>} - The where clause to merge into Prisma queries
 */
async function buildRoleFilter(userId, userRole, entity = 'loan') {
  
  if (userRole === 'ADMIN') {
    return {}; // No filter for ADMIN
  }

  const currentUser = await prisma.user.findUnique({ where: { id: userId } });
  
  let centerFilter = {};
  if (userRole === 'FIELD_OFFICER') {
    centerFilter = { field_officer_id: userId };
  } else if (userRole === 'BRANCH_MANAGER') {
    centerFilter = { branch_id: currentUser.branch_id };
  }

  if (entity === 'client') {
    return { group: { center: centerFilter } };
  } else if (entity === 'loan') {
    return { client: { group: { center: centerFilter } } };
  } else if (entity === 'schedule' || entity === 'repayment') {
    return { loan: { client: { group: { center: centerFilter } } } };
  }

  return {};
}

module.exports = { buildRoleFilter };
