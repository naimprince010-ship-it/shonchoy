const prisma = require('../utils/prisma');

async function getGroups(req, res) {
  try {
    const groups = await prisma.group.findMany({
      include: {
        center: true,
        clients: true,
      },
    });
    return res.json(groups);
  } catch (err) {
    console.error('Error fetching groups:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}

async function createGroup(req, res) {
  try {
    const { name, center_id } = req.body;
    
    if (!name || !center_id) {
      return res.status(400).json({ error: 'Name and center_id are required.' });
    }

    // Validate center exists
    const center = await prisma.center.findUnique({ where: { id: parseInt(center_id, 10) } });
    if (!center) {
      return res.status(400).json({ error: 'Center does not exist.' });
    }

    const group = await prisma.group.create({
      data: {
        name,
        center_id: parseInt(center_id, 10),
      },
    });
    return res.status(201).json(group);
  } catch (err) {
    console.error('Error creating group:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}

module.exports = { getGroups, createGroup };
