//importar controlador de inventario
const inventarioController = require('../Controller/inventarioController'); 

const express = require('express');
const router = express.Router();   

//ruta para obtener el inventario con repuestos y cantidad
router.get('/repuestos', inventarioController.getInventarioRepuesto);

//actualizar cantidad de repuestos 
router.put('/actualizarCantidad', inventarioController.actualizarCantidadRepuesto);

//hisotirla de movimientos de inventario
router.get('/historialMovimientos', inventarioController.historialMovimientosInventario);

//alerta de inventarioBajo
router.get('/alertaInventarioBajo', inventarioController.getLowStockAlerts);

//cambiar precio unitario de un repuesto
router.put('/actualizarPrecioUnitario', inventarioController.actualizarPrecioUnitarioRepuesto);

module.exports = router;