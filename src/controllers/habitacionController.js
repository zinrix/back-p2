const { Habitacion, Hotel } = require('../models');

// Log interactions
const logInteraction = (method, message) => {
  console.log(`[${new Date().toISOString()}] [Habitacion] [${method}] ${message}`);
};

// Get all rooms
const getAllHabitaciones = async (req, res) => {
  try {
    const { hotelId } = req.query;
    let query = {};
    
    if (hotelId) {
      query = { where: { hotelId } };
      logInteraction('GET', `Getting all rooms for hotel with ID: ${hotelId}`);
    } else {
      logInteraction('GET', 'Getting all rooms');
    }
    
    const habitaciones = await Habitacion.findAll({
      ...query,
      include: [{ model: Hotel, attributes: ['nombre', 'direccion'] }]
    });
    
    res.status(200).json(habitaciones);
  } catch (error) {
    logInteraction('GET', `Error: ${error.message}`);
    res.status(500).json({ message: error.message });
  }
};

// Get room by ID
const getHabitacionById = async (req, res) => {
  try {
    const { id } = req.params;
    logInteraction('GET', `Getting room with ID: ${id}`);
    
    const habitacion = await Habitacion.findByPk(id, {
      include: [{ model: Hotel, attributes: ['nombre', 'direccion'] }]
    });
    
    if (!habitacion) {
      logInteraction('GET', `Room not found with ID: ${id}`);
      return res.status(404).json({ message: 'Room not found' });
    }
    
    res.status(200).json(habitacion);
  } catch (error) {
    logInteraction('GET', `Error: ${error.message}`);
    res.status(500).json({ message: error.message });
  }
};

// Create a new room
const createHabitacion = async (req, res) => {
  try {
    const { numero, hotelId, posicionX, posicionY, piso, capacidad, caracteristicas } = req.body;
    logInteraction('POST', `Creating room: ${numero} for hotel: ${hotelId}`);
    
    // Validate required fields
    if (!numero || !hotelId || posicionX === undefined || posicionY === undefined || !piso || !capacidad) {
      logInteraction('POST', 'Missing required fields');
      return res.status(400).json({ message: 'Missing required fields' });
    }
    
    // Check if hotel exists
    const hotel = await Hotel.findByPk(hotelId);
    if (!hotel) {
      logInteraction('POST', `Hotel not found with ID: ${hotelId}`);
      return res.status(404).json({ message: 'Hotel not found' });
    }
    
    const newHabitacion = await Habitacion.create({
      numero,
      hotelId,
      posicionX,
      posicionY,
      piso,
      capacidad,
      caracteristicas: caracteristicas || ''
    });
    
    logInteraction('POST', `Room created with ID: ${newHabitacion.id}`);
    res.status(201).json(newHabitacion);
  } catch (error) {
    logInteraction('POST', `Error: ${error.message}`);
    res.status(500).json({ message: error.message });
  }
};

// Update room
const updateHabitacion = async (req, res) => {
  try {
    const { id } = req.params;
    const { numero, hotelId, posicionX, posicionY, piso, capacidad, caracteristicas } = req.body;
    
    logInteraction('PUT', `Updating room with ID: ${id}`);
    
    const habitacion = await Habitacion.findByPk(id);
    if (!habitacion) {
      logInteraction('PUT', `Room not found with ID: ${id}`);
      return res.status(404).json({ message: 'Room not found' });
    }
    
    // If hotel ID is provided, check if it exists
    if (hotelId) {
      const hotel = await Hotel.findByPk(hotelId);
      if (!hotel) {
        logInteraction('PUT', `Hotel not found with ID: ${hotelId}`);
        return res.status(404).json({ message: 'Hotel not found' });
      }
    }
    
    await habitacion.update({
      numero: numero || habitacion.numero,
      hotelId: hotelId || habitacion.hotelId,
      posicionX: posicionX !== undefined ? posicionX : habitacion.posicionX,
      posicionY: posicionY !== undefined ? posicionY : habitacion.posicionY,
      piso: piso || habitacion.piso,
      capacidad: capacidad !== undefined ? capacidad : habitacion.capacidad,
      caracteristicas: caracteristicas !== undefined ? caracteristicas : habitacion.caracteristicas
    });
    
    logInteraction('PUT', `Room updated with ID: ${id}`);
    res.status(200).json(habitacion);
  } catch (error) {
    logInteraction('PUT', `Error: ${error.message}`);
    res.status(500).json({ message: error.message });
  }
};

// Delete room
const deleteHabitacion = async (req, res) => {
  try {
    const { id } = req.params;
    
    logInteraction('DELETE', `Deleting room with ID: ${id}`);
    
    const habitacion = await Habitacion.findByPk(id);
    if (!habitacion) {
      logInteraction('DELETE', `Room not found with ID: ${id}`);
      return res.status(404).json({ message: 'Room not found' });
    }
    
    await habitacion.destroy();
    
    logInteraction('DELETE', `Room deleted with ID: ${id}`);
    res.status(200).json({ message: 'Room deleted successfully' });
  } catch (error) {
    logInteraction('DELETE', `Error: ${error.message}`);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getAllHabitaciones,
  getHabitacionById,
  createHabitacion,
  updateHabitacion,
  deleteHabitacion
};