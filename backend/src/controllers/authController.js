const jwt = require('jsonwebtoken');
const prisma = require('../utils/prisma');
const { comparePassword } = require('../utils/hashPassword');

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = '7d';

/**
 * POST /api/auth/login
 * Body: { phone, password } or { email, password }
 * Returns: { token, user: { id, name, phone, email, role } }
 */
async function login(req, res) {
  try {
    const { phone, email, password } = req.body;

    // Validate input
    if (!password || (!phone && !email)) {
      return res.status(400).json({
        error: 'phone (or email) and password are required.',
      });
    }

    // Find user by phone or email
    const user = await prisma.user.findFirst({
      where: phone ? { phone } : { email },
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    // Compare password
    const isMatch = await comparePassword(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    // Generate JWT
    const token = jwt.sign(
      { id: user.id, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    return res.json({
      message: 'Login successful.',
      token,
      user: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}

module.exports = { login };
