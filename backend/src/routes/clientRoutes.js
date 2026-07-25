const express = require('express');
const router = express.Router();
const { getClients, getClientById, createClient, updateClient } = require('../controllers/clientController');

router.get('/', getClients);
router.post('/', createClient);
router.get('/:id', getClientById);
router.put('/:id', updateClient);

module.exports = router;
