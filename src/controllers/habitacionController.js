const { Habitacion, Hotel } = require('../models');


const logInteraction = (method, message) => {
  console.log(`[${new Date().toISOString()}] [Habitacion] [${method}] ${message}`);
};


const getAllHabitaciones = async (req, res) => {
  try {
    const { hotelId } = req.query;
    let query = {};
    
    if (hotelId) {
      query = { where: { hotelId } };
      logInteraction('GET', `Obteniendo todas las habitaciones con ID: ${hotelId}`);
    } else {
      logInteraction('GET', 'Obteniendo todas las habitaciones');
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


const getHabitacionById = async (req, res) => {
  try {
    const { id } = req.params;
    logInteraction('GET', `Habitacion con ID: ${id}`);
    
    const habitacion = await Habitacion.findByPk(id, {
      include: [{ model: Hotel, attributes: ['nombre', 'direccion'] }]
    });
    
    if (!habitacion) {
      logInteraction('GET', `Habitacion no encontrada con ID: ${id}`);
      return res.status(404).json({ message: 'Habitacion no encontrada' });
    }
    
    res.status(200).json(habitacion);
  } catch (error) {
    logInteraction('GET', `Error: ${error.message}`);
    res.status(500).json({ message: error.message });
  }
};


const createHabitacion = async (req, res) => {
  try {
    const { numero, hotelId, posicionX, posicionY, piso, capacidad, caracteristicas } = req.body;
    logInteraction('POST', `Creando habitacion: ${numero} para el hotel: ${hotelId}`);
    
 
    if (!numero || !hotelId || posicionX === undefined || posicionY === undefined || !piso || !capacidad) {
      logInteraction('POST', 'Faltan campos obligatorios');
      return res.status(400).json({ message: 'Faltan campos obligatorios' });
    }
    
    // existencia del hotel
    const hotel = await Hotel.findByPk(hotelId);
    if (!hotel) {
      logInteraction('POST', `Hotel no encontrado con ID: ${hotelId}`);
      return res.status(404).json({ message: 'Hotel no encontrado' });
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
    
    logInteraction('POST', `Habitacion creada con ID: ${newHabitacion.id}`);
    res.status(201).json(newHabitacion);
  } catch (error) {
    logInteraction('POST', `Error: ${error.message}`);
    res.status(500).json({ message: error.message });
  }
};


const updateHabitacion = async (req, res) => {
  try {
    const { id } = req.params;
    const { numero, hotelId, posicionX, posicionY, piso, capacidad, caracteristicas } = req.body;
    
    logInteraction('PUT', `Actualizar habitacion con ID: ${id}`);
    
    const habitacion = await Habitacion.findByPk(id);
    if (!habitacion) {
      logInteraction('PUT', `Habitacion no encontrada con ID: ${id}`);
      return res.status(404).json({ message: 'Room not found' });
    }
    
  
    if (hotelId) {
      const hotel = await Hotel.findByPk(hotelId);
      if (!hotel) {
        logInteraction('PUT', `Hotel no encontrado con ID: ${hotelId}`);
        return res.status(404).json({ message: 'Hotel no encontrado' });
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
    
    logInteraction('PUT', `Habitacion actualizada con ID: ${id}`);
    res.status(200).json(habitacion);
  } catch (error) {
    logInteraction('PUT', `Error: ${error.message}`);
    res.status(500).json({ message: error.message });
  }
};


const deleteHabitacion = async (req, res) => {
  try {
    const { id } = req.params;
    
    logInteraction('DELETE', `Borrando habitacion con ID: ${id}`);
    
    const habitacion = await Habitacion.findByPk(id);
    if (!habitacion) {
      logInteraction('DELETE', `Habitacion no encontrada con ID: ${id}`);
      return res.status(404).json({ message: 'Habitacion no encontrada' });
    }
    
    await habitacion.destroy();
    
    logInteraction('DELETE', `Habitacion eliminada con ID: ${id}`);
    res.status(200).json({ message: 'Habitacion eliminada con exito' });
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