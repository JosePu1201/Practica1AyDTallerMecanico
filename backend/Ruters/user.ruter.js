const personaController = require('../Controller/personaController');
const express = require('express');
const router = express.Router();    

// Rutas para manejar las operaciones CRUD de Persona
// Crear una nueva persona
router.post('/crear', personaController.crearPersona);
/* Ejemplo de uso:
POST /crear
{
    "nombre": "Juan",
    "apellido": "Pérez",
    "dpi": "1234567890101",
    "fecha_nacimiento": "1990-01-01",
    "direccion": "Calle Falsa 123"
}
*/
// Obtener todas las personas
router.get('/obtener', personaController.obtenerPersonas);
// Crear contactoPersona, usuario y persona al mismo tiempo
router.post('/crear-contacto-usuario', personaController.crearContactoUsuario);

module.exports = router;