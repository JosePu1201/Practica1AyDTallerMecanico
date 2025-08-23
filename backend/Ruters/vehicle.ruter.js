const vehicleController = require('../Controller/vehicleController');
const express = require('express');
const router = express.Router();    
 // Rutas para manejar las operaciones CRUD de Vehículo

router.get('/listar', vehicleController.listarVehiculos);

//crear vehiculo
router.post('/registrar', vehicleController.registrarVehiculo);

//actualizar vehiculo
router.put('/actualizar/:id', vehicleController.actualizarVehiculo);

//eliminar vehiculo
router.put('/eliminar/:id', vehicleController.eliminarVehiculo);

//listar vehiculos por cliente
router.get('/listar/:id_cliente', vehicleController.listarVehiculosPorCliente);

//buscar vehiculo por placa
router.get('/buscarPorPlaca/:placa', vehicleController.buscarVehiculoPorPlaca);

//listar registros de servicio por vehiculo
router.get('/listarRegistrosDeServicio/:id_vehiculo', vehicleController.listarRegistrosDeServicioPorVehiculo);

//listar cotizaciones de servicio por vehiculo
router.get('/listarCotizacionesDeServicio/:id_vehiculo', vehicleController.listarCotizacionesDeServicioPorVehiculo);
//listar cotizaciones de servicio por cliente
router.get('/listarCotizacionesDeServicioPorCliente/:id_cliente', vehicleController.listarCotizacionesDeServicioPorCliente);

module.exports = router;


