const clientController = require('../Controller/clientController');
const express = require('express');
const router = express.Router();

router.get('/mis_vehiculos/:id', clientController.getMyVehicles);
router.get('/mis_servicios/:id', clientController.getAllServices);
router.put('/autorizar_servicio/:id', clientController.authorizeService);
router.put('/no_autorizar_servicio/:id', clientController.notAuthorizeService);
router.get('/detalle_servicios/:id', clientController.getServicesDetailByVehicle);
router.get('/servicios_con_comentarios/:id', clientController.getServicesWithComments);
router.post('/comentarios_seguimiento', clientController.addFollowComment);
router.get('/servicios_adicionales/:id', clientController.getMyAdditionalServices);
router.post('/servicios_adicionales', clientController.addAdditionalService);
router.get('/tipos_mantenimiento', clientController.getMaintenanceTypes);
router.get('/cotizaciones_servicios/:id', clientController.getMyPriceServicesQuotes);
router.post('/solicitar_cotizacion', clientController.requestQuote);
router.get('/facturas/:id', clientController.getAllInvoices);
router.post('/pagar_factura', clientController.payInvoice);
router.post('/calificar_servicio', clientController.rateService);

module.exports = router;