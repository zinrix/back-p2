require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const { testConnection, syncDatabase } = require('./models');


const hotelRoutes = require('./routes/hotelRoutes');
const habitacionRoutes = require('./routes/habitacionRoutes');
const clienteRoutes = require('./routes/clienteRoutes');
const reservaRoutes = require('./routes/reservaRoutes');

// inicializar express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Log middleware for all requests
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] [${req.method}] ${req.originalUrl}`);
  next();
});

// Routes
app.use('/api/hoteles', hotelRoutes);
app.use('/api/habitaciones', habitacionRoutes);
app.use('/api/clientes', clienteRoutes);
app.use('/api/reservas', reservaRoutes);

// ruta para el frontend
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const startServer = async () => {
  try {
    await testConnection();
    
    // Sincronizar los modelos de base de datos
    await syncDatabase(false);
    
    app.listen(PORT, () => {
      console.log(`El servidor esta corriendo en el puerto ${PORT}`);
    });
  } catch (error) {
    console.error('Error al inciar el servidor:', error);
    process.exit(1);
  }
};

startServer();