//importar controlador de inventario
const inventarioController = require('../Controller/inventarioController'); 

const express = require('express');
const router = express.Router();   

//ruta para obtener el inventario con repuestos y cantidad
router.get('/repuestos', inventarioController.getInventarioRepuesto);




module.exports = router;