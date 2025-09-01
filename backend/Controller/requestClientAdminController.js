const {Rol, TipoMantenimiento, Vehiculo, AsignacionTrabajo, RegistroServicioVehiculo} = require('../Model');
const {Usuario, UsuarioEspecialista, TipoTecnico, AreaEspecialista, Persona, sequelize} = require('../Model');
const {CotizacionServicioVehiculo, ComentariosSeguimientoCliente, ServiciosAdicionales } = require("../Model")
const {TrabajosCotizacion, FacturaServicioVehiculo, PagosFactura, Repuesto, SolicitudUsoRepuesto} = require("../Model")
const {SintomasDetectados, DaniosAdicionales, Inventario, MantenimientoAdicional} = require('../Model');

/*
Aceptar servicios adicionales
Realizar las cotizaciones
*/

const getAdditionalServices = async(req, res) => {
  try {
    // Obtener el ID del cliente desde los parámetros de la solicitud

    // Buscar servicios adicionales para el cliente
    const additionalServices = await ServiciosAdicionales.findAll({
        attributes: ['id_servicio_adicional', 'id_registro', 'id_tipo_trabajo', 'descripcion', 'estado', 'fecha_solicitud', 'costo_estimado'],
        include:[
            {
                model: RegistroServicioVehiculo,
                attributes: ['id_registro', 'descripcion_problema', 'fecha_ingreso', 'fecha_estimada_finalizacion'],
                include:[
                    {
                        model: Vehiculo,
                        attributes: ['modelo', 'marca', 'placa']
                    }
                ]
            },{
                model: TipoMantenimiento,
                attributes: ['id_tipo_trabajo', 'nombre_tipo', 'descripcion', 'precio_base', 'tiempo_estimado']
            }
        ]
    });

    res.json(additionalServices);
  } catch (error) {
    console.error("Error fetching additional services:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

const getTipoMantenimiento = async (req, res) => {
    try {
        const tipos = await TipoMantenimiento.findAll({
            where: { estado: 'ACTIVO' }
        });
        res.json(tipos);
    } catch (error) {
        console.error('Error al obtener tipos de mantenimiento:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

const acceptAdditionalService = async(req, res) => {
  try {
    const transaction = await sequelize.transaction();
    const { id_servicio_adicional, id_registro, id_tipo_trabajo, id_usuario_empleado, id_admin_asignacion, descripcion, precio } = req.body;

    //Asignamos el trabajo
    const newAssignment = await AsignacionTrabajo.create({
            id_tipo_trabajo,
            id_registro,
            id_usuario_empleado,
            id_admin_asignacion,
            descripcion,
            precio
        },{transaction} );

    // Buscar el servicio adicional por ID
    const service = await ServiciosAdicionales.findByPk(id_servicio_adicional);
    if (!service) {
      return res.status(404).json({ error: "Service not found" });
    }

    // Actualizar el estado del servicio a "APROBADO"
    service.estado = "APROBADO";
    await service.save({ transaction });

    await transaction.commit();

    res.json({ message: "Service accepted successfully", assignment: newAssignment });

  } catch (error) {
    await transaction.rollback();
    console.error("Error accepting additional service:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

const declineAdditionalService = async(req, res) => {
  try {
    const transaction = await sequelize.transaction();
    const { id } = req.params;

    // Buscar el servicio adicional por ID
    const service = await ServiciosAdicionales.findByPk(id);
    if (!service) {
      return res.status(404).json({ error: "Service not found" });
    }

    // Actualizar el estado del servicio a "RECHAZADO"
    service.estado = "RECHAZADO";
    await service.save({ transaction });

    await transaction.commit();

    res.json({ message: "Service declined successfully" });

  } catch (error) {
    await transaction.rollback();
    console.error("Error declining additional service:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

//Realizar cotizaciones
//Obtenemos todas las cotizaciones
const getPriceServicesQuotes = async(req, res) => {
    try {
        // Obtener el ID del cliente desde los parámetros de la solicitud
        const { id } = req.params;

        // Buscar cotizaciones para el cliente
        const myQuotes = await CotizacionServicioVehiculo.findAll({
            attributes: ['id_registro_cotizacion', 'descripcion_problema', 'estado', 'fecha_cotizacion', 'fecha_vencimiento', 'total_cotizacion'],
            include: [
                {
                    model: Vehiculo,
                    attributes: ['modelo', 'marca', 'placa'],
                    where: { id_cliente: id }
                },
                {
                    model: TrabajosCotizacion,
                    attributes: ['id_trabajo_cotizacion', 'id_tipo_trabajo', 'estado', 'fecha_asignacion', 'fecha_finalizacion', 'precio', 'descripcion_trabajo'],
                    include: [
                        {
                            model: TipoMantenimiento,
                            attributes: ['nombre_tipo', 'descripcion']
                        }
                    ]
                }
            ]
        });

        res.json(myQuotes);
    } catch (error) {
        console.error("Error fetching price service quotes:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

const addWorkToQuote = async(req, res) => {
    try {
        const { id_registro_cotizacion, id_tipo_trabajo, estado, fecha_asignacion, fecha_finalizacion, precio, descripcion_trabajo } = req.body;
        const newWork = await TrabajosCotizacion.create({
            id_registro_cotizacion,
            id_tipo_trabajo,
            estado,
            fecha_asignacion,
            fecha_finalizacion,
            precio,
            descripcion_trabajo
        });
        res.json(newWork);
    } catch (error) {
        console.error("Error adding work to quote:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

const sendQuote = async(req, res) => {
    try {
        const { id_registro_cotizacion } = req.params;

        //Actualizar el estado de la cotización
        const quote = await CotizacionServicioVehiculo.findByPk(id_registro_cotizacion);
        if (!quote) {
            return res.status(404).json({ error: "Quote not found" });
        }
        quote.estado = "ENVIADO";
        await quote.save();

        res.json({ message: "Quote sent successfully" });
    } catch (error) {
        console.error("Error sending quote:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};


module.exports = {
    acceptAdditionalService,
    declineAdditionalService,
    getPriceServicesQuotes,
    addWorkToQuote,
    sendQuote,
    getAdditionalServices,
    getTipoMantenimiento
};