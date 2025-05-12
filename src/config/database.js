require('dotenv').config();
const { Sequelize } = require('sequelize');

// configuracion
const sequelize = new Sequelize({
  dialect: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'admin',
  database: process.env.DB_NAME || 'hotel',
  logging: (msg) => console.log(`[Database] ${msg}`),
  define: {
    timestamps: true,
    underscored: true
  }
});

const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('Conexion con la base de datos exitosa');
  } catch (error) {
    console.error('Error al conectar con la base de datos:', error);
  }
};

module.exports = {
  sequelize,
  testConnection
};