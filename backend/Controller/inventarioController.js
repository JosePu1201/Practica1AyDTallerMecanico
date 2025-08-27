const { Inventario, Repuesto, Usuario, Proveedor, ContactoPersona, SolicitudUsoRepuesto } = require('../Model');
const EmailService = require('../services/emailService');
const { Op, where } = require('sequelize');

//Listar el inventario con cantidad y los repuestos 

const getInventarioRepuesto = async (req, res) => {
    // validar que el incio de sesion sea de un usuario admin 
    try {
        if (!req.session || !req.session.user || !req.session.user.id_usuario) {
            return res.status(401).json({ message: 'No hay una sesión de usuario válida.' });
        }
        const id_usuario = req.session.user.id_usuario;

        //Validar que el usuario sea admin y que si exista en la base de datos
        const usuario = await Usuario.findByPk(id_usuario);
        if (!usuario || usuario.id_rol !== 1) {
            return res.status(403).json({ message: 'Acceso denegado. Solo los administradores pueden acceder a esta ruta.' });
        }
        // Obtener el inventario con los repuestos asociados ordenados por cantidad
        const inventario = await Inventario.findAll({
            include: [{
                model: Repuesto,
                attributes: [
                    'id_repuesto',
                    'nombre',
                    'descripcion',
                ],
                include: [{
                    model: Proveedor,
                    attributes: ['id_proveedor', 'nit', 'id_usuario', 'estado'],
                }],
            }],
            order: [
                ['cantidad', 'DESC'],
            ],
        });
        res.json(inventario);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener el inventario', error: error.message });
    }
}

//Agregar Repuesto al inventario (solo admin)
const agregarRepuestoInventario = async (req, res) => {
    // validar que el incio de sesion sea de un usuario admin 
    try {
        if (!req.session || !req.session.user || !req.session.user.id_usuario) {
            return res.status(401).json({ message: 'No hay una sesión de usuario válida.' });
        }
        const id_usuario = req.session.user.id_usuario;
        //Validar que el usuario sea admin y que si exista en la base de datos
        const usuario = await Usuario.findByPk(id_usuario);
        if (!usuario || usuario.id_rol !== 1) {
            return res.status(403).json({ message: 'Acceso denegado. Solo los administradores pueden acceder a esta ruta.' });
        }
        const { id_repuesto, cantidad } = req.body;
        // Validar que el repuesto exista
        const repuesto = await Repuesto.findByPk(id_repuesto);
        if (!repuesto) {
            return res.status(404).json({ message: 'Repuesto no encontrado' });
        }
        // Verificar si el repuesto ya está en el inventario
        let inventario = await Inventario.findOne({ where: { id_repuesto } });
        if (inventario) {
            return res.status(400).json({ message: 'El repuesto ya existe en el inventario' });
        }
        // Crear nuevo registro en el inventario
        inventario = await Inventario.create({
            id_repuesto,
            cantidad,
            fecha_ultima_actualizacion: new Date(),
        });
        res.status(201).json({ inventario, message: "Repuesto agregado al inventario correctamente" });
    } catch (error) {
        res.status(500).json({ message: 'Error al agregar el repuesto al inventario', error: error.message });
    }
};

//Actualizar cantidad de repuestos en el inventario (solo admin)
const actualizarCantidadRepuesto = async (req, res) => {
    // validar que el incio de sesion sea de un usuario admin 
    try {
        if (!req.session || !req.session.user || !req.session.user.id_usuario) {
            return res.status(401).json({ message: 'No hay una sesión de usuario válida.' });
        }
        const id_usuario = req.session.user.id_usuario;
        //Validar que el usuario sea admin y que si exista en la base de datos
        const usuario = await Usuario.findByPk(id_usuario);
        if (!usuario || usuario.id_rol !== 1) {
            return res.status(403).json({ message: 'Acceso denegado. Solo los administradores pueden acceder a esta ruta.' });
        }
        const { id_repuesto, cantidad } = req.body;
        // Validar que el repuesto exista en el inventario
        const inventario = await Inventario.findOne({ where: { id_repuesto } });
        if (!inventario) {
            return res.status(404).json({ message: 'Repuesto no encontrado en el inventario' });
        }
        // Actualizar la cantidad
        inventario.cantidad = cantidad;
        inventario.fecha_ultima_actualizacion = new Date();
        await inventario.save();
        res.json({
            inventario,
            message: "Cantidad actualizada correctamente"
        });
    } catch (error) {
        res.status(500).json({ message: 'Error al actualizar la cantidad del repuesto', error: error.message });
    }
};

//Consultar alertas de repuestos con bajo stock (solo admin)
const getLowStockAlerts = async (req, res) => {
    // La validación de sesión y rol de administrador ahora es manejada por el middleware.
    try {
        // El umbral puede ser un parámetro de la consulta, con un valor por defecto de 10

        const lowStockItems = await Inventario.findAll({
            where: {
                cantidad: {
                    [Op.lte]: Number(5) // lte = Menor o igual que (Less Than or Equal)
                }
            },
            include: [
                {
                    model: Repuesto,
                    attributes: ['id_repuesto', 'nombre', 'descripcion'],
                    include: [
                        {
                            model: Proveedor,
                            attributes: ['id_proveedor', 'nit', 'id_usuario', 'estado'],
                        },
                    ],
                },
            ],
            order: [['cantidad', 'ASC']], // Ordenar por cantidad ascendente para ver los más bajos primero
        });
        let sendEmail = true;
        // Si se solicita y hay items, enviar correo a los administradores
        if (lowStockItems.length > 0) {
            console.log('Enviando correo a los administradores');
            // Buscar todos los administradores activos
            const admins = await Usuario.findAll({ where: { id_rol: 1, estado: 'ACTIVO' } });
            const adminPersonasIds = admins.map(admin => admin.id_persona);

            // Buscar los correos de esos administradores
            const adminContacts = await ContactoPersona.findAll({ where: { id_persona: adminPersonasIds } });
            const adminEmails = adminContacts.map(contact => contact.correo).filter(Boolean);

            if (adminEmails.length > 0) {
                console.log('Enviando correo a los administradores');
                await EmailService.sendLowStockReport({
                    to: adminEmails.join(','), // Enviar a todos los admins
                    lowStockItems: lowStockItems
                });
            }
        }

        res.json(lowStockItems, message = { sendEmail });
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener los repuestos con bajo stock', error: error.message });
    }
};

//Actualizar precio unitatario de un repuesto (solo admin) --- IGNORE ---
const actualizarPrecioUnitarioRepuesto = async (req, res) => {
    try {
        const { id_repuesto, precio_unitario } = req.body;
        const id_usuario = req.session.user.id_usuario;
        //Validar que el usuario sea admin y que si exista en la base de datos
        const usuario = await Usuario.findByPk(id_usuario);
        if (!usuario || usuario.id_rol !== 1) {
            return res.status(403).json({ message: 'Acceso denegado. Solo los administradores pueden acceder a esta ruta.' });
        }
        // Validar que el repuesto exista
        const repuesto = await Repuesto.findByPk(id_repuesto);
        if (!repuesto) {
            return res.status(404).json({ message: 'Repuesto no encontrado' });
        }
        // Actualizar el precio unitario
        repuesto.precio_unitario = precio_unitario;
        await repuesto.save();
        res.json({ repuesto, message: 'Precio unitario actualizado correctamente' });
    } catch (error) {
        res.status(500).json({ message: 'Error al actualizar el precio unitario del repuesto', error: error.message });
    }
};

//Historial de movimientos de inventario segun estado de SolicitudUsoRepuesto (solo admin) --- IGNORE ---
const historialMovimientosInventario = async (req, res) => {
    try {
        /*
        const id_usuario = req.session.user.id_usuario;
        //Validar que el usuario sea admin y que si exista en la base de datos
        const usuario = await Usuario.findByPk(id_usuario);
        if (!usuario || usuario.id_rol !== 1) {
            return res.status(403).json({ message: 'Acceso denegado. Solo los administradores pueden acceder a esta ruta.' });
        }*/
        // Obtener el historial de movimientos
        const movimientos = await SolicitudUsoRepuesto.findAll({
            where: { estado: 'USADO' },
            attributes: ['fecha_uso', 'cantidad', 'fecha_aprobacion', 'id_usuario_aceptacion'],
            include: [
                {
                    model: Inventario,
                    attributes: ['id_inventario_repuesto'], //  evita dejarlo vacío
                    include: [
                        {
                            model: Repuesto,
                            attributes: ['id_repuesto', 'nombre']
                        }
                    ]
                },
                {
                    model: Usuario,
                    attributes: [['nombre_usuario','NombreUsuarioAceptacion']]
                }
            ],
            order: [['fecha_uso', 'DESC']]
        });


        res.json(movimientos);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener el historial de movimientos de inventario', error: error.message });
    }
};


module.exports = {
    getInventarioRepuesto,
    agregarRepuestoInventario,
    actualizarCantidadRepuesto,
    getLowStockAlerts,
    historialMovimientosInventario
};
