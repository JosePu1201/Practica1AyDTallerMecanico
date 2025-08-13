const personaController = require('../Controller/personaController');
const express = require('express');
const router = express.Router();    

// Rutas para manejar las operaciones CRUD de Persona
// Crear una nueva persona
router.post('/crear', personaController.crearPersona);

module.exports = router;