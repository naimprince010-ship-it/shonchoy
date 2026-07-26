const prisma = require('../utils/prisma');

async function getAuditLogs(req, res) {
  try {
    const { page = 1, limit = 20, action, entity_type } = req.query;
    
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    
    const where = {};
    if (action) where.action = action;
    if (entity_type) where.entity_type = entity_type;

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { created_at: 'desc' },
        skip: (pageNum - 1) * limitNum,
        take: limitNum
      }),
      prisma.auditLog.count({ where })
    ]);

    return res.json({
      data: logs,
      meta: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  } catch (err) {
    console.error('Error fetching audit logs:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}

module.exports = { getAuditLogs };
