const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const Hotel = require('./hotel');

const Habitacion = sequelize.define('Habitacion', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  numero: {
    type: DataTypes.STRING,
    allowNull: false
  },
  hotelId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Hotel,
      key: 'id'
    },
    field: 'hotel_id'
  },
  posicionX: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'posicion_x'
  },
  posicionY: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'posicion_y'
  },
  piso: {
    type: DataTypes.STRING,
    allowNull: false
  },
  capacidad: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  caracteristicas: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'habitaciones'
});

// Define relationship
Habitacion.belongsTo(Hotel, { foreignKey: 'hotelId' });
Hotel.hasMany(Habitacion, { foreignKey: 'hotelId' });

module.exports = Habitacion;