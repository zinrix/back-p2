const express = require('express');
const router = express.Router();
const reservaController = require('../controllers/reservaController');

// Routes for reservations
router.get('/', reservaController.getAllReservas);
router.get('/available', reservaController.findAvailableRooms);
router.get('/:id', reservaController.getReservaById);
router.post('/', reservaController.createReserva);

module.exports = router;