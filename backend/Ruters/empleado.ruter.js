// creacion de ruter para manejar las rutas de asignaciones de trabajo por usuario
const empleadoController = require('../Controller/empleadoController');
const express = require('express');
const router = express.Router();        
// Rutas para manejar las operaciones relacionadas con asignaciones de trabajo por usuario
router.get('/asignaciones/:id_usuario', empleadoController.consultarAsignacionesPorUsuario);

//ruta para registrar avance de trabajo
router.post('/avance', empleadoController.registrarAvanceTrabajo);

//ruta para consultar avances de trabajo por id_asignacion
router.get('/avances/:id_asignacion', empleadoController.consultarAvancesPorAsignacion);

//ruta para crear nueva observacion
router.post('/observacion', empleadoController.crearObservacion);
module.exports = router;