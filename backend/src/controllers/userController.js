const prisma = require('../utils/prisma');

async function getUsers(req, res) {
  try {
    const { role } = req.query;
    let whereClause = {};
    if (role) {
      whereClause.role = role;
    }
    
    const users = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        phone: true,
        name: true,
        role: true,
        status: true,
        created_at: true,
      }
    });
    
    return res.json(users);
  } catch (err) {
    console.error('Error fetching users:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}

module.exports = { getUsers };
