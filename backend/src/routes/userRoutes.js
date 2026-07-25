const express = require('express');
const { getUsers } = require('../controllers/userController');
const { authMiddleware, roleMiddleware } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', authMiddleware, roleMiddleware('ADMIN', 'BRANCH_MANAGER'), getUsers);

module.exports = router;
