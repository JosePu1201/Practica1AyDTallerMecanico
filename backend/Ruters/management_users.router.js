const userController = require('../Controller/userController');
const express = require('express');
const router = express.Router();  

//Obtener Usuarios
router.get('/users', userController.getUsers);
router.post('/users', userController.createUser);
router.put('/users/:id', userController.updateUser);
router.delete('/users/:id', userController.deleteUser);
router.get('/users/roles', userController.getRol);
router.get('/users/specialists', userController.getSpecialist);
router.get('/users/areas', userController.getAreasEspecialista);
router.get('/users/tipos', userController.getTipoTecnico);
router.post('/users/asignar-especializacion', userController.asignarEspecializacion);

module.exports = router;