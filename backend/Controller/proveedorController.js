const { parse } = require('dotenv');
const { Proveedor, Usuario, Repuesto, CatalogoProveedor, Inventario } = require('../Model');
const { PedidoProveedor, DetallePedido, PagosProveedor, sequelize } = require('../Model');
const { Op } = require('sequelize');
//crear un nuevo proveedor 
const crearProveedor = async (req, res) => {
    try {
        const { id_usuario, nit } = req.body;

        //validar que el usuario exista 
        const usuario = await Usuario.findByPk(id_usuario);
        if (!usuario || usuario.estado != "ACTIVO") {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }
        //validar que el el nit no este asignado a otro proveedor 
        const proveedor = await Proveedor.findOne({ where: { nit } });
        if (proveedor) {
            return res.status(400).json({ message: 'Nit ya asignado a otro proveedor' });
        }

        //validar que el usuario no este asigando a un provedor
        const proveedorAsignado = await Proveedor.findOne({ where: { id_usuario } });
        if (proveedorAsignado) {
            return res.status(400).json({ message: 'Usuario ya asignado a un proveedor' });
        }
        if (usuario.id_rol != 5) {
            return res.status(400).json({ message: 'Usuario no tiene permisos para ser un proveedor' });
        }
        //crear proveedor 
        const nuevoProveedor = await Proveedor.create({
            id_usuario,
            nit,
            fecha_registro: new Date(),
        });
        res.status(201).json({ message: 'Proveedor creado exitosamente', data: nuevoProveedor });
    } catch (error) {
        res.status(500).json({ message: 'Error al crear el proveedor', error: error.message });
    }
};

//eliminar proveedor 
const eliminarProveedor = async (req, res) => {
    try {
        const { id_proveedor } = req.params;
        const proveedor = await Proveedor.findByPk(id_proveedor);
        if (!proveedor) {
            return res.status(404).json({ message: 'Proveedor no encontrado' });
        }
        proveedor.estado = "INACTIVO";
        await proveedor.save();
        res.status(200).json({ message: 'Proveedor eliminado exitosamente' });
    } catch (error) {
        res.status(500).json({ message: 'Error al eliminar el proveedor', error: error.message });
    }
};

//crear repuestos 
const crearRepuesto = async (req, res) => {
    try {
        const { id_proveedor } = req.params;
        const { nombre, descripcion, codigo_parte, marca_compatible } = req.body;
        const proveedor = await Proveedor.findOne({
            where: { id_usuario: id_proveedor }
        });
        if (!proveedor) {
            return res.status(404).json({ message: 'Proveedor no encontrado' });
        }
        //console.log(proveedor);
        if (proveedor.estodo === "INACTIVO") {
            return res.status(400).json({ message: 'Proveedor no activo' });
        }
        if (!nombre || !descripcion || !codigo_parte || !marca_compatible) {
            return res.status(400).json({ message: 'Faltan datos' });
        }
        const nuevoRepuesto = await Repuesto.create({
            id_proveedor: proveedor.id_proveedor,
            nombre,
            descripcion,
            codigo_parte,
            marca_compatible,
            fecha_registro: new Date(),
        });
        res.status(201).json({ message: 'Repuesto creado exitosamente', data: nuevoRepuesto });
    } catch (error) {
        res.status(500).json({ message: 'Error al crear el repuesto', error: error.message });
    }
};

//eliminar repuesto 
const eliminarRepuesto = async (req, res) => {
    try {
        const { id_repuesto } = req.params;
        const repuesto = await Repuesto.findByPk(id_repuesto);
        if (!repuesto) {
            return res.status(404).json({ message: 'Repuesto no encontrado' });
        }
        repuesto.estado = "DESCONTINUADO";
        await repuesto.save();
        res.status(200).json({ message: 'Repuesto eliminado exitosamente' });
    } catch (error) {
        res.status(500).json({ message: 'Error al eliminar el repuesto', error: error.message });
    }
};
//actualizar repuesto 
const actualizarRepuesto = async (req, res) => {
    try {
        const { id_repuesto } = req.params;
        const { nombre, descripcion, codigo_parte, marca_compatible } = req.body;
        const repuesto = await Repuesto.findByPk(id_repuesto);
        if (repuesto.estado === "DESCONTINUADO") {
            return res.status(400).json({ message: 'Repuesto Descontinuado' });
        }
        if (!repuesto) {
            return res.status(404).json({ message: 'Repuesto no encontrado' });
        }
        repuesto.nombre = nombre ?? repuesto.nombre;
        repuesto.descripcion = descripcion ?? repuesto.descripcion;
        repuesto.codigo_parte = codigo_parte ?? repuesto.codigo_parte;
        repuesto.marca_compatible = marca_compatible ?? repuesto.marca_compatible;
        await repuesto.save();
        res.status(200).json({ message: 'Repuesto actualizado exitosamente', repuesto });
    } catch (error) {
        res.status(500).json({ message: 'Error al actualizar el repuesto', error: error.message });
    }
};

//listar proveedores
const listarProveedores = async (req, res) => {
    try {
        const proveedores = await Proveedor.findAll({
            include: [
                {
                    model: Usuario,
                    attributes: ['nombre_usuario']
                }
            ]
        });
        res.status(200).json({ message: 'Proveedores listados exitosamente', data: proveedores });
    } catch (error) {
        res.status(500).json({ message: 'Error al listar los proveedores', error: error.message });
    }
};

//listar repuestos pro proveedor 
const listarRepuestosProveedor = async (req, res) => {
    try {
        const { id_proveedor } = req.params;
        const proveedor = await Proveedor.findOne({
            where: { id_usuario: id_proveedor }
        });
        const repuestos = await Repuesto.findAll({
            where: { id_proveedor: proveedor.id_proveedor }
        });
        res.status(200).json({ message: 'Repuestos listados exitosamente', data: repuestos });
    } catch (error) {
        res.status(500).json({ message: 'Error al listar los repuestos', error: error.message });
    }
};



//Agregar repuesto a catalogo proveedor
const agregarRepuesto = async (req, res) => {
    try {
        //console.log(req.session.user); 
        if (!req.session.user || req.session.user.rol != 5 || !req.session) {
            return res.status(401).json({ message: 'No autorizado' });
        }

        const id_usuario = req.session.user.id_usuario;

        //validar que el usuario este asignado a un proveedor 
        const proveedor = await Proveedor.findOne({ where: { id_usuario } });
        if (!proveedor) {
            return res.status(404).json({ message: 'Usuario no tiene proveedor asignado' });
        }
        const id_proveedor = proveedor.id_proveedor;

        const { id_repuesto, precio, cantidad_disponible, tiempo_entrega } = req.body;

        //convertir tiempor entrega a un objeto Date
        const tiempoEntrega = new Date(tiempo_entrega).getTime();
        const repuesto = await Repuesto.findOne({ where: { id_repuesto, id_proveedor } });
        if (!repuesto) {
            return res.status(404).json({ message: 'Repuesto no encontrado o no creado por el proveedor' });
        }
        const catalogoProveedor = await CatalogoProveedor.findOne({ where: { id_proveedor, id_repuesto } });
        if (catalogoProveedor) {
            return res.status(400).json({ message: 'Repuesto ya agregado al catalogo' });
        }
        //agregar repuesto al catalogo proveedor
        const nuevoCatalogoProveedor = await CatalogoProveedor.create({
            id_proveedor,
            id_repuesto,
            fecha_actualizacion: new Date(),
            precio,
            cantidad_disponible,
            tiempo_entrega: tiempoEntrega,
        });

        res.status(200).json({ message: 'Repuesto agregado al catalogo proveedor exitosamente', nuevoCatalogoProveedor });
    } catch (error) {
        res.status(500).json({ message: 'Error al agregar el repuesto al catalogo proveedor', error: error.message });
    }
};

//Lista todos los catalogos, los agrupa por proveedor y repuesto
const listarRepuestosCatalogoProveedor = async (req, res) => {
    try {
        const catalogoProveedor = await CatalogoProveedor.findAll({
            attributes: ['id_catalogo', 'precio', 'cantidad_disponible', 'tiempo_entrega', 'id_proveedor'],
            include: [
                {
                    model: Repuesto,
                    attributes: ['id_repuesto', 'nombre', 'descripcion', 'marca_compatible'],
                    where: {
                        estado: 'ACTIVO',
                    },
                }, {
                    model: Proveedor,
                    attributes: ['nit'],
                    include: [
                        {
                            model: Usuario,
                            attributes: ['nombre_usuario']
                        }
                    ]
                }
            ],
            order: [['id_proveedor', 'ASC']]

        });
        if (!catalogoProveedor) {
            return res.status(404).json({ message: 'Catalogo no encontrado' });
        }
        res.status(200).json({ message: 'Catalogo listados exitosamente', data: catalogoProveedor });
    } catch (error) {
        res.status(500).json({ message: 'Error al listar los catalogos', error: error.message });
    }
};

//lista catalogo por id de usuario este endpoint carga los catalogos del proveeedor por meidio de su id de usuario
const listarCatalogoProveedor = async (req, res) => {
    try {
        const { id_proveedor } = req.params;
        const proveedor = await Proveedor.findOne({
            where: { id_usuario: id_proveedor }
        });
        const catalogoProveedor = await CatalogoProveedor.findAll({
            where: { id_proveedor: proveedor.id_proveedor },
            attributes: ['id_catalogo', 'precio', 'cantidad_disponible', 'tiempo_entrega'],
            include: [
                {
                    model: Repuesto,
                    attributes: ['id_repuesto', 'nombre', 'descripcion', 'marca_compatible'],
                    where: {
                        estado: 'ACTIVO',
                    },
                }
            ],
            order: [['precio', 'ASC']]

        });
        res.status(200).json({ message: 'Catalogo listados exitosamente', data: catalogoProveedor });
    } catch (error) {
        res.status(500).json({ message: 'Error al listar los catalogos', error: error.message });
    }
};

//listar el catalogo de proveedor por medio de su id_proveedor
const listarCatalogoProveedorByIdProveedor = async (req, res) => {
    try {
        const { id_proveedor } = req.params;
        const proveedor = await Proveedor.findOne({
            where: { id_proveedor: id_proveedor }
        });
        const catalogoProveedor = await CatalogoProveedor.findAll({
            where: { id_proveedor: proveedor.id_proveedor },
            attributes: ['id_catalogo', 'precio', 'cantidad_disponible', 'tiempo_entrega'],
            include: [
                {
                    model: Repuesto,
                    attributes: ['id_repuesto', 'nombre', 'descripcion', 'marca_compatible'],
                    where: {
                        estado: 'ACTIVO',
                    },
                }
            ],
            order: [['precio', 'ASC']]

        });
        res.status(200).json({ message: 'Catalogo listados exitosamente', data: catalogoProveedor });
    } catch (error) {
        res.status(500).json({ message: 'Error al listar los catalogos', error: error.message });
    }
};

//Actualizar catalogo por id
const actualizarCatalogoProveedor = async (req, res) => {
    try {
        const { id_catalogo } = req.params;
        const { precio, cantidad_disponible, tiempo_entrega } = req.body;
        const catalogoProveedor = await CatalogoProveedor.findByPk(id_catalogo);
        if (!catalogoProveedor) {
            return res.status(404).json({ message: 'Catalogo no encontrado' });
        }
        if (catalogoProveedor.estado === "DISCONTINUADO") {
            return res.status(400).json({ message: 'Catalogo no encontrado' });
        }
        //actualizar catalogo 
        await catalogoProveedor.update({
            precio: precio ?? catalogoProveedor.precio,
            cantidad_disponible: cantidad_disponible ?? catalogoProveedor.cantidad_disponible,
            tiempo_entrega: tiempo_entrega ?? catalogoProveedor.tiempo_entrega,
            fecha_actualizacion: new Date(),
        });
        res.status(200).json({ message: 'Catalogo actualizado exitosamente', catalogoProveedor });
    } catch (error) {
        res.status(500).json({ message: 'Error al actualizar el catalogo', error: error.message });
    }
};

//listar los pagos de proveedro marcados como  PAgado 
const listarPagosProveedor = async (req, res) => {
    const { id_proveedor } = req.params;
     const proveedor = await Proveedor.findOne({
            where: { id_usuario: id_proveedor }
        });
    try {
        const pedidoProveedor = await PedidoProveedor.findAll({
            where: { id_proveedor:proveedor.id_proveedor },
            include: [
                {
                    model: PagosProveedor,
                    where: {
                        estado: 'PAGADO',
                    },
                },
                {
                    model: DetallePedido,
                },
            ]
        });
        if (!pedidoProveedor) {
            return res.status(404).json({ message: 'Pedido no encontrado' });
        }
        return res.status(200).json({ message: 'Pedido encontrado', pedidoProveedor });

    } catch (error) {
        return res.status(500).json({ message: 'Error al listar los pedidos', error: error.message });
    }
};

//cambia estado pedido a en_transito 
const cambiarEstadoPedidoTransito = async (req, res) => {
    const { id_pedido } = req.params;
    try {
        const pedido = await PedidoProveedor.findByPk(id_pedido);
        if (!pedido) {
            return res.status(404).json({ message: 'Pedido no encontrado' });
        }
        if (pedido.estado === 'EN_TRANSITO') {
            return res.status(400).json({ message: 'Pedido ya enviado' });
        }
        if (pedido.estado === "ENTREGADO") {
            return res.status(400).json({ message: 'Pedido ya entregado' });
        }
        if (pedido.estado === "CANCELADO" || pedido.estado === "PENDIENTE") {
            return res.status(400).json({ message: 'Pedido no puede ser enviado' });
        }
        if (pedido.estado === "PENDIENTE") {
            return res.status(400).json({ message: 'Pedido no puede ser enviado' });
        }
        pedido.estado = 'EN_TRANSITO';
        await pedido.save();
        return res.status(200).json({ message: 'Pedido enviado exitosamente', pedido });
    } catch (error) {
        return res.status(500).json({ message: 'Error al enviar el pedido', error: error.message });
    }
};

// cambiear estado a Entregado 
const cambiarEstadoPedidoEntregado = async (req, res) => {
    const { id_pedido } = req.params;
    const transaccion = await sequelize.transaction();
    try {
        const pedido = await PedidoProveedor.findByPk(id_pedido);
        if (!pedido) {
            transaccion.rollback();
            return res.status(404).json({ message: 'Pedido no encontrado' });

        }
        if (pedido.estado === 'ENTREGADO' || pedido.estado === 'CANCELADO' || pedido.estado === 'PENDIENTE') {
            transaccion.rollback();
            return res.status(400).json({ message: 'Pedido ya entregado' });
        }
        if (pedido.estado === "EN_TRANSITO") {
            pedido.estado = 'ENTREGADO';
            agregarInventario(pedido, res, transaccion);
            await pedido.save();
            transaccion.commit();
            return res.status(200).json({ message: 'Pedido entregado exitosamente', pedido });
        } else {
            transaccion.rollback();
            return res.status(400).json({ message: 'Pedido no puede ser entregado' });
        }

    } catch (error) {
        transaccion.rollback();
        return res.status(500).json({ message: 'Error al enviar el pedido', error: error.message });
    }
};

async function agregarInventario(pedido, res, transaccion) {
    try {
        //Consultar el detalle pedido
        const detallePedido = await DetallePedido.findAll({
            where: { id_pedido: pedido.id_pedido },
            attributes: ['cantidad', 'precio_unitario'],
            include: [
                {
                    model: CatalogoProveedor
                }
            ]
        });

        for (const detalle of detallePedido) {
            const cantidad = detalle.cantidad;
            const id_repuesto = detalle.CatalogoProveedor.id_repuesto;
            const precio_unitario = detalle.precio_unitario;

            //console.log("Buscando inventario con id_repuesto:", id_repuesto);

            const inventario = await Inventario.findOne({
                where: { id_repuesto: parseInt(id_repuesto, 10) }
            });

            if (!inventario) {
                await Inventario.create({
                    id_repuesto,
                    cantidad: cantidad,
                    precio_unitario: parseFloat(precio_unitario) * 1.10,
                    fecha_actualizacion: new Date()
                });
                //console.log("Nuevo inventario creado:", id_repuesto);
            } else {
                inventario.cantidad = parseFloat(inventario.cantidad) + parseFloat(cantidad);
                inventario.fecha_actualizacion = new Date();
                await inventario.save();
                //console.log("Inventario actualizado:", id_repuesto);
            }
        }

        if (!detallePedido) {
            transaccion.rollback();
            return res.status(404).json({ message: 'Detalle de pedido no encontrado' });
        }
    }
    catch (error) {
        transaccion.rollback();
        return res.status(500).json({ message: 'Error al agregar el inventario', error: error.message });
    }
}

//area de cotizaciones 

//sugerir repuestos a admin (sugiere un repuesto del catalogo que no este en nigun detalle pedido)
const sugerirRepuesto = async (req, res) => {
    try {
        const {id_proveedor} = req.params;

        //consultar los poductos de un catalogo que no esten en ningun detalle pedido 
        const catalogosSinPedido = await CatalogoProveedor.findAll({
            where: {
                id_proveedor: id_proveedor
            },
            include: [{
                model: DetallePedido,
                required: false, // Esto asegura que Sequelize use un LEFT JOIN
                attributes: []   // No necesitamos los datos del detalle del pedido, solo queremos saber si existe
            },{
                model: Repuesto,
                attributes: [ 'nombre','marca_compatible'],
                where:{
                    estado:'ACTIVO',
                }
            }],
            // La condición para excluir es que la clave primaria de DetallePedido sea nula
            where: {
                id_proveedor: id_proveedor,
                [Op.and]: [
                    { '$DetallePedidos.id_detalle_pedido$': null }
                ]
            }
        });

        //console.log(catalogosSinPedido);
        //devolver los productos 
        return res.status(200).json({ message: 'Repuestos sugeridos',Detalle:'En base a tus compras anterirores y debido a que eres nuestro mejor cliente te sugerimos estas piezas que aun no adquieres con nosotros, recuerda que somos tu mejor opciom', catalogosSinPedido });

    }catch (error) {
        return res.status(500).json({ message: 'Error al sugerir repuesto', error: error.message });
    }
}
module.exports = {
    crearProveedor,
    agregarRepuesto,
    eliminarProveedor,
    eliminarRepuesto,
    listarRepuestosProveedor,
    listarProveedores,
    actualizarRepuesto,
    crearRepuesto,
    listarRepuestosCatalogoProveedor,
    listarCatalogoProveedor,
    actualizarCatalogoProveedor,
    listarPagosProveedor,
    listarCatalogoProveedorByIdProveedor,
    cambiarEstadoPedidoEntregado,
    cambiarEstadoPedidoTransito,
    sugerirRepuesto
};