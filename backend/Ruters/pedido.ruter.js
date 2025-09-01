const express = require('express');
const router = express.Router();
const pedidoController = require('../Controller/pedidoController');

//crear pedido
router.post('/crear-pedido', pedidoController.crearPedido);

//crear detalle pedido
router.post('/crear-detalle-pedido', pedidoController.crearDetallePedido);

//actualizar detalle pedido
router.put('/actualizar-detalle-pedido/:id_detalle_pedido', pedidoController.actualizarDetallePedido);

//obtener detalle pedido por id
router.get('/detalle-pedido/:id_pedido', pedidoController.obtenerDetallePedido);

//listar pedidos
router.get('/listar-pedidos', pedidoController.listarPedidos);

//realizar pago
router.post('/realizar-pago/:id_pedido', pedidoController.realizarPago);

//Actualizar pago 
router.put('/actualizar-pago/:id_pago_proveedor', pedidoController.actualizarPago);

//listar pagos proveedor
router.get('/listar-pagos-proveedor', pedidoController.listarPagosProveedor);

module.exports = router;