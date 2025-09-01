const servicesController = require('../Controller/servicesController');
const express = require('express');
const router = express.Router();

router.get('/vehicles_with_client', servicesController.getVehiclesWithClient);
router.get('/tipo_mantenimiento', servicesController.getTipoMantenimiento);
router.post('/tipo_mantenimiento', servicesController.addTipoMantenimiento);
router.post('/registro_servicio_vehiculo', servicesController.registerServiceVehicle);
router.get('/obtener_servicios', servicesController.getServices);
router.put('/cambiar_estado_servicio', servicesController.changeStateService);
router.put('/actualizar_servicio', servicesController.updateService);
router.get('/empleados', servicesController.getAllEmployees);
router.get('/especialistas', servicesController.getAllSpecialists);
router.post('/asignar_trabajo', servicesController.assignWork);
router.get('/trabajos_empleados/:id', servicesController.getWorksEmployees);
router.get('/trabajos_servicio/:id', servicesController.getWorksServicesId);
router.put('/cambiar_empleado_trabajo', servicesController.changeEmployeeWork);


module.exports = router;