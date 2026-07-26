const prisma = require('../utils/prisma');
const { hashPassword, comparePassword } = require('../utils/hashPassword');

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
        is_active: true,
        created_at: true,
        branch: {
          select: { id: true, name: true }
        }
      },
      orderBy: { created_at: 'desc' }
    });
    
    return res.json(users);
  } catch (err) {
    console.error('Error fetching users:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}

async function createUser(req, res) {
  try {
    const { name, phone, password, role, branch_id } = req.body;
    if (!name || !phone || !password || !role) {
      return res.status(400).json({ error: 'Missing required fields.' });
    }

    const existingUser = await prisma.user.findUnique({ where: { phone } });
    if (existingUser) {
      return res.status(400).json({ error: 'User with this phone number already exists.' });
    }

    const password_hash = await hashPassword(password);
    
    const newUser = await prisma.user.create({
      data: {
        name,
        phone,
        password_hash,
        role,
        branch_id: branch_id ? parseInt(branch_id) : null,
      },
      select: { id: true, name: true, phone: true, role: true, is_active: true }
    });

    return res.status(201).json({ message: 'User created successfully.', user: newUser });
  } catch (err) {
    console.error('Error creating user:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}

async function deactivateUser(req, res) {
  try {
    const targetUserId = parseInt(req.params.id);
    const requesterId = req.user.id;

    if (targetUserId === requesterId) {
      return res.status(400).json({ error: 'You cannot deactivate your own account.' });
    }

    const targetUser = await prisma.user.findUnique({ where: { id: targetUserId } });
    if (!targetUser) return res.status(404).json({ error: 'User not found.' });

    if (targetUser.role === 'ADMIN') {
      const activeAdminsCount = await prisma.user.count({
        where: { role: 'ADMIN', is_active: true }
      });
      if (activeAdminsCount <= 1 && targetUser.is_active) {
        return res.status(400).json({ error: 'Cannot deactivate the last active ADMIN.' });
      }
    }

    await prisma.user.update({
      where: { id: targetUserId },
      data: { is_active: false }
    });

    return res.json({ message: 'User deactivated successfully.' });
  } catch (err) {
    console.error('Error deactivating user:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}

async function reactivateUser(req, res) {
  try {
    const targetUserId = parseInt(req.params.id);
    await prisma.user.update({
      where: { id: targetUserId },
      data: { is_active: true }
    });
    return res.json({ message: 'User reactivated successfully.' });
  } catch (err) {
    console.error('Error reactivating user:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}

async function changePassword(req, res) {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current password and new password are required.' });
    }

    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    const isMatch = await comparePassword(currentPassword, user.password_hash);
    
    if (!isMatch) {
      return res.status(400).json({ error: 'Incorrect current password.' });
    }

    const newPasswordHash = await hashPassword(newPassword);
    
    await prisma.user.update({
      where: { id: user.id },
      data: { password_hash: newPasswordHash }
    });

    return res.json({ message: 'Password changed successfully.' });
  } catch (err) {
    console.error('Error changing password:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}

async function resetPassword(req, res) {
  try {
    const targetUserId = parseInt(req.params.id);
    const { newPassword } = req.body;

    if (!newPassword) {
      return res.status(400).json({ error: 'New password is required.' });
    }

    const newPasswordHash = await hashPassword(newPassword);
    
    await prisma.user.update({
      where: { id: targetUserId },
      data: { password_hash: newPasswordHash }
    });

    return res.json({ message: 'Password reset successfully.' });
  } catch (err) {
    console.error('Error resetting password:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}

module.exports = { 
  getUsers, 
  createUser, 
  deactivateUser, 
  reactivateUser, 
  changePassword, 
  resetPassword 
};
