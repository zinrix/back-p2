const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const Hotel = require('./hotel');
const Habitacion = require('./habitacion');
const Cliente = require('./cliente');

const Reserva = sequelize.define('Reserva', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
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
  habitacionId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Habitacion,
      key: 'id'
    },
    field: 'habitacion_id'
  },
  fechaIngreso: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    field: 'fecha_ingreso'
  },
  fechaSalida: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    field: 'fecha_salida'
  },
  clienteId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Cliente,
      key: 'id'
    },
    field: 'cliente_id'
  },
  cantidadPersonas: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'cantidad_personas'
  }
}, {
  tableName: 'reservas'
});


Reserva.belongsTo(Hotel, { foreignKey: 'hotelId' });
Reserva.belongsTo(Habitacion, { foreignKey: 'habitacionId' });
Reserva.belongsTo(Cliente, { foreignKey: 'clienteId' });

Hotel.hasMany(Reserva, { foreignKey: 'hotelId' });
Habitacion.hasMany(Reserva, { foreignKey: 'habitacionId' });
Cliente.hasMany(Reserva, { foreignKey: 'clienteId' });

module.exports = Reserva;