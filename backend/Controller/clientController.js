const {Rol, TipoMantenimiento, Vehiculo, AsignacionTrabajo, RegistroServicioVehiculo} = require('../Model');
const {Usuario, UsuarioEspecialista, TipoTecnico, AreaEspecialista, Persona, sequelize} = require('../Model');
const {CotizacionServicioVehiculo, ComentariosSeguimientoCliente, ServiciosAdicionales } = require("../Model")
const {TrabajosCotizacion, FacturaServicioVehiculo, PagosFactura, Repuesto, SolicitudUsoRepuesto} = require("../Model")
const {SintomasDetectados, DaniosAdicionales, Inventario, MantenimientoAdicional} = require('../Model');
//VER MIS VEHICULOS
const getMyVehicles = async (req, res) => {
  try {
    //obtener el id del cliente
    const { id } = req.params;
    //buscar los vehiculos del cliente
    const vehicles = await Vehiculo.findAll(
        { 
            where: { id_cliente: id },
            attributes: ['id_vehiculo', 'modelo', 'marca', 'placa', 'anio', 'color', 'numero_serie', 'kilometraje', 'fecha_registro', 'estado'] 
        });
    res.json(vehicles);
  } catch (error) {
    console.error("Error fetching vehicles:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};


//SERVICIOS ACTIVOS
const getAllServices = async (req, res) => {
  try {
    const { id } = req.params;

    // Buscar registros de servicio activos para el cliente
    const activeServices = await RegistroServicioVehiculo.findAll({
      attributes: ['id_registro', 'descripcion_problema', 'fecha_ingreso', 'fecha_estimada_finalizacion', 'estado'],
      include: [
        {
          model: Vehiculo,
          attributes: ['modelo', 'marca', 'placa'],
          where: { id_cliente: id }
        },
        {
          model: AsignacionTrabajo,
          attributes: ['id_asignacion', 'descripcion', 'estado', 'precio'],
          include: [
            {
              model: Usuario,
              attributes: ['id_usuario', 'nombre_usuario'],
              as: 'empleadoAsignado',
              include: [
                {
                  model: Persona,
                  attributes: ['nombre', 'apellido']
                }
              ]
            }
          ]
        }
      ]
    });

    res.json(activeServices);
  } catch (error) {
    console.error("Error fetching active services:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

const authorizeService = async (req, res) => {
  try {
    //ID del servicio a autorizar
    const { id } = req.params;

    // Lógica para autorizar el servicio
    const result = await RegistroServicioVehiculo.update(
      { estado: 'EN_PROCESO' },
      { where: { id_registro: id } }
    );

    res.json({ message: "Service authorized successfully", result });
  } catch (error) {
    console.error("Error authorizing service:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

const notAuthorizeService = async (req, res) => {
  try {
    //Empezamos una transaccion
    const transaction = await sequelize.transaction();
    //ID del servicio a no autorizar
    const { id } = req.params;

    // Lógica para no autorizar el servicio
    const result = await RegistroServicioVehiculo.update(
      { estado: 'CANCELADO' },
      { where: { id_registro: id } },
      transaction
    );

    //Modificamos todas las tareas asignadas en el servicio
    await AsignacionTrabajo.update(
      { estado: 'CANCELADO' },
      { where: { id_registro: id }, transaction }
    );

    await transaction.commit();
    res.json({ message: "Service not authorized successfully", result });
  } catch (error) {
    await transaction.rollback();
    console.error("Error not authorizing service:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

//DETALLE COMPLETO DE LOS SERVICIOS DEL VEHICULO 
const getServicesDetailByVehicle = async (req, res) => {
  try {
    // Obtener el ID del vehículo desde los parámetros de la solicitud
    const { id } = req.params;

    // Buscar registros de servicio y todos sus detalles para el vehículo específico
    const serviceDetails = await RegistroServicioVehiculo.findAll({
      attributes: ['id_registro', 'descripcion_problema', 'fecha_ingreso', 'fecha_estimada_finalizacion'],
      where: { id_vehiculo: id },
      include: [
        {
          model: Vehiculo,
          attributes: ['modelo', 'marca', 'placa']
        },
        {
          model: AsignacionTrabajo,
          attributes: ['id_asignacion', 'descripcion', 'estado', 'precio'],
          include: [
            {
              model: Usuario,
              attributes: ['id_usuario', 'nombre_usuario'],
              as: 'empleadoAsignado',
              include: [
                {
                  model: Persona,
                  attributes: ['nombre', 'apellido']
                }
              ]
            },
            {
              model: TipoMantenimiento,
              attributes: ['id_tipo_trabajo', 'nombre_tipo', 'descripcion']
            },
            {
              model: SintomasDetectados,
              attributes: ['id_sintoma', 'descripcion_sintoma', 'fecha_sintoma', 'severidad']
            },
            {
              model: DaniosAdicionales,
              attributes: ['id_danio', 'descripcion_danio', 'fecha_danio', 'costo_estimado']
            },
            {
              model: SolicitudUsoRepuesto,
              attributes: ['id_solicitud_uso_repuesto', 'descripcion', 'cantidad'],
              include: [
                {
                  model: Inventario,
                  attributes: ['id_inventario_repuesto', 'precio_unitario'],
                  include: [
                    {
                      model: Repuesto,
                      attributes: ['id_repuesto', 'nombre', 'descripcion', 'codigo_parte', 'marca_compatible']
                    }
                  ]
                }
              ]
            }

          ]
        }
      ]
    });

    res.json(serviceDetails);
  } catch (error) {
    console.error("Error fetching service details:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

//COMENTARIOS DE SEGUIMIENTO
//Obtenemos los servicios con los comentarios de seguimiento
const getServicesWithComments = async(req, res) => {
  try {
    // Obtener el ID del cliente desde los parámetros de la solicitud
    const { id } = req.params;

    // Buscar registros de servicio con comentarios de seguimiento
    const activeServices = await RegistroServicioVehiculo.findAll({
      attributes: ['id_registro', 'descripcion_problema', 'fecha_ingreso', 'fecha_estimada_finalizacion'],
      include: [
        {
          model: Vehiculo,
          attributes: ['modelo', 'marca', 'placa'],
          where: { id_cliente: id }
        },
        {
          model: AsignacionTrabajo,
          attributes: ['id_asignacion', 'descripcion', 'estado', 'precio'],
          include: [
            {
              model: Usuario,
              attributes: ['id_usuario', 'nombre_usuario'],
              as: 'empleadoAsignado',
              include: [
                {
                  model: Persona,
                  attributes: ['nombre', 'apellido']
                }
              ]
            }
          ]
        },
        {
            model: ComentariosSeguimientoCliente,
            attributes: ['id_comentario', 'comentario', 'fecha_comentario', 'tipo_comentario']
        }
      ]
    });

    res.json(activeServices);
  } catch (error) {
    console.error("Error fetching active services:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

//Agregar un nuevo comentario de seguimiento
const addFollowComment = async(req, res) => {
  try {
    const { id_registro, id_cliente, comentario, tipo_comentario } = req.body;

    // Crear un nuevo comentario de seguimiento
    const newComment = await ComentariosSeguimientoCliente.create({
      id_registro,
      id_cliente,
      comentario,
      tipo_comentario
    });

    res.status(201).json(newComment);
  } catch (error) {
    console.error("Error adding follow-up comment:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

//SERVICIOS ADICIONALES

//Obtener mis servicios adicionales
const getMyAdditionalServices = async(req, res) => {
  try {
    // Obtener el ID del cliente desde los parámetros de la solicitud
    const { id } = req.params;

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
                        attributes: ['modelo', 'marca', 'placa'],
                        where: { id_cliente: id }
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

//Agregar servicios adcionales
const addAdditionalService = async(req, res) => {
  try {
    const { id_registro, id_tipo_trabajo, descripcion } = req.body;

    // Crear un nuevo servicio adicional
    const newAdditionalService = await ServiciosAdicionales.create({
      id_registro,
      id_tipo_trabajo,
      descripcion
      
    });

    res.status(201).json(newAdditionalService);
  } catch (error) {
    console.error("Error adding additional service:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

//Obtener el tipo de mantenimiento para servicios adicionales
const getMaintenanceTypes = async(req, res) => {
    try {
        const maintenanceTypes = await TipoMantenimiento.findAll({
            attributes: ['id_tipo_trabajo', 'nombre_tipo', 'descripcion', 'precio_base', 'tiempo_estimado']
        });
        res.json(maintenanceTypes);
    } catch (error) {
        console.error("Error fetching maintenance types:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};


//COTIZACIONES

//Obtener mis cotizaciones
const getMyPriceServicesQuotes = async(req, res) => {
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
}

//Solicitar cotizacion
const requestQuote = async(req, res) => {
    try {
        const { id_vehiculo, descripcion_problema } = req.body;

        // Crear una nueva cotización
        const newQuote = await CotizacionServicioVehiculo.create({
            id_vehiculo,
            descripcion_problema
        });

        res.status(201).json(newQuote);
    } catch (error) {
        console.error("Error requesting quote:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

//REALIZAR PAGOS

//Obtenemos todas las facturas del cliente

const getAllInvoices = async(req, res) => {
    try{
        //obtenemos el id del cliente
        const { id } = req.params;

        // Buscar todas las facturas del cliente por medio de su vehiculo
        const invoices = await FacturaServicioVehiculo.findAll({
            attributes: ['id_factura', 'numero_factura', 'fecha_emision', 'fecha_vencimiento', 'subtotal', 'impuestos', 'descuentos', 'total', 'estado_pago', 'metodo_pago_preferido', 'observaciones'],
            include: [
                {
                    model: RegistroServicioVehiculo,
                    attributes: ['id_registro', 'descripcion_problema', 'fecha_ingreso', 'fecha_estimada_finalizacion'],
                    include: [
                        {
                            model: Vehiculo,
                            attributes: ['modelo', 'marca', 'placa'],
                            where: { id_cliente: id }
                        },
                        //obtenemos todos los trabajos asignados a los empleados para el detalle de la factura
                        {
                            model: AsignacionTrabajo,
                            attributes: ['id_asignacion', 'descripcion', 'estado', 'precio'],
                            include: [
                                {
                                    model: Usuario,
                                    attributes: ['id_usuario', 'nombre_usuario'],
                                    as: 'empleadoAsignado',
                                    include: [
                                        {
                                            model: Persona,
                                            attributes: ['nombre', 'apellido']
                                        }
                                    ]
                                },
                                //Daños adicionales
                                {
                                    model: DaniosAdicionales,
                                    attributes: ['id_danio', 'descripcion_danio', 'fecha_danio', 'costo_estimado']
                                },

                                //Mantenimiento adicional
                                {
                                    model: MantenimientoAdicional,
                                    attributes: ['id_mantenimiento_adicional', 'descripcion', 'estado', 'costo_estimado'],
                                    where: { estado: 'APROBADO', estado: 'COMPLETADO' }
                                },
                                //Repuestos usados
                                {
                                    model: SolicitudUsoRepuesto,
                                    attributes: ['id_solicitud_uso_repuesto', 'id_inventario_repuesto', 'cantidad','estado'],
                                    where: { estado: 'APROBADO', estado: 'USADO' },
                                    include:[
                                        {
                                            model: Inventario,
                                            attributes: ['id_inventario_repuesto', 'precio_unitario'],
                                            include: [
                                                {
                                                    model: Repuesto,
                                                    attributes: ['nombre', 'descripcion']
                                                }
                                            ]
                                        }
                                    ]
                                }
                            ]
                        }

                    ]
                }
            ]
        });

        res.json(invoices);
    } catch (error) {
        console.error("Error fetching invoices:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

//Pagamos la factura 
const payInvoice = async (req, res) => {
    const transaction = await sequelize.transaction();
    try {
        const { id_factura,monto_pago, metodo_pago, referencia_pago, id_usuario_registro, observaciones } = req.body;

        //Obtenemos la factura
        const invoice = await FacturaServicioVehiculo.findByPk(id);
        if (!invoice) {
            return res.status(404).json({ error: "Invoice not found" });
        }

        //Verificamos si el estado de la factura no es PAGADO
        if (invoice.estado_pago === 'PAGADO') {
            return res.status(400).json({ error: "Invoice is already paid" });
        }

        //insertamos pago factura
        const payment = await PagoFactura.create({
            id_factura,
            monto_pago,
            metodo_pago,
            referencia_pago,
            id_usuario_registro,
            observaciones
        }, { transaction });

        // Actualizamos el estado de la factura a PAGADO
        invoice.estado_pago = 'PAGADO';
        await invoice.save({ transaction });

        await transaction.commit();
        //enviamos el mensaje y el pago
        res.json({ message: "Invoice paid successfully", payment });
    } catch (error) {
        await transaction.rollback();
        console.error("Error paying invoice:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

//CALIFICAR SERVICIO
const rateService = async (req, res) => {

    try {
        const { id_registro, calificacion } = req.body;
        //Buscamos el servicio

        const service = await RegistroServicioVehiculo.findByPk(id_registro);
        if (!service) {
            return res.status(404).json({ error: "Service not found" });
        }

        //Creamos la calificación
        service.calificacion = calificacion;
        await service.save();

        res.json({ message: "Service rated successfully", service });
    } catch (error) {
        console.error("Error rating service:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};


module.exports = {
    getMyVehicles,
    getAllServices,
    getServicesDetailByVehicle,
    getServicesWithComments,
    addFollowComment,
    getMyAdditionalServices,
    addAdditionalService,
    getMaintenanceTypes,
    getMyPriceServicesQuotes,
    requestQuote,
    getAllInvoices,
    payInvoice,
    rateService,
    authorizeService,
    notAuthorizeService
};