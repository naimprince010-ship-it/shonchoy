const prisma = require('../utils/prisma');
const { logActivity } = require('../utils/auditLogger');

async function getCenters(req, res) {
  try {
    const centers = await prisma.center.findMany({
      include: {
        branch: true,
        field_officer: true,
        groups: true,
      },
    });
    return res.json(centers);
  } catch (err) {
    console.error('Error fetching centers:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}

async function createCenter(req, res) {
  try {
    const { name, branch_id, field_officer_id, meeting_day } = req.body;
    
    if (!name || !branch_id || !meeting_day) {
      return res.status(400).json({ error: 'Name, branch_id, and meeting_day are required.' });
    }

    // Validate branch exists
    const branch = await prisma.branch.findUnique({ where: { id: parseInt(branch_id, 10) } });
    if (!branch) {
      return res.status(400).json({ error: 'Branch does not exist.' });
    }

    const center = await prisma.center.create({
      data: {
        name,
        branch_id: parseInt(branch_id, 10),
        field_officer_id: field_officer_id ? parseInt(field_officer_id, 10) : null,
        meeting_day,
      },
    });

    await logActivity({
      userId: req.user.id,
      userName: req.user.name,
      action: 'CENTER_CREATED',
      entity: 'Center',
      entityId: center.id,
      details: { name, branch_id: parseInt(branch_id, 10) }
    });

    return res.status(201).json(center);
  } catch (err) {
    console.error('Error creating center:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}

module.exports = { getCenters, createCenter };
