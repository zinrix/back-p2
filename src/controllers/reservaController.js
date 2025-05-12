const { Op } = require('sequelize');
const { Reserva, Hotel, Habitacion, Cliente } = require('../models');


const logInteraction = (method, message) => {
  console.log(`[${new Date().toISOString()}] [Reserva] [${method}] ${message}`);
};


const getAllReservas = async (req, res) => {
  try {
    const { hotelId, checkIn: fechaIngreso, checkOut: fechaSalida, cedula } = req.query;
    logInteraction('GET', 'Fetching reservations with filters');
    
    let whereClause = {};
    
    // filtros
    if (hotelId) {
      whereClause.hotelId = hotelId;
    }
    
    if (fechaIngreso) {
      whereClause.fechaIngreso = fechaIngreso;
    }
    
    if (fechaSalida) {
      whereClause.fechaSalida = fechaSalida;
    }
    
  
    if (cedula) {
      const cliente = await Cliente.findOne({ where: { cedula } });
      if (cliente) {
        whereClause.clienteId = cliente.id;
      } else {
        // Si no existe cliente devuelve un array vacio
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


const getReservaById = async (req, res) => {
  try {
    const { id } = req.params;
    logInteraction('GET', `Obtener reserva con ID: ${id}`);
    
    const reserva = await Reserva.findByPk(id, {
      include: [
        { model: Hotel, attributes: ['nombre', 'direccion'] },
        { model: Habitacion, attributes: ['numero', 'piso', 'capacidad', 'caracteristicas'] },
        { model: Cliente, attributes: ['cedula', 'nombre', 'apellido'] }
      ]
    });
    
    if (!reserva) {
      logInteraction('GET', `Reserva no encontrada con ID: ${id}`);
      return res.status(404).json({ message: 'Reserva no encontrada' });
    }
    
    res.status(200).json(reserva);
  } catch (error) {
    logInteraction('GET', `Error: ${error.message}`);
    res.status(500).json({ message: error.message });
  }
};


const getOrCreateCliente = async (cedula, nombre, apellido) => {
  try {

    let cliente = await Cliente.findOne({ where: { cedula } });
    
    if (!cliente) {

      logInteraction('POST', `Creando nuevo cliente con cedula: ${cedula}`);
      cliente = await Cliente.create({
        cedula,
        nombre,
        apellido
      });
    } else if (nombre && apellido && (cliente.nombre !== nombre || cliente.apellido !== apellido)) {
      logInteraction('POST', `Actualizar cliente con cedula: ${cedula}`);
      cliente = await cliente.update({
        nombre,
        apellido
      });
    }
    
    return cliente;
  } catch (error) {
    logInteraction('POST', `Error getOrCreateCliente: ${error.message}`);
    throw error;
  }
};


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
    
    logInteraction('POST', `Creando reserva para la habitacion: ${habitacionId} en el hotel: ${hotelId}`);
    

    if (!hotelId || !habitacionId || !cedula || !fechaIngreso || !fechaSalida || !cantidadPersonas) {
      logInteraction('POST', 'Faltan campos obligatorios');
      return res.status(400).json({ message: 'hotelId, habitacionId, cedula, fechaIngreso, fechaSalida, and cantidadPersonas are required' });
    }
    

    const hotel = await Hotel.findByPk(hotelId);
    if (!hotel) {
      logInteraction('POST', `Hotel no encontrado con ID: ${hotelId}`);
      return res.status(404).json({ message: 'Hotel no encontrado' });
    }
    
    // si existe la habitacion y pertenece al hotel
    const habitacion = await Habitacion.findOne({ 
      where: { 
        id: habitacionId,
        hotelId: hotelId
      }
    });
    
    if (!habitacion) {
      logInteraction('POST', `Habitacion no encontrada con ID: ${habitacionId} para el hotel: ${hotelId}`);
      return res.status(404).json({ message: 'Habitacion no encontrada o no pertence al hotel' });
    }
    
   
    if (habitacion.capacidad < cantidadPersonas) {
      logInteraction('POST', `La capacidad de la habitación (${habitacion.capacidad}) es menos de lo requerido: ${cantidadPersonas}`);
      return res.status(400).json({ 
        message: `La capacidad de la habitación (${habitacion.capacidad}) es insuficiente para el número de personas solicitado (${cantidadPersonas})` 
      });
    }
    

    const conflictingReservations = await Reserva.findOne({
      where: {
        habitacionId,
        [Op.or]: [
          {
          
            [Op.and]: [
              { fechaIngreso: { [Op.lte]: fechaIngreso } },
              { fechaSalida: { [Op.gt]: fechaIngreso } }
            ]
          },
          {
         
            [Op.and]: [
              { fechaIngreso: { [Op.lt]: fechaSalida } },
              { fechaSalida: { [Op.gte]: fechaSalida } }
            ]
          },
          {
            
            [Op.and]: [
              { fechaIngreso: { [Op.gte]: fechaIngreso } },
              { fechaSalida: { [Op.lte]: fechaSalida } }
            ]
          }
        ]
      }
    });
    
    if (conflictingReservations) {
      logInteraction('POST', `Conflicto en la reserva para la habitacion con ID: ${habitacionId}`);
      return res.status(409).json({ message: 'La habitacion ya esta reservada en esas fechas' });
    }

    try {
      if (!nombre || !apellido) {
        logInteraction('POST', `Falta el nombre y apellido del cliente con cedula: ${cedula}`);
        return res.status(400).json({ message: 'Nombre y apellido del cliente es necesario' });
      }
      
      const cliente = await getOrCreateCliente(cedula, nombre, apellido);
      
   
      const newReserva = await Reserva.create({
        hotelId,
        habitacionId,
        clienteId: cliente.id,
        fechaIngreso,
        fechaSalida,
        cantidadPersonas
      });
      
      logInteraction('POST', `Reserva creada con ID: ${newReserva.id}`);
      
 
      const reservaWithData = await Reserva.findByPk(newReserva.id, {
        include: [
          { model: Hotel, attributes: ['nombre', 'direccion'] },
          { model: Habitacion, attributes: ['numero', 'piso', 'capacidad', 'caracteristicas'] },
          { model: Cliente, attributes: ['cedula', 'nombre', 'apellido'] }
        ]
      });
      
      res.status(201).json(reservaWithData);
    } catch (error) {
      logInteraction('POST', `Error procesando cliente: ${error.message}`);
      res.status(500).json({ message: `Error procesando cliente: ${error.message}` });
    }
  } catch (error) {
    logInteraction('POST', `Error: ${error.message}`);
    res.status(500).json({ message: error.message });
  }
};


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
      logInteraction('GET', 'Faltan campos obligatorios');
      return res.status(400).json({ message: 'Hotel ID, check-in, y check-out son requeridos' });
    }
    

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
    
    
    const bookedRoomIds = (await Reserva.findAll({
      attributes: ['habitacionId'],
      where: {
        hotelId,
        [Op.or]: [
          {

            [Op.and]: [
              { fechaIngreso: { [Op.lte]: fechaIngreso } },
              { fechaSalida: { [Op.gt]: fechaIngreso } }
            ]
          },
          {
      
            [Op.and]: [
              { fechaIngreso: { [Op.lt]: fechaSalida } },
              { fechaSalida: { [Op.gte]: fechaSalida } }
            ]
          },
          {

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