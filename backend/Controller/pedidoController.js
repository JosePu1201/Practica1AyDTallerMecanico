const { parse } = require('dotenv');
const {PedidoProveedor,DetallePedido,PagosProveedor,Proveedor,CatalogoProveedor,sequelize} = require('../Model');

//generar un nuevo pedido 
const crearPedido = async (req, res) => {
    try {
        if(!req.session.user || req.session.user.rol != 1 || !req.session){
            return res.status(401).json({message: 'No autorizado'});
        }
        const {id_proveedor,fecha_entrega_solicitada,observaciones} = req.body;
        //validar que el proveedor exista
        const proveedor = await Proveedor.findOne({where: {id_proveedor}});
        if(!proveedor){
            return res.status(404).json({message: 'Proveedor no encontrado'});
        }
        const pedido = await PedidoProveedor.create({
            id_proveedor,
            observaciones,
            fecha_entrega_solicitada: new Date(fecha_entrega_solicitada),
            total:0,
            numero_pedido: " "
        });

        const numeroPedido = `P-${pedido.id_pedido}-${id_proveedor}`;
        pedido.numero_pedido=numeroPedido;
        await pedido.save();
        res.status(201).json({message:"Pedido creado correctamente",pedido});
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

//crear detallePedido
const crearDetallePedido = async (req, res) => {
    const transaction = await sequelize.transaction();
    try {
        //validar que el pedido no este asignado a un pagoProveedor

        const {id_pedido,id_catalogo,cantidad} = req.body;

        //validar que el pedido no este asignado a un pagoProveedor
        const pagoProveedor = await PagosProveedor.findOne({where: {id_pedido}});
        if(pagoProveedor){
            await transaction.rollback();
            return res.status(400).json({message: 'El pedido ya tiene un pago asignado, por lo tanto no puedes seguir agregando productos'});
        }
        
        const pedido = await PedidoProveedor.findOne({where: {id_pedido}},transaction);
        if(!pedido){
             await transaction.rollback();
            return res.status(404).json({message: 'Pedido no encontrado'});
            
        }
        if(pedido.estado != "PENDIENTE"){
            await transaction.rollback();
            return res.status(404).json({message: 'Al pedido ya no se le puede agregar mas productos '});
        }
        //validar que exist el catalogo 
        const catalogo = await CatalogoProveedor.findOne({where: {id_catalogo, id_proveedor:pedido.id_proveedor}},transaction);
        if(!catalogo){
             await transaction.rollback();
            return res.status(404).json({message: 'Catalogo no encontrado'});
            
        }

        //valida que no exista un detallePedido con el mismo catalogo y mismo pedido 
        const detallePedidoExistente = await DetallePedido.findOne({where: {id_pedido, id_catalogo}},transaction);
        if(detallePedidoExistente){
            await transaction.rollback();
            return res.status(404).json({message: 'Detalle de pedido ya existe debes de actualizar la cantidad si deseas el mismo producto '});
            
        }
    
        //validar que el catalogo tenga un precio
        const precio_unitario = catalogo.precio; 
        
        if(catalogo.cantidad_disponible < cantidad){
             await transaction.rollback();
            return res.status(404).json({message: 'Cantidad no disponible'});
            
        }
        const subtotal = parseFloat(precio_unitario * cantidad);
        //validar que exist el catalogo
        
        
        const detallePedido = await DetallePedido.create({
            id_pedido,
            id_catalogo,
            cantidad,
            precio_unitario,
            subtotal
        });
        //reudce la cantidad en el catalogo para evitar problemas de stock o inconsistencia
        catalogo.cantidad_disponible -= cantidad;
        const totalPedido = parseFloat(pedido.total) + parseFloat(subtotal);
        pedido.total = totalPedido;
        await catalogo.save();
        await pedido.save();
        await transaction.commit();
        res.status(201).json({message:"Detalle de pedido creado correctamente",detallePedido});
    } catch (error) {
        res.status(500).json({ message: error.message });
        await transaction.rollback();
    }
};

//actualiza cantidad detalle pedido 
const actualizarDetallePedido = async (req, res) => {
    const { id_detalle_pedido} = req.params;
    const { cantidad } = req.body;
    const transaction = await sequelize.transaction();
    try {
        //validar que no exista un pagoProveedor asignado al 
        const detallePedido = await DetallePedido.findByPk(id_detalle_pedido, { transaction });
        if (!detallePedido) {
            await transaction.rollback();
            return res.status(404).json({ message: 'Detalle de pedido no encontrado' });
        }
        const catalogo = await CatalogoProveedor.findByPk(detallePedido.id_catalogo, { transaction });
        if (!catalogo) {
            await transaction.rollback();
            return res.status(404).json({ message: 'Catalogo no encontrado' });
        }
        const pedidoProveedor = await PedidoProveedor.findByPk(detallePedido.id_pedido, { transaction });
        
        //valida que exist el pedido
        if(!pedidoProveedor){
            await transaction.rollback();
            return res.status(404).json({message: 'Pedido no encontrado'});
        }
        if(pedidoProveedor.estado != "PENDIENTE"){
            await transaction.rollback();
            return res.status(404).json({message: 'El pedido ya no se puede editar'});
        }
        //valida que exist el catalogo
        
        if(parseFloat(detallePedido.cantidad)>=parseFloat(cantidad)){
            const cantidadActualizada = parseFloat(detallePedido.cantidad) - parseFloat(cantidad);
            catalogo.cantidad_disponible += cantidadActualizada;
            await catalogo.save();
            detallePedido.cantidad = cantidad;
            const totalPedido = parseFloat(detallePedido.subtotal) - parseFloat(cantidadActualizada*parseFloat(detallePedido.precio_unitario));
            detallePedido.subtotal = totalPedido;
            pedidoProveedor.total = parseFloat(pedidoProveedor.total) - parseFloat(parseFloat(cantidadActualizada)*parseFloat(detallePedido.precio_unitario));
            console.log(pedidoProveedor.total);
            await pedidoProveedor.save();
            await detallePedido.save();
            await transaction.commit();
            return res.status(200).json({ message: `antidad actualizada correctamente, se restaron ${cantidadActualizada} del stock` });
        }else{
            //dferencia de cantidad para sumar
            const cantidadDeMas = parseFloat(cantidad) - parseFloat(detallePedido.cantidad);
            //valida que haya stock disponible
            if(catalogo.cantidad_disponible >= cantidadDeMas){

                catalogo.cantidad_disponible -= cantidadDeMas;
                await catalogo.save();
                detallePedido.cantidad += cantidadDeMas;
                const totalPedido = parseFloat(detallePedido.subtotal) + parseFloat(cantidadDeMas*parseFloat(detallePedido.precio_unitario));
                detallePedido.subtotal = totalPedido;
                pedidoProveedor.total = parseFloat(pedidoProveedor.total) +parseFloat(cantidadDeMas*parseFloat(detallePedido.precio_unitario));
                console.log(pedidoProveedor.total);
                await pedidoProveedor.save();
                await detallePedido.save();
                await transaction.commit();
                return res.status(200).json({ message: `Cantidad actualizada correctamente, se sumaron ${cantidadDeMas} al stock` });
            }else{
                await transaction.rollback();
                return res.status(404).json({ message: 'Cantidad de producto no disponible' });
            }

        }
    } catch (error) {
        await transaction.rollback();
        res.status(500).json({ message: error.message });
    }
};
//obtener todo el detalle pedido por id_pedido_proveedor
const obtenerDetallePedido = async (req, res) => {

    try {
        const {id_pedido} = req.params;
        //valida que el pedido exista
        const  pedidoProveedor = await PedidoProveedor.findOne({where: {id_pedido}});
        if(!pedidoProveedor){
            return res.status(404).json({message: 'Pedido no encontrado'});
        }
        const detallePedido = await DetallePedido.findAll({where: {id_pedido}});
        if(!detallePedido){
            return res.status(404).json({message: 'Detalle de pedido no encontrado'});
        }
        res.status(200).json({message: 'Detalle de pedido encontrado',pedidoProveedor, detallePedido});
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

//listar todos los pedidos
const listarPedidos = async (req, res) => {
    try {

        const pedidos = await PedidoProveedor.findAll(
            {
                include:[
                    {
                        model: DetallePedido,
                        attributes: ['id_detalle_pedido','cantidad','precio_unitario','subtotal'],
                        
                    },
                    {
                        model: Proveedor,
                        attributes: ['id_proveedor','nit']
                    }
                ]
            }
        );
        if(!pedidos){
            return res.status(404).json({message: 'Pedidos no encontrados'});   
        }
        res.status(200).json({message: 'Pedidos encontrados',pedidos});
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

//realizar pago 
const realizarPago = async (req, res) => {
    try {
        //validar que el usuario este logueado
       if(!req.session.user || req.session.user.rol != 1 || !req.session){
            return res.status(401).json({message: 'No autorizado'});
        }
        const {id_pedido} = req.params;
        //validar que no exista un pagoProveedor con el mismo id_pedido
        const pagoExistente = await PagosProveedor.findOne({where: {id_pedido}});
        if(pagoExistente){
            return res.status(400).json({message: 'Ya existe un pago para este pedido'});
        }
        //validar que el pedido exista
        const pedidoProveedor = await PedidoProveedor.findOne({where: {id_pedido}});
        if(!pedidoProveedor){
            return res.status(404).json({message: 'Pedido no encontrado'});
        }
        //validar que el    pedido este pendiente
        if(pedidoProveedor.estado != "PENDIENTE"){
            return res.status(400).json({message: 'El pedido ya ha sido pagado'});
        }
        const {metodo_pago,observaciones,referencia} = req.body;
        //validar que el proveedor exista       
        const pago = await PagosProveedor.create({
            id_pedido,
            metodo_pago,
            observaciones,
            referencia: referencia ?? null,
            monto:pedidoProveedor.total,
            estado:"PAGADO",
            id_usuario_registro:req.session.user.id_usuario,
            fecha_pago: new Date()
        });
        //actualizar el estado del pedido
        pedidoProveedor.estado = "CONFIRMADO";
        await pedidoProveedor.save();



        res.status(201).json({message:"Pago realizado correctamente",pago});
    } catch (error) {
        res.status(500).json({ message: error.message });
}};  

// Actualziar pago proveedor a PAGADO 
const actualizarPago = async (req, res) => {
    try {
        const { id_pago_proveedor } = req.params;
        const { referencia } = req.body;    
        const pago = await PagosProveedor.findByPk(id_pago_proveedor);
        if (!pago) {
            return res.status(404).json({ message: 'Pago no encontrado' });
        }
        if(pago.estado === "PAGADO"){
            return res.status(400).json({ message: 'El pago ya ha sido realizado' });
        }
        if(pago.estado === "RECHAZADO"){
            return res.status(400).json({ message: 'El pago ya ha sido rechazado, intenta haciendo otro pedido' });
        }
        pago.estado = "PAGADO";
        pago.referencia = referencia;
        pago.fecha_pago = new Date();

        const pedido = await PedidoProveedor.findByPk(pago.id_pedido);
        if (!pedido) {
            return res.status(404).json({ message: 'Pedido no encontrado' });
        }
        pedido.estado = "CONFIRMADO";
        await pedido.save();
        await pago.save();
        res.status(200).json({ message: 'Pago actualizado exitosamente', pago });
    } catch (error) {
        res.status(500).json({ message: 'Error al actualizar el pago', error: error.message });
    }
};
        

//listar todos los pagos Proveedor 
const listarPagosProveedor = async (req, res) => {
    try {
        const pagos = await PagosProveedor.findAll();
        res.status(200).json(pagos);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    crearPedido,
    crearDetallePedido,
    actualizarDetallePedido,
    obtenerDetallePedido,
    listarPedidos,
    realizarPago,
    actualizarPago,
    listarPagosProveedor
};