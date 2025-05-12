const { sequelize } = require('../config/database');
const Hotel = require('./hotel');
const Habitacion = require('./habitacion');
const Cliente = require('./cliente');
const Reserva = require('./reserva');

// Initialize models
const models = {
  Hotel,
  Habitacion,
  Cliente,
  Reserva,
  sequelize
};

// Test connection
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('Connection has been established successfully.');
  } catch (error) {
    console.error('Unable to connect to the database:', error);
    throw error;
  }
};

// Sync all models with database
const syncDatabase = async (force = false) => {
  try {
    await sequelize.sync({ force });
    console.log('Database synced successfully');
  } catch (error) {
    console.error('Error syncing database:', error);
    throw error;
  }
};

module.exports = {
  ...models,
  syncDatabase,
  testConnection // 👈 ahora sí está exportado
};
