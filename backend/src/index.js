process.env.TZ = 'Asia/Dhaka';
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/authRoutes');
const branchRoutes = require('./routes/branchRoutes');
const centerRoutes = require('./routes/centerRoutes');
const groupRoutes = require('./routes/groupRoutes');
const clientRoutes = require('./routes/clientRoutes');
const savingsRoutes = require('./routes/savingsRoutes');
const loanRoutes = require('./routes/loanRoutes');
const loanProductRoutes = require('./routes/loanProductRoutes');
const reportRoutes = require('./routes/reportRoutes');
const settingRoutes = require('./routes/settingRoutes');
const smsRoutes = require('./routes/smsRoutes');
const userRoutes = require('./routes/userRoutes');
const { authMiddleware } = require('./middleware/authMiddleware');
const { initCronJobs } = require('./jobs/cronJobs');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'https://mfi.loopwren.com']
}));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/branches', authMiddleware, branchRoutes);
app.use('/api/centers', authMiddleware, centerRoutes);
app.use('/api/groups', authMiddleware, groupRoutes);
app.use('/api/clients', authMiddleware, clientRoutes);
app.use('/api/savings', authMiddleware, savingsRoutes);
app.use('/api/loans', authMiddleware, loanRoutes);
app.use('/api/loan-products', authMiddleware, loanProductRoutes);
app.use('/api/reports', authMiddleware, reportRoutes);
app.use('/api/users', authMiddleware, userRoutes);
app.use('/api/settings', settingRoutes);
app.use('/api/sms', smsRoutes);
// Health check
app.get('/', (req, res) => {
  res.json({ message: 'MFI API MVP is running!' });
});
// Initialize Cron Jobs
initCronJobs();

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
