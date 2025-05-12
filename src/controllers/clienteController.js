const { Cliente } = require('../models');

// Log interactions
const logInteraction = (method, message) => {
  console.log(`[${new Date().toISOString()}] [Cliente] [${method}] ${message}`);
};

// Get all customers
const getAllClientes = async (req, res) => {
  try {
    logInteraction('GET', 'Getting all customers');
    const clientes = await Cliente.findAll();
    res.status(200).json(clientes);
  } catch (error) {
    logInteraction('GET', `Error: ${error.message}`);
    res.status(500).json({ message: error.message });
  }
};

// Get customer by ID
const getClienteById = async (req, res) => {
  try {
    const { id } = req.params;
    logInteraction('GET', `Getting customer with ID: ${id}`);
    
    const cliente = await Cliente.findByPk(id);
    if (!cliente) {
      logInteraction('GET', `Customer not found with ID: ${id}`);
      return res.status(404).json({ message: 'Customer not found' });
    }
    
    res.status(200).json(cliente);
  } catch (error) {
    logInteraction('GET', `Error: ${error.message}`);
    res.status(500).json({ message: error.message });
  }
};

// Get customer by cedula
const getClienteByCedula = async (req, res) => {
  try {
    const { cedula } = req.params;
    logInteraction('GET', `Getting customer with cedula: ${cedula}`);
    
    const cliente = await Cliente.findOne({ where: { cedula } });
    if (!cliente) {
      logInteraction('GET', `Customer not found with cedula: ${cedula}`);
      return res.status(404).json({ message: 'Customer not found' });
    }
    
    res.status(200).json(cliente);
  } catch (error) {
    logInteraction('GET', `Error: ${error.message}`);
    res.status(500).json({ message: error.message });
  }
};

// Create a new customer
const createCliente = async (req, res) => {
  try {
    const { cedula, nombre, apellido } = req.body;
    logInteraction('POST', `Creating customer with cedula: ${cedula}`);
    
    // Validate required fields
    if (!cedula || !nombre || !apellido) {
      logInteraction('POST', 'Missing required fields');
      return res.status(400).json({ message: 'All fields (cedula, nombre, apellido) are required' });
    }
    
    // Check if customer already exists
    const existingCliente = await Cliente.findOne({ where: { cedula } });
    if (existingCliente) {
      logInteraction('POST', `Customer already exists with cedula: ${cedula}`);
      return res.status(409).json({ 
        message: 'Customer already exists with this cedula',
        cliente: existingCliente
      });
    }
    
    const newCliente = await Cliente.create({ cedula, nombre, apellido });
    
    logInteraction('POST', `Customer created with ID: ${newCliente.id}`);
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