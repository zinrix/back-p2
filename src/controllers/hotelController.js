const { Hotel } = require('../models');

// Log interactions
const logInteraction = (method, message) => {
  console.log(`[${new Date().toISOString()}] [Hotel] [${method}] ${message}`);
};

// Get all hotels
const getAllHotels = async (req, res) => {
  try {
    logInteraction('GET', 'Getting all hotels');
    const hotels = await Hotel.findAll();
    res.status(200).json(hotels);
  } catch (error) {
    logInteraction('GET', `Error: ${error.message}`);
    res.status(500).json({ message: error.message });
  }
};

// Get hotel by ID
const getHotelById = async (req, res) => {
  try {
    const { id } = req.params;
    logInteraction('GET', `Getting hotel with ID: ${id}`);
    
    const hotel = await Hotel.findByPk(id);
    if (!hotel) {
      logInteraction('GET', `Hotel not found with ID: ${id}`);
      return res.status(404).json({ message: 'Hotel not found' });
    }
    
    res.status(200).json(hotel);
  } catch (error) {
    logInteraction('GET', `Error: ${error.message}`);
    res.status(500).json({ message: error.message });
  }
};

// Create a new hotel
const createHotel = async (req, res) => {
  try {
    const { nombre, direccion } = req.body;
    logInteraction('POST', `Creating hotel: ${nombre}`);
    
    if (!nombre || !direccion) {
      logInteraction('POST', 'Missing required fields');
      return res.status(400).json({ message: 'Name and address are required' });
    }
    
    const newHotel = await Hotel.create({ nombre, direccion });
    
    logInteraction('POST', `Hotel created with ID: ${newHotel.id}`);
    res.status(201).json(newHotel);
  } catch (error) {
    logInteraction('POST', `Error: ${error.message}`);
    res.status(500).json({ message: error.message });
  }
};

// Update hotel
const updateHotel = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, direccion } = req.body;
    
    logInteraction('PUT', `Updating hotel with ID: ${id}`);
    
    const hotel = await Hotel.findByPk(id);
    if (!hotel) {
      logInteraction('PUT', `Hotel not found with ID: ${id}`);
      return res.status(404).json({ message: 'Hotel not found' });
    }
    
    await hotel.update({ nombre, direccion });
    
    logInteraction('PUT', `Hotel updated with ID: ${id}`);
    res.status(200).json(hotel);
  } catch (error) {
    logInteraction('PUT', `Error: ${error.message}`);
    res.status(500).json({ message: error.message });
  }
};

// Delete hotel
const deleteHotel = async (req, res) => {
  try {
    const { id } = req.params;
    
    logInteraction('DELETE', `Deleting hotel with ID: ${id}`);
    
    const hotel = await Hotel.findByPk(id);
    if (!hotel) {
      logInteraction('DELETE', `Hotel not found with ID: ${id}`);
      return res.status(404).json({ message: 'Hotel not found' });
    }
    
    await hotel.destroy();
    
    logInteraction('DELETE', `Hotel deleted with ID: ${id}`);
    res.status(200).json({ message: 'Hotel deleted successfully' });
  } catch (error) {
    logInteraction('DELETE', `Error: ${error.message}`);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getAllHotels,
  getHotelById,
  createHotel,
  updateHotel,
  deleteHotel
};