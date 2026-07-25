const prisma = require('../utils/prisma');

async function getBranches(req, res) {
  try {
    const branches = await prisma.branch.findMany({
      include: {
        centers: true,
      },
    });
    return res.json(branches);
  } catch (err) {
    console.error('Error fetching branches:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}

async function createBranch(req, res) {
  try {
    const { name, address } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Branch name is required.' });
    }
    const branch = await prisma.branch.create({
      data: { name, address },
    });
    return res.status(201).json(branch);
  } catch (err) {
    console.error('Error creating branch:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}

module.exports = { getBranches, createBranch };
