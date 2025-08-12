const express = require('express');
const { sequelize } = require('./config/database');
//const userRoutes = require('./Router/userRouter');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// Rutas
//app.use('/api/users', userRoutes);

// Sincronizar base de datos y iniciar servidor
const startServer = async () => {
  try {
    // Conectar a la base de datos
    await sequelize.authenticate();
    console.log('Conexión a la base de datos establecida');
    
    // Sincronizar modelos (crear tablas si no existen)
    await sequelize.sync({ force: false }); // force: true recrea las tablas
    console.log('Modelos sincronizados');
    
    app.listen(PORT, () => {
      console.log(`Servidor corriendo en puerto ${PORT}`);
    });
  } catch (error) {
    console.error('Error al conectar con la base de datos:', error);
  }
};

startServer();