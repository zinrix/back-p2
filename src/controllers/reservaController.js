const { Op } = require('sequelize');
const { Reserva, Hotel, Habitacion, Cliente } = require('../models');

// Log interactions
const logInteraction = (method, message) => {
  console.log(`[${new Date().toISOString()}] [Reserva] [${method}] ${message}`);
};

// Get all reservations with filtering
const getAllReservas = async (req, res) => {
  try {
    const { hotelId, checkIn: fechaIngreso, checkOut: fechaSalida, cedula } = req.query;
    logInteraction('GET', 'Fetching reservations with filters');
    
    let whereClause = {};
    
    // Add filters if provided
    if (hotelId) {
      whereClause.hotelId = hotelId;
    }
    
    if (fechaIngreso) {
      whereClause.fechaIngreso = fechaIngreso;
    }
    
    if (fechaSalida) {
      whereClause.fechaSalida = fechaSalida;
    }
    
    // Find clientId by cedula if provided
    if (cedula) {
      const cliente = await Cliente.findOne({ where: { cedula } });
      if (cliente) {
        whereClause.clienteId = cliente.id;
      } else {
        // If client doesn't exist, return empty array
        return res.status(200).json([]);
      }
    }
    
    const reservas = await Reserva.findAll({
      where: whereClause,
      include: [
        { model: Hotel, attributes: ['nombre', 'direccion'] },
        { model: Habitacion, attributes: ['numero', 'piso', 'capacidad', 'caracteristicas'] },
        { model: Cliente, attributes: ['cedula', 'nombre', 'apellido'] }
      ],
      order: [
        ['fechaIngreso', 'ASC'],
        [Habitacion, 'piso', 'ASC'],
        [Habitacion, 'numero', 'ASC']
      ]
    });
    
    res.status(200).json(reservas);
  } catch (error) {
    logInteraction('GET', `Error: ${error.message}`);
    res.status(500).json({ message: error.message });
  }
};

// Get reservation by ID
const getReservaById = async (req, res) => {
  try {
    const { id } = req.params;
    logInteraction('GET', `Getting reservation with ID: ${id}`);
    
    const reserva = await Reserva.findByPk(id, {
      include: [
        { model: Hotel, attributes: ['nombre', 'direccion'] },
        { model: Habitacion, attributes: ['numero', 'piso', 'capacidad', 'caracteristicas'] },
        { model: Cliente, attributes: ['cedula', 'nombre', 'apellido'] }
      ]
    });
    
    if (!reserva) {
      logInteraction('GET', `Reservation not found with ID: ${id}`);
      return res.status(404).json({ message: 'Reservation not found' });
    }
    
    res.status(200).json(reserva);
  } catch (error) {
    logInteraction('GET', `Error: ${error.message}`);
    res.status(500).json({ message: error.message });
  }
};

// Get or create a client by cedula
const getOrCreateCliente = async (cedula, nombre, apellido) => {
  try {
    // Try to find the client first
    let cliente = await Cliente.findOne({ where: { cedula } });
    
    if (!cliente) {
      // If client doesn't exist, create a new one
      logInteraction('POST', `Creating new client with cedula: ${cedula}`);
      cliente = await Cliente.create({
        cedula,
        nombre,
        apellido
      });
    } else if (nombre && apellido && (cliente.nombre !== nombre || cliente.apellido !== apellido)) {
      // If client exists but data has changed, update the client
      logInteraction('POST', `Updating client with cedula: ${cedula}`);
      cliente = await cliente.update({
        nombre,
        apellido
      });
    }
    
    return cliente;
  } catch (error) {
    logInteraction('POST', `Error in getOrCreateCliente: ${error.message}`);
    throw error;
  }
};

// Create a new reservation
const createReserva = async (req, res) => {
  try {
    const { 
      hotelId, 
      habitacionId, 
      cedula, 
      nombre, 
      apellido, 
      fechaIngreso, 
      fechaSalida, 
      cantidadPersonas 
    } = req.body;
    
    logInteraction('POST', `Creating reservation for room: ${habitacionId} in hotel: ${hotelId}`);
    
    // Validate required fields
    if (!hotelId || !habitacionId || !cedula || !fechaIngreso || !fechaSalida || !cantidadPersonas) {
      logInteraction('POST', 'Missing required fields');
      return res.status(400).json({ message: 'hotelId, habitacionId, cedula, fechaIngreso, fechaSalida, and cantidadPersonas are required' });
    }
    
    // Check if hotel exists
    const hotel = await Hotel.findByPk(hotelId);
    if (!hotel) {
      logInteraction('POST', `Hotel not found with ID: ${hotelId}`);
      return res.status(404).json({ message: 'Hotel not found' });
    }
    
    // Check if habitacion exists and belongs to the hotel
    const habitacion = await Habitacion.findOne({ 
      where: { 
        id: habitacionId,
        hotelId: hotelId
      }
    });
    
    if (!habitacion) {
      logInteraction('POST', `Room not found with ID: ${habitacionId} for hotel: ${hotelId}`);
      return res.status(404).json({ message: 'Room not found or does not belong to the specified hotel' });
    }
    
    // Check if the room's capacity is sufficient
    if (habitacion.capacidad < cantidadPersonas) {
      logInteraction('POST', `La capacidad de la habitación (${habitacion.capacidad}) es menos de lo requerido: ${cantidadPersonas}`);
      return res.status(400).json({ 
        message: `La capacidad de la habitación (${habitacion.capacidad}) es insuficiente para el número de personas solicitado (${cantidadPersonas})` 
      });
    }
    
    // Check for conflicting reservations
    const conflictingReservations = await Reserva.findOne({
      where: {
        habitacionId,
        [Op.or]: [
          {
            // New check-in date falls between an existing reservation
            [Op.and]: [
              { fechaIngreso: { [Op.lte]: fechaIngreso } },
              { fechaSalida: { [Op.gt]: fechaIngreso } }
            ]
          },
          {
            // New check-out date falls between an existing reservation
            [Op.and]: [
              { fechaIngreso: { [Op.lt]: fechaSalida } },
              { fechaSalida: { [Op.gte]: fechaSalida } }
            ]
          },
          {
            // Existing reservation falls entirely within new reservation
            [Op.and]: [
              { fechaIngreso: { [Op.gte]: fechaIngreso } },
              { fechaSalida: { [Op.lte]: fechaSalida } }
            ]
          }
        ]
      }
    });
    
    if (conflictingReservations) {
      logInteraction('POST', `Conflicting reservation found for room: ${habitacionId}`);
      return res.status(409).json({ message: 'Room is already booked for the selected dates' });
    }
    
    // Get or create the client
    try {
      if (!nombre || !apellido) {
        logInteraction('POST', `Missing client name or surname for cedula: ${cedula}`);
        return res.status(400).json({ message: 'Client name and surname are required' });
      }
      
      const cliente = await getOrCreateCliente(cedula, nombre, apellido);
      
      // Create the reservation
      const newReserva = await Reserva.create({
        hotelId,
        habitacionId,
        clienteId: cliente.id,
        fechaIngreso,
        fechaSalida,
        cantidadPersonas
      });
      
      logInteraction('POST', `Reservation created with ID: ${newReserva.id}`);
      
      // Return the reservation with related data
      const reservaWithData = await Reserva.findByPk(newReserva.id, {
        include: [
          { model: Hotel, attributes: ['nombre', 'direccion'] },
          { model: Habitacion, attributes: ['numero', 'piso', 'capacidad', 'caracteristicas'] },
          { model: Cliente, attributes: ['cedula', 'nombre', 'apellido'] }
        ]
      });
      
      res.status(201).json(reservaWithData);
    } catch (error) {
      logInteraction('POST', `Error processing client: ${error.message}`);
      res.status(500).json({ message: `Error processing client: ${error.message}` });
    }
  } catch (error) {
    logInteraction('POST', `Error: ${error.message}`);
    res.status(500).json({ message: error.message });
  }
};

// Find available rooms for booking
const findAvailableRooms = async (req, res) => {
  try {
   // const { hotelId, checkIn: fechaIngreso, checkOut: fechaSalida, capacity: capacidad } = req.query;
   const hotelId = req.query.hotelId;
   const fechaIngreso = req.query.checkIn;
   const fechaSalida = req.query.checkOut;
   const capacidad = req.query.capacity;
   
   logInteraction('GET', `Finding available rooms for hotel: ${hotelId}, dates: ${fechaIngreso} to ${fechaSalida}`);
    
    // Validate required fields
    if (!hotelId || !fechaIngreso || !fechaSalida) {
      logInteraction('GET', 'Missing required parameters');
      return res.status(400).json({ message: 'Hotel ID, check-in date, and check-out date are required' });
    }
    
    // Find all rooms for the hotel
    const allRooms = await Habitacion.findAll({
      where: { 
        hotelId,
        ...(capacidad ? { capacidad: { [Op.gte]: capacidad } } : {})
      },
      include: [{ model: Hotel, attributes: ['nombre', 'direccion'] }]
    });
    
    if (allRooms.length === 0) {
      logInteraction('GET', `No se encontraron habitaciones para el hotel: ${hotelId} con esos criterios`);
      return res.status(404).json(0);  // Ninguna habitacion para esos criterios
      //return res.status(404).json({ message: 'Ninguna habitacion para esos criterios' });
    }
    
    // Find all reservations that conflict with the requested dates
    const bookedRoomIds = (await Reserva.findAll({
      attributes: ['habitacionId'],
      where: {
        hotelId,
        [Op.or]: [
          {
            // New check-in date falls between an existing reservation
            [Op.and]: [
              { fechaIngreso: { [Op.lte]: fechaIngreso } },
              { fechaSalida: { [Op.gt]: fechaIngreso } }
            ]
          },
          {
            // New check-out date falls between an existing reservation
            [Op.and]: [
              { fechaIngreso: { [Op.lt]: fechaSalida } },
              { fechaSalida: { [Op.gte]: fechaSalida } }
            ]
          },
          {
            // Existing reservation falls entirely within new reservation
            [Op.and]: [
              { fechaIngreso: { [Op.gte]: fechaIngreso } },
              { fechaSalida: { [Op.lte]: fechaSalida } }
            ]
          }
        ]
      }
    })).map(reservation => reservation.habitacionId);
    
    // Filter out booked rooms
    const availableRooms = allRooms.filter(room => !bookedRoomIds.includes(room.id));
    
    logInteraction('GET', `Se encontraron ${availableRooms.length} habitaciones disponibles para el hotel: ${hotelId}`);
    res.status(200).json(availableRooms);
  } catch (error) {
    logInteraction('GET', `Error: ${error.message}`);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getAllReservas,
  getReservaById,
  createReserva,
  findAvailableRooms
};