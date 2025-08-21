const { where } = require("sequelize");
const { Vehiculo, Usuario, RegistroServicioVehiculo, CotizacionServicioVehiculo } = require("../Model")


//listar todos los usuraios con rol Cliente
const listarUsuariosClientes = async (req, res) => {
    //validar que el rol de la sesion sea administrador (el rol es un id)
    if (req.session.user.rol !== 1) {
        return res.status(403).json({ error: 'No tienes permiso para realizar esta acción' });
    }
    //paginacion
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;
    try {
        const { count, rows } = await Usuario.findAndCountAll({
            where: { rol: 3, estado: "ACTIVO" }, // 3 es el id del rol cliente
            limit: Number(limit),
            offset: Number(offset)
        });
        return res.json({ total: count, usuarios: rows });
    } catch (error) {
        return res.status(500).json({ error: 'Error al listar usuarios clientes' });
    }
};
//listar vehiculos 
const listarVehiculos = async (req, res) => {
    //validar que el rol de la sesion sea administrador (el rol es un id)
   /* if (req.session.user === undefined) {
        return res.status(401).json({ error: 'No has iniciado sesión' });
    }
    if (req.session.user.rol !== 1) {
        return res.status(403).json({ error: 'No tienes permiso para realizar esta acción' });
    }*/
    //paginacion
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;
    try {
        const { count, rows } = await Vehiculo.findAndCountAll({
            where: { estado: 'ACTIVO' },
            limit: Number(limit),
            offset: Number(offset)
        });
        return res.json({ total: count, vehiculos: rows });
    } catch (error) {
        return res.status(500).json({ error: 'Error al listar vehículos' });
    }
};

//registrar un vehiculo desde el admin
const registrarVehiculo = async (req, res) => {
    /*
        if (req.session.user === undefined) {
            return res.status(401).json({ error: 'No has iniciado sesión' });
        }
        if (req.session.user.rol !== 1) {
            return res.status(403).json({ error: 'No tienes permiso para realizar esta acción' });
        }*/
    //entradas de datos
    const { placa, marca, modelo, anio, color, numero_serie, kilometraje, id_cliente } = req.body;
    if (!placa || !marca || !modelo) {
        return res.status(400).json({ error: 'Placa, marca y modelo son obligatorios' });
    }
    //validar que el id del cliente exista y que tenga el rol cliente
    const cliente = await Usuario.findOne({
        where: {
            id_usuario: id_cliente
        }
    });
    //validar que el cliente tenga el estado activo
    if (!cliente || cliente.id_rol !== 3) { // 3 es el id del rol cliente
        return res.status(400).json({ error: 'Cliente no válido o no tiene el rol de cliente' });
    }
    try {
        const vehiculo = await Vehiculo.create({
            placa,
            marca,
            modelo,
            anio,
            color,
            numero_serie,
            kilometraje,
            id_cliente // Relacionar con el cliente
        });
        return res.status(201).json({ message: 'Vehículo registrado exitosamente', vehiculo });
    } catch (error) {
        console.error('Error al registrar vehículo:', error);
        return res.status(500).json({ error: 'Error al registrar vehículo' });
    }
};

//actualizar vehiculo por id
const actualizarVehiculo = async (req, res) => {
    
    /*if (req.session.user.rol !== 1) {
        return res.status(403).json({ error: 'No tienes permiso para realizar esta acción' });
    }*/
    const { id } = req.params;
    const { placa, marca, modelo, anio, color, numero_serie, kilometraje } = req.body;
    try {
        const vehiculo = await Vehiculo.findByPk(id);
        if (!vehiculo) {
            return res.status(404).json({ error: 'Vehículo no encontrado' });
        }
        //actualizar los datos del vehiculo
        await vehiculo.update({
            placa: placa !== undefined ? placa : vehiculo.placa,
            marca : marca !== undefined ? marca : vehiculo.marca,
            modelo : modelo !== undefined ? modelo : vehiculo.modelo,
            anio: anio !== undefined ? anio : vehiculo.anio,
            color: color !== undefined ? color : vehiculo.color,
            numero_serie: numero_serie !== undefined ? numero_serie : vehiculo.numero_serie,
            kilometraje: kilometraje !== undefined ? kilometraje : vehiculo.kilometraje
        });
        return res.json({ message: 'Vehículo actualizado exitosamente', vehiculo });
    } catch (error) {
        console.error('Error al actualizar vehículo:', error);
        return res.status(500).json({ error: 'Error al actualizar vehículo' });
    }
};

//eliminar vehiculo por id
const eliminarVehiculo = async (req, res) => {
    /*if (req.session.user.rol !== 1) {
        return res.status(403).json({ error: 'No tienes permiso para realizar esta acción' });
    }*/
    const { id } = req.params;
    try {
        
        const vehiculo = await Vehiculo.findByPk(id);
        if (!vehiculo) {
            return res.status(404).json({ error: 'Vehículo no encontrado' });
        }
        if (vehiculo.estado === 'INACTIVO') {
            return res.status(400).json({ error: 'El vehículo ya está eliminado' });
        }
        //verificar si el vehiculo tiene registro de servicio PENDIENTE' o 'EN_PROCESO
        const registroServicio = await RegistroServicioVehiculo.findOne({
            where: {
                id_vehiculo: id,
                estado: ['PENDIENTE', 'EN_PROCESO']
            }
        });
        if (registroServicio) {
            return res.status(400).json({ error: 'No se puede eliminar el vehículo porque tiene un servicio pendiente o en proceso' });
        }
        
        //verificar si el vehiculo tiene cotizacion PENDIENTE' o 'ENVIADO
        const cotizacionServicio = await CotizacionServicioVehiculo.findOne({
            where: {
                id_vehiculo: id,
                estado: ['PENDIENTE', 'ENVIADO']
            }
        });
        console.log("ID del vehículo a eliminar:", id);
        if (cotizacionServicio) {
            return res.status(400).json({ error: 'No se puede eliminar el vehículo porque tiene una cotización pendiente o enviada' });
        }
        //eliminar el vehiculo 
        //cambiar el erstado del vehiculo a inactivo
        await vehiculo.update({ estado: 'INACTIVO' });
        return res.json({ message: 'Vehículo eliminado exitosamente' });
    }
    catch (error) {
        console.error('Error al eliminar vehículo:', error);
        return res.status(500).json({ error: 'Error al eliminar vehículo' });
    }
}

//listar los vehiculos de un cliente por su id
const listarVehiculosPorCliente = async (req, res) => {
    
    /*if (req.session.user.rol !== 1) {
        return res.status(403).json({ error: 'No tienes permiso para realizar esta acción' });
    }*/

        //
    const { id_cliente } = req.params;

    //validar que el id del cliente exista y que tenga el rol cliente
    const cliente = await Usuario.findOne({
        where: {
            id_usuario: id_cliente,
            id_rol: 3 // 3 es el id del rol cliente
        }
    });
    if (!cliente) {
        return res.status(400).json({ error: 'Cliente no válido o no tiene el rol de cliente' });
    }
    //paginacion    
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;
    try {
        const { count, rows } = await Vehiculo.findAndCountAll({
            where: { id_cliente, estado: 'ACTIVO' },
            limit: Number(limit),
            offset: Number(offset)
        });
        return res.json({ total: count, vehiculos: rows });
    } catch (error) {
        return res.status(500).json({ error: 'Error al listar vehículos del cliente' });
    }
};

//buscar vehiculo por placa
const buscarVehiculoPorPlaca = async (req, res) => {
    /*if (req.session.user.rol !== 1) {
        return res.status(403).json({ error: 'No tienes permiso para realizar esta acción' });
    }*/
    const { placa } = req.params;
    try {
        const vehiculo = await Vehiculo.findOne({ where: { placa, estado: 'ACTIVO' } });
        if (!vehiculo) {
            return res.status(404).json({ error: 'Vehículo no encontrado' });
        }
        return res.json({ vehiculo });
    } catch (error) {
        return res.status(500).json({ error: 'Error al buscar vehículo por placa' });
    }
};

//listar los registros de servicio de un vehiculo por su id
const listarRegistrosDeServicioPorVehiculo = async (req, res) => {
    /*if (req.session.user.rol !== 1) {
        return res.status(403).json({ error: 'No tienes permiso para realizar esta acción' });
    }*/
    const { id_vehiculo } = req.params;
    //paginacion
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;
    try {
        const { count, rows } = await RegistroServicioVehiculo.findAndCountAll({
            where: { id_vehiculo },
            limit: Number(limit),
            offset: Number(offset),
            order: [['fecha_ingreso', 'DESC']] // Ordenar por fecha de ingreso descendente
        });
        return res.json({ total: count, registros: rows });
    } catch (error) {
        return res.status(500).json({ error: 'Error al listar registros de servicio del vehículo' });
    }
}

//listar las cotizaciones de servicio de un vehiculo por su id
const listarCotizacionesDeServicioPorVehiculo = async (req, res) => {
    /*if (req.session.user.rol !== 1) {
        return res.status(403).json({ error: 'No tienes permiso para realizar esta acción' });
    }*/
    const { id_vehiculo } = req.params;
    //paginacion
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;
    try {
        const { count, rows } = await CotizacionServicioVehiculo.findAndCountAll({
            where: { id_vehiculo },
            limit: Number(limit),
            offset: Number(offset)
        });
        return res.json({ total: count, cotizaciones: rows });
    } catch (error) {
        return res.status(500).json({ error: 'Error al listar cotizaciones de servicio del vehículo' });
    }
}

//listar todas las cotizciones de servicio hechas a un cliente por su id
const listarCotizacionesDeServicioPorCliente = async (req, res) => {
    /*if (req.session.user.rol !== 1) {
        return res.status(403).json({ error: 'No tienes permiso para realizar esta acción' });
    }*/
    const { id_cliente } = req.params;
    //paginacion    
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;
    try {
        //buscar los vehiculos del cliente 
        const vehiculos = await Vehiculo.findAll({ where: { id_cliente, estado: 'ACTIVO' } });
        const idsVehiculos = vehiculos.map(v => v.id_vehiculo);
        const { count, rows } = await CotizacionServicioVehiculo.findAndCountAll({
            where: { id_vehiculo: idsVehiculos },
            limit: Number(limit),
            offset: Number(offset)
        });
        return res.json({ total: count, cotizaciones: rows });
    } catch (error) {
        return res.status(500).json({ error: 'Error al listar cotizaciones de servicio del cliente' });
    }
}
module.exports = {
    listarVehiculos,
    registrarVehiculo,
    actualizarVehiculo,
    eliminarVehiculo,
    listarVehiculosPorCliente,
    buscarVehiculoPorPlaca,
    listarRegistrosDeServicioPorVehiculo,
    listarCotizacionesDeServicioPorVehiculo,
    listarCotizacionesDeServicioPorCliente
};