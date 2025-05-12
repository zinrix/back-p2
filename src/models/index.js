const { sequelize } = require('../config/database');
const Hotel = require('./hotel');
const Habitacion = require('./habitacion');
const Cliente = require('./cliente');
const Reserva = require('./reserva');


const models = {
  Hotel,
  Habitacion,
  Cliente,
  Reserva,
  sequelize
};


const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('Connection has been established successfully.');
  } catch (error) {
    console.error('Unable to connect to the database:', error);
    throw error;
  }
};


const syncDatabase = async (force = false) => {
  try {
    await sequelize.sync({ force });
    console.log('Base de datos sincronizada exitosamente');
  } catch (error) {
    console.error('Error sincronizando base de datos:', error);
    throw error;
  }
};

module.exports = {
  ...models,
  syncDatabase,
  testConnection 
};
