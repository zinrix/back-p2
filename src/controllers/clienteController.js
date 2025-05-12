const { Cliente } = require('../models');

const logInteraction = (method, message) => {
  console.log(`[${new Date().toISOString()}] [Cliente] [${method}] ${message}`);
};

const getAllClientes = async (req, res) => {
  try {
    logInteraction('GET', 'Obtener todos los clientes');
    const clientes = await Cliente.findAll();
    res.status(200).json(clientes);
  } catch (error) {
    logInteraction('GET', `Error: ${error.message}`);
    res.status(500).json({ message: error.message });
  }
};

const getClienteById = async (req, res) => {
  try {
    const { id } = req.params;
    logInteraction('GET', `Obtener cliente con ID: ${id}`);
    
    const cliente = await Cliente.findByPk(id);
    if (!cliente) {
      logInteraction('GET', `Cliente no encontrado con ID: ${id}`);
      return res.status(404).json({ message: 'Cliente no encontrado' });
    }
    
    res.status(200).json(cliente);
  } catch (error) {
    logInteraction('GET', `Error: ${error.message}`);
    res.status(500).json({ message: error.message });
  }
};


const getClienteByCedula = async (req, res) => {
  try {
    const { cedula } = req.params;
    logInteraction('GET', `Obtener cliente con cedula: ${cedula}`);
    
    const cliente = await Cliente.findOne({ where: { cedula } });
    if (!cliente) {
      logInteraction('GET', `Cliente no encontrado con cedula: ${cedula}`);
      return res.status(404).json({ message: 'Cliente no encontrado' });
    }
    
    res.status(200).json(cliente);
  } catch (error) {
    logInteraction('GET', `Error: ${error.message}`);
    res.status(500).json({ message: error.message });
  }
};


const createCliente = async (req, res) => {
  try {
    const { cedula, nombre, apellido } = req.body;
    logInteraction('POST', `Creando cliente con cedula: ${cedula}`);
    
    // Validate required fields
    if (!cedula || !nombre || !apellido) {
      logInteraction('POST', 'Faltan campos obligatorios');
      return res.status(400).json({ message: 'Los campos (cedula, nombre, apellido) son obligatorios' });
    }
    
    // Check if customer already exists
    const existingCliente = await Cliente.findOne({ where: { cedula } });
    if (existingCliente) {
      logInteraction('POST', `Ya existe cliente con cedula: ${cedula}`);
      return res.status(409).json({ 
        message: 'Ya existe cliente con esa cedula',
        cliente: existingCliente
      });
    }
    
    const newCliente = await Cliente.create({ cedula, nombre, apellido });
    
    logInteraction('POST', `Cliente creado con ID: ${newCliente.id}`);
    res.status(201).json(newCliente);
  } catch (error) {
    logInteraction('POST', `Error: ${error.message}`);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getAllClientes,
  getClienteById,
  getClienteByCedula,
  createCliente
};