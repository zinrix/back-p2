const express = require('express');
const router = express.Router();
const clienteController = require('../controllers/clienteController');

// Routes for customers
router.get('/', clienteController.getAllClientes);
router.get('/:id', clienteController.getClienteById);
router.get('/cedula/:cedula', clienteController.getClienteByCedula);
router.post('/', clienteController.createCliente);

module.exports = router;