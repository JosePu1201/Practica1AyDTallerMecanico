require('dotenv').config();
const express = require('express');
//const rutas = require('./Ruters/user.ruter'); // Importar rutas de usuario
require('./Model/index.js'); // Importar relaciones para que se sincronicen
//const userRoutes = require('./Router/userRouter');
const session = require('express-session');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware json y session
app.use(express.json());
app.use(session({
  secret: 'admin',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false } // Usa true solo si tienes HTTPS
}));
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
    const vehicleRouter = require('./Ruters/vehicle.ruter');
    const empleadoRouter = require('./Ruters/empleado.ruter');
    const inventarioRouter = require('./Ruters/inventario.ruter');
    const facturaRouter = require('./Ruters/factura.ruter');
    const proveedorRouter = require('./Ruters/proveedor.ruter');
    const pedidoRouter = require('./Ruters/pedido.ruter');

    app.use('/api/pedidos', pedidoRouter); // Usar las rutas de pedido
    app.use('/api/proveedores', proveedorRouter); // Usar las rutas de proveedor
    app.use('/api/facturas', facturaRouter); // Usar las rutas de factura
    app.use('/api/inventario', inventarioRouter); // Usar las rutas de
    app.use('/api/personas', userRouter); // Usar las rutas de usuario
    app.use('/api/vehiculos', vehicleRouter); // Usar las rutas de vehículo
    app.use('/api/empleados', empleadoRouter); // Usar las rutas de empleado

    const managementUsersRouter = require('./Ruters/management_users.router');
    app.use('/api/management', managementUsersRouter);

    const servicesVehicle = require('./Ruters/services.router');
    app.use('/api/servicios', servicesVehicle);
    
    const specialistRouter = require('./Ruters/specialist.router');
    app.use('/api/especialistas', specialistRouter);

    const clientRouter = require('./Ruters/client.router');
    app.use('/api/clientes', clientRouter);

    const reportRouter = require('./Ruters/report.router');
    app.use('/api/reportes', reportRouter);

    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
    });


  } catch (error) {
    console.error('Error al conectar con la base de datos:', error);
  }
};
//console.log('Credenciales de sesión:', req.session.user);
startServer();