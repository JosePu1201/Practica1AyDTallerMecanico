require('dotenv').config();
const express = require('express');
//const rutas = require('./Ruters/user.ruter'); // Importar rutas de usuario
require('./Model/index.js'); // Importar relaciones para que se sincronicen
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
    //await sequelize.authenticate();
    //console.log('Conexión a la base de datos establecida');
    
    // Sincronizar modelos (crear tablas si no existen)
    //await sequelize.sync({ force: false }); // force: true recrea las tablas
    //console.log('Modelos sincronizados y migracion completada');
    
    const userRouter = require('./Ruters/user.ruter');
    app.use('/api/personas', userRouter); // Usar las rutas de usuario

    const managementUsersRouter = require('./Ruters/management_users.router');
    app.use('/api/management', managementUsersRouter);

    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
    });


  } catch (error) {
    console.error('Error al conectar con la base de datos:', error);
  }
};

startServer();