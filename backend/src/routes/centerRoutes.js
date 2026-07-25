const express = require('express');
const router = express.Router();
const { getCenters, createCenter } = require('../controllers/centerController');

router.get('/', getCenters);
router.post('/', createCenter);

module.exports = router;
