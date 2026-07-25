const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/authRoutes');
const branchRoutes = require('./routes/branchRoutes');
const centerRoutes = require('./routes/centerRoutes');
const groupRoutes = require('./routes/groupRoutes');
const clientRoutes = require('./routes/clientRoutes');
const savingsRoutes = require('./routes/savingsRoutes');
const { authMiddleware } = require('./middleware/authMiddleware');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/branches', authMiddleware, branchRoutes);
app.use('/api/centers', authMiddleware, centerRoutes);
app.use('/api/groups', authMiddleware, groupRoutes);
app.use('/api/clients', authMiddleware, clientRoutes);
app.use('/api/savings', authMiddleware, savingsRoutes);

// Health check
app.get('/', (req, res) => {
  res.json({ message: 'MFI API MVP is running!' });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
