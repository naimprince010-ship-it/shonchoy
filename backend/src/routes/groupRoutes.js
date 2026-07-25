const express = require('express');
const router = express.Router();
const { getGroups, createGroup } = require('../controllers/groupController');

router.get('/', getGroups);
router.post('/', createGroup);

module.exports = router;
