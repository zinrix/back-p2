const { Hotel } = require('../models');


const logInteraction = (method, message) => {
  console.log(`[${new Date().toISOString()}] [Hotel] [${method}] ${message}`);
};


const getAllHotels = async (req, res) => {
  try {
    logInteraction('GET', 'Obteniendo todos los hoteles');
    const hotels = await Hotel.findAll();
    res.status(200).json(hotels);
  } catch (error) {
    logInteraction('GET', `Error: ${error.message}`);
    res.status(500).json({ message: error.message });
  }
};


const getHotelById = async (req, res) => {
  try {
    const { id } = req.params;
    logInteraction('GET', `Obtener hotel con ID: ${id}`);
    
    const hotel = await Hotel.findByPk(id);
    if (!hotel) {
      logInteraction('GET', `Hotel no encontrado con ID: ${id}`);
      return res.status(404).json({ message: 'Hotel no encontrado' });
    }
    
    res.status(200).json(hotel);
  } catch (error) {
    logInteraction('GET', `Error: ${error.message}`);
    res.status(500).json({ message: error.message });
  }
};


const createHotel = async (req, res) => {
  try {
    const { nombre, direccion } = req.body;
    logInteraction('POST', `Creando hotel: ${nombre}`);
    
    if (!nombre || !direccion) {
      logInteraction('POST', 'Faltan los campos obligatorios');
      return res.status(400).json({ message: 'Nombre y direccion son obligatorios' });
    }
    
    const newHotel = await Hotel.create({ nombre, direccion });
    
    logInteraction('POST', `Hotel creado con ID: ${newHotel.id}`);
    res.status(201).json(newHotel);
  } catch (error) {
    logInteraction('POST', `Error: ${error.message}`);
    res.status(500).json({ message: error.message });
  }
};


const updateHotel = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, direccion } = req.body;
    
    logInteraction('PUT', `Actualizar hotel con ID: ${id}`);
    
    const hotel = await Hotel.findByPk(id);
    if (!hotel) {
      logInteraction('PUT', `Hotel no encontrado con ID: ${id}`);
      return res.status(404).json({ message: 'Hotel no encontrado' });
    }
    
    await hotel.update({ nombre, direccion });
    
    logInteraction('PUT', `Hotel actualizado con ID: ${id}`);
    res.status(200).json(hotel);
  } catch (error) {
    logInteraction('PUT', `Error: ${error.message}`);
    res.status(500).json({ message: error.message });
  }
};


const deleteHotel = async (req, res) => {
  try {
    const { id } = req.params;
    
    logInteraction('DELETE', `Eliminando hotel con ID: ${id}`);
    
    const hotel = await Hotel.findByPk(id);
    if (!hotel) {
      logInteraction('DELETE', `Hotel no encontrado con ID: ${id}`);
      return res.status(404).json({ message: 'Hotel no encontrado' });
    }
    
    await hotel.destroy();
    
    logInteraction('DELETE', `Hotel eliminado con ID: ${id}`);
    res.status(200).json({ message: 'Hotel eliminado con exito' });
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