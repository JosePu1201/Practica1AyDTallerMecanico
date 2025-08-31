const facturaController = require('../Controller/facturaController');
const express = require('express');
const router = express.Router();


//generar factura
router.post('/generar', facturaController.generarFacturaServicios);

module.exports = router;