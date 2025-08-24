// creacion de ruter para manejar las rutas de asignaciones de trabajo por usuario
const empleadoController = require('../Controller/empleadoController');
const express = require('express');
const router = express.Router();        
// Rutas para manejar las operaciones relacionadas con asignaciones de trabajo por usuario
router.get('/asignaciones/:id_usuario', empleadoController.consultarAsignacionesPorUsuario);


module.exports = router;