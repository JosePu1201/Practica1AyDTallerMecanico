const requestClientAdminController = require('../Controller/requestClientAdminController');
const express = require('express');
const router = express.Router();

router.get('/servicios_adicionales', requestClientAdminController.getAdditionalServices);
router.get('/tipo_mantenimiento', requestClientAdminController.getTipoMantenimiento);
router.post('/aceptar_servicio_adicional', requestClientAdminController.acceptAdditionalService);
router.post('/rechazar_servicio_adicional/:id', requestClientAdminController.declineAdditionalService);
router.get('/cotizaciones_servicios_precio/:id', requestClientAdminController.getPriceServicesQuotes);
router.post('/agregar_trabajo_cotizacion', requestClientAdminController.addWorkToQuote);
router.post('/enviar_cotizacion/:id_registro_cotizacion', requestClientAdminController.sendQuote);

module.exports = router;
