const express = require('express');
const router = express.Router();
const hotelController = require('../controllers/hotelController');

// CRUD Routes for hotels
router.get('/', hotelController.getAllHotels);
router.get('/:id', hotelController.getHotelById);
router.post('/', hotelController.createHotel);
router.put('/:id', hotelController.updateHotel);
router.delete('/:id', hotelController.deleteHotel);

module.exports = router;