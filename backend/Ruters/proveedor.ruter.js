const express = require('express');
const router = express.Router();
const proveedorController = require('../Controller/proveedorController');

//crear proveedor
router.post('/crear', proveedorController.crearProveedor);

//eliminar proveedor
router.put('/eliminar/:id_proveedor', proveedorController.eliminarProveedor);

//crear repuesto 
router.post('/crear_repuesto/:id_proveedor', proveedorController.crearRepuesto);

//eliminar repuesto 
router.put('/eliminar_repuesto/:id_repuesto', proveedorController.eliminarRepuesto);

//actualizar repuesto
router.put('/actualizar_repuesto/:id_repuesto', proveedorController.actualizarRepuesto);

//listar proveedores
router.get('/listar_proveedores', proveedorController.listarProveedores);   

//listar repuestos por proveedor
router.get('/listar_repuestos/:id_proveedor', proveedorController.listarRepuestosProveedor);

//agregar repuesto al catalogo proveedor
router.post('/agregar_repuesto', proveedorController.agregarRepuesto);

//listar todos los catalogos 
router.get('/listar_catalogos', proveedorController.listarRepuestosCatalogoProveedor);

//listar catalogos por proveedor 
router.get('/listar_catalogos_proveedor/:id_proveedor', proveedorController.listarCatalogoProveedor);


//listar catalogos por proveedor por id proveedor
router.get('/listar_catalogos_proveedor_by_id_proveedor/:id_proveedor', proveedorController.listarCatalogoProveedorByIdProveedor);

//actualizar catalogo
router.put('/actualizar_catalogo/:id_catalogo', proveedorController.actualizarCatalogoProveedor);

// listar pago proveedor
router.get('/listar_pago_proveedor/:id_proveedor', proveedorController.listarPagosProveedor);
module.exports = router;