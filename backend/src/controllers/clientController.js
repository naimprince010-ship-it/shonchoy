const prisma = require('../utils/prisma');

async function getClients(req, res) {
  try {
    const { group_id, center_id } = req.query;
    
    let whereClause = {};
    if (group_id) {
      whereClause.group_id = parseInt(group_id, 10);
    }
    // Note: To filter by center, we'd need to join via group, prisma handles this with `group: { center_id }`
    if (center_id) {
      whereClause.group = {
        center_id: parseInt(center_id, 10),
      };
    }

    const clients = await prisma.client.findMany({
      where: whereClause,
      include: {
        group: true,
      },
    });
    return res.json(clients);
  } catch (err) {
    console.error('Error fetching clients:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}

async function getClientById(req, res) {
  try {
    const { id } = req.params;
    const client = await prisma.client.findUnique({
      where: { id: parseInt(id, 10) },
      include: {
        group: true,
        savings_account: true,
        loans: true,
      }
    });

    if (!client) {
      return res.status(404).json({ error: 'Client not found.' });
    }
    return res.json(client);
  } catch (err) {
    console.error('Error fetching client by id:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}

async function createClient(req, res) {
  try {
    const { name, nid_number, phone, address, photo_url, guardian_name, group_id } = req.body;
    
    if (!name || !nid_number || !phone || !address || !guardian_name || !group_id) {
      return res.status(400).json({ error: 'Required fields: name, nid_number, phone, address, guardian_name, group_id.' });
    }

    // Validate group exists
    const group = await prisma.group.findUnique({ where: { id: parseInt(group_id, 10) } });
    if (!group) {
      return res.status(400).json({ error: 'Group does not exist.' });
    }

    // Check unique constraints
    const existingClient = await prisma.client.findFirst({
      where: {
        OR: [
          { nid_number }
        ]
      }
    });

    if (existingClient) {
      return res.status(400).json({ error: 'Client with this NID already exists.' });
    }

    const client = await prisma.client.create({
      data: {
        name,
        nid_number,
        phone,
        address,
        photo_url,
        guardian_name,
        group_id: parseInt(group_id, 10),
        savings_account: {
          create: {
            account_type: 'COMPULSORY',
            balance: 0.0,
          }
        }
      },
      include: {
        savings_account: true,
      }
    });
    return res.status(201).json(client);
  } catch (err) {
    console.error('Error creating client:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}

async function updateClient(req, res) {
  try {
    const { id } = req.params;
    const { name, nid_number, phone, address, photo_url, guardian_name, group_id, status } = req.body;
    
    // Check if client exists
    const existingClient = await prisma.client.findUnique({ where: { id: parseInt(id, 10) } });
    if (!existingClient) {
      return res.status(404).json({ error: 'Client not found.' });
    }

    if (group_id) {
      const group = await prisma.group.findUnique({ where: { id: parseInt(group_id, 10) } });
      if (!group) {
        return res.status(400).json({ error: 'Group does not exist.' });
      }
    }

    if (nid_number && nid_number !== existingClient.nid_number) {
      const duplicateNid = await prisma.client.findUnique({ where: { nid_number } });
      if (duplicateNid) {
        return res.status(400).json({ error: 'Client with this NID already exists.' });
      }
    }

    const client = await prisma.client.update({
      where: { id: parseInt(id, 10) },
      data: {
        name: name !== undefined ? name : undefined,
        nid_number: nid_number !== undefined ? nid_number : undefined,
        phone: phone !== undefined ? phone : undefined,
        address: address !== undefined ? address : undefined,
        photo_url: photo_url !== undefined ? photo_url : undefined,
        guardian_name: guardian_name !== undefined ? guardian_name : undefined,
        group_id: group_id !== undefined ? parseInt(group_id, 10) : undefined,
        status: status !== undefined ? status : undefined,
      },
    });

    return res.json(client);
  } catch (err) {
    console.error('Error updating client:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}

module.exports = { getClients, getClientById, createClient, updateClient };
