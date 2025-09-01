const facturaController = require('../Controller/facturaController');
const express = require('express');
const router = express.Router();


//generar factura
router.post('/generar', facturaController.generarFacturaServicios);

//listar facturas
router.get('/listar', facturaController.listarFacturas);

//registrar pago factura
router.post('/registrar-pago', facturaController.registrarPagoFactura);

//listar pagos factura
router.get('/listar-pagos/:id_factura', facturaController.listarPagosFactura);

//consutlar saldo de pagos 
router.get('/consultar-saldo/:id_factura', facturaController.consultarSaldoPagos);
module.exports = router;