const specialistController = require('../Controller/specialistController');
const express = require('express');
const router = express.Router();



router.get('/trabajos_asignados/:id', specialistController.getWorksAssigned);
router.put('/actualizar_trabajo/:id', specialistController.updateWorkAssignment);
router.get('/historial_vehiculo/:id', specialistController.getHistoryVehicle);
router.post('/agregar_diagnostico', specialistController.addDiagnostic);
router.post('/agregar_detalle_diagnostico/:id', specialistController.addDiagnosticDetail);
router.get('/diagnosticos_especialista/:id', specialistController.getDiagnosticsBySpecialist);
router.post('/agregar_prueba_tecnica', specialistController.addTechnicalTest);
router.post('/agregar_resultado_prueba/:id', specialistController.addTestResult);
router.get('/pruebas_tecnicas_especialista/:id', specialistController.getTechnicalTestsBySpecialist);
router.post('/agregar_propuesta_solucion', specialistController.addSolutionProposal);
router.get('/soluciones_prueba/:id', specialistController.getSolutionsByTestResult);
router.post('/agregar_comentarios_vehiculo', specialistController.addCommentsVehicleSpecialist);
router.get('/comentarios_asignacion/:id', specialistController.getCommentsByAssignment);
router.post('/agregar_recomendacion_vehiculo', specialistController.addVehicleRecommendation);
router.get('/recomendaciones_asignacion/:id', specialistController.getRecommendationsByAssignment);
router.post('/crear_solicitud_apoyo', specialistController.createRequestSupport);
router.get('/solicitudes_apoyo_especialista/:id', specialistController.getRequestsSupportBySpecialist);
router.post('/responder_solicitud_apoyo', specialistController.respondToSupportRequest);
router.get('/solicitudes_repuestos', specialistController.getRequestsReplacementPartsByService);
router.post('/aceptar_repuesto', specialistController.aceptReplacementPart);
router.get('/usuarios_especialistas', specialistController.getUsersSpecialist);

module.exports = router;