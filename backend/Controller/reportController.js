const {Rol, TipoMantenimiento, Vehiculo, AsignacionTrabajo, RegistroServicioVehiculo} = require('../Model');
const {Usuario, UsuarioEspecialista, TipoTecnico, AreaEspecialista, Persona, sequelize} = require('../Model');
const {CotizacionServicioVehiculo, ComentariosSeguimientoCliente, ServiciosAdicionales } = require("../Model")
const {TrabajosCotizacion, FacturaServicioVehiculo, PagosFactura, Repuesto, SolicitudUsoRepuesto} = require("../Model")
const {SintomasDetectados, DaniosAdicionales, Inventario, MantenimientoAdicional} = require('../Model');
const {PagosProveedor, Proveedor, PedidoProveedor, DetallePedido, CatalogoProveedor, ContactoPersona} = require('../Model')
const { Op } = require('sequelize');


//REPORTES DE TRABAJOS

// Reporte de trabajos por período
const getWorksByPeriod = async (req, res) => {
  try {
    //Obtenemos las fechas de inicio y fin y el estado
    const { startDate, endDate, status } = req.query;
    if (!startDate || !endDate) {
      return res.status(400).json({ error: "Se requieren fechas de inicio y fin" });
    }

    const whereClause = {
      fecha_asignacion: {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      }
    };

    // si el estado es proporcionado, lo agregamos a la cláusula where
    if (status) {
      whereClause.estado = status;
    }

    //Obtenemos los trabajos
    const works = await AsignacionTrabajo.findAll({
      where: whereClause,
      include: [
        {
          model: TipoMantenimiento,
          attributes: ['nombre_tipo', 'descripcion']
        },
        {
          model: Usuario,
          as: 'empleadoAsignado',
          attributes: ['id_usuario', 'nombre_usuario'],
          include: [
            {
              model: Persona,
              attributes: ['nombre', 'apellido']
            }
          ]
        },
        {
          model: RegistroServicioVehiculo,
          include: [
            {
              model: Vehiculo,
              attributes: ['marca', 'modelo', 'placa']
            }
          ]
        }
      ],
      order: [['fecha_asignacion', 'DESC']]
    });

    // Calculamos las estadísticas para el reporte
    //Contamos los trabajos por estado
    const completedWorks = works.filter(work => work.estado === 'COMPLETADO').length;
    const pendingWorks = works.filter(work => work.estado === 'PENDIENTE' || work.estado === 'ASIGNADO').length;
    const inProgressWorks = works.filter(work => work.estado === 'EN_PROCESO').length;
    const canceledWorks = works.filter(work => work.estado === 'CANCELADO').length;

    // Creamos el objeto de estadísticas
    const stats = {
      totalWorks: works.length,
      completedWorks,
      pendingWorks,
      inProgressWorks,
      canceledWorks,
      // Calculamos la tasa de finalización
      completionRate: works.length ? (completedWorks / works.length * 100).toFixed(2) + '%' : '0%'
    };

    // Enviamos las estadisticas y los trabajos
    res.json({ 
      stats,
      works
    });
  } catch (error) {
    console.error("Error generating works by period report:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

//Obtenemos el ID del vehículo
const getVehicles = async (req, res) => {
  try {
    const vehicles = await Vehiculo.findAll();
    res.json(vehicles);
  } catch (error) {
    console.error("Error fetching vehicles:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

// Reporte de historial de mantenimiento por vehículo
const getMaintenanceHistoryByVehicle = async (req, res) => {
  try {
    //Obtenemos el ID del vehículo
    const { vehicleId } = req.params;

    // Validamos que se haya proporcionado el ID del vehículo
    if (!vehicleId) {
      return res.status(400).json({ error: "Se requiere ID del vehículo" });
    }

    // Obtenemos los detalles del vehículo
    const vehicle = await Vehiculo.findByPk(vehicleId, {
      include: [
        {
          model: Usuario,
          attributes: ['id_usuario', 'nombre_usuario'],
          include: [
            {
              model: Persona,
              attributes: ['nombre', 'apellido']
            }
          ]
        }
      ]
    });

    if (!vehicle) {
      return res.status(404).json({ error: "Vehículo no encontrado" });
    }

    // Obtenemos todos los registros de servicio para este vehículo
    const serviceRecords = await RegistroServicioVehiculo.findAll({
      where: { id_vehiculo: vehicleId },
      include: [
        {
          model: AsignacionTrabajo,
          include: [
            {
              model: TipoMantenimiento,
              attributes: ['nombre_tipo', 'descripcion']
            },
            {
              model: Usuario,
              as: 'empleadoAsignado',
              attributes: ['id_usuario', 'nombre_usuario'],
              include: [
                {
                  model: Persona,
                  attributes: ['nombre', 'apellido']
                }
              ]
            },
            {
              model: DaniosAdicionales
            },
            {
              model: SolicitudUsoRepuesto,
              include: [
                {
                  model: Inventario,
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
      ],
      order: [['fecha_ingreso', 'DESC']]
    });

    // Creamos el objeto de estadísticas
    const totalServices = serviceRecords.length;
    const completedServices = serviceRecords.filter(record => record.estado === 'COMPLETADO').length;

    // Obtenemos los tipos de mantenimiento más comunes
    const maintenanceTypes = {};
    serviceRecords.forEach(record => {
      record.AsignacionTrabajos.forEach(work => {
        const type = work.TipoMantenimiento?.nombre_tipo || 'Desconocido';
        maintenanceTypes[type] = (maintenanceTypes[type] || 0) + 1;
      });
    });

    // Obtenemos los tipos de mantenimiento más comunes
    const mostCommonMaintenanceTypes = Object.entries(maintenanceTypes)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([type, count]) => ({ type, count }));

    // Obtenemos el historial de reparaciones
    const repairHistory = serviceRecords.map(record => ({
      serviceId: record.id_registro,
      serviceDate: record.fecha_ingreso,
      estimatedCompletionDate: record.fecha_estimada_finalizacion,
      status: record.estado,
      problemDescription: record.descripcion_problema,
      works: record.AsignacionTrabajos.map(work => ({
        workId: work.id_asignacion,
        workType: work.TipoMantenimiento?.nombre_tipo,
        assignedTo: `${work.empleadoAsignado?.Persona?.nombre || ''} ${work.empleadoAsignado?.Persona?.apellido || ''}`,
        status: work.estado,
        startDate: work.fecha_inicio_real,
        endDate: work.fecha_finalizacion,
        price: work.precio,
        additionalDamages: work.DaniosAdicionales.map(damage => ({
          description: damage.descripcion_danio,
          cost: damage.costo_estimado
        })),
        partsUsed: work.SolicitudUsoRepuestos.map(part => ({
          partName: part.Inventario?.Repuesto?.nombre,
          quantity: part.cantidad,
          unitPrice: part.Inventario?.precio_unitario
        }))
      }))
    }));

    res.json({
      vehicle: {
        id: vehicle.id_vehiculo,
        brand: vehicle.marca,
        model: vehicle.modelo,
        year: vehicle.anio,
        plate: vehicle.placa,
        owner: `${vehicle.Usuario?.Persona?.nombre || ''} ${vehicle.Usuario?.Persona?.apellido || ''}`
      },
      stats: {
        totalServices,
        completedServices,
        completionRate: totalServices ? (completedServices / totalServices * 100).toFixed(2) + '%' : '0%',
        mostCommonMaintenanceTypes
      },
      repairHistory
    });
  } catch (error) {
    console.error("Error generating maintenance history report:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

//Obtenemos los usuarios de tipo empleado y especialista
const getMechanics = async (req, res) => {
    try {
        const mechanics = await Usuario.findAll({
            include: [
                {
                    model: Rol,
                    where: {
                        nombre: ['EMPLEADO', 'ESPECIALISTA']
                    }
                },
                {
                    model: Persona,
                    attributes: ['nombre', 'apellido']
                }
            ]
        });
        res.json(mechanics);
    } catch (error) {
        console.error("Error fetching mechanics:", error);
        res.status(500).json({ error: "Error interno del servidor" });
    }
};

// Reporte de trabajos realizados (fecha, tipo, mecánico)
const getCompletedWorks = async (req, res) => {
  try {

    const { startDate, endDate, mechanicId } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({ error: "Se requieren fechas de inicio y fin" });
    }

    const whereClause = {
      estado: 'COMPLETADO',
      fecha_finalizacion: {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      }
    };

    // Si se proporciona un ID de mecánico, filtramos por ese ID
    if (mechanicId) {
      whereClause.id_usuario_empleado = mechanicId;
    }

    // Obtenemos los trabajos completados
    const completedWorks = await AsignacionTrabajo.findAll({
      where: whereClause,
      include: [
        {
          model: TipoMantenimiento,
          attributes: ['nombre_tipo', 'descripcion']
        },
        {
          model: Usuario,
          as: 'empleadoAsignado',
          attributes: ['id_usuario', 'nombre_usuario'],
          include: [
            {
              model: Persona,
              attributes: ['nombre', 'apellido']
            }
          ]
        },
        {
          model: RegistroServicioVehiculo,
          include: [
            {
              model: Vehiculo,
              attributes: ['marca', 'modelo', 'placa']
            }
          ]
        }
      ],
      order: [['fecha_finalizacion', 'DESC']]
    });

    // Agrupamos los trabajos por mecánico
    const worksByMechanic = {};
    completedWorks.forEach(work => {
      const mechanicName = `${work.empleadoAsignado?.Persona?.nombre || ''} ${work.empleadoAsignado?.Persona?.apellido || ''}`;
      if (!worksByMechanic[mechanicName]) {
        worksByMechanic[mechanicName] = [];
      }
      worksByMechanic[mechanicName].push({
        workId: work.id_asignacion,
        workType: work.TipoMantenimiento?.nombre_tipo,
        description: work.descripcion,
        assignmentDate: work.fecha_asignacion,
        completionDate: work.fecha_finalizacion,
        vehicle: `${work.RegistroServicioVehiculo?.Vehiculo?.marca || ''} ${work.RegistroServicioVehiculo?.Vehiculo?.modelo || ''} (${work.RegistroServicioVehiculo?.Vehiculo?.placa || ''})`,
        price: work.precio
      });
    });

    // Agrupamos los trabajos por tipo de mantenimiento
    const worksByType = {};
    completedWorks.forEach(work => {
      const workType = work.TipoMantenimiento?.nombre_tipo || 'Desconocido';
      if (!worksByType[workType]) {
        worksByType[workType] = 0;
      }
      worksByType[workType]++;
    });


    res.json({
      totalCompletedWorks: completedWorks.length,
      worksByType,
      worksByMechanic,
      completedWorks: completedWorks.map(work => ({
        workId: work.id_asignacion,
        workType: work.TipoMantenimiento?.nombre_tipo,
        mechanic: `${work.empleadoAsignado?.Persona?.nombre || ''} ${work.empleadoAsignado?.Persona?.apellido || ''}`,
        assignmentDate: work.fecha_asignacion,
        startDate: work.fecha_inicio_real,
        completionDate: work.fecha_finalizacion,
        vehicle: `${work.RegistroServicioVehiculo?.Vehiculo?.marca || ''} ${work.RegistroServicioVehiculo?.Vehiculo?.modelo || ''} (${work.RegistroServicioVehiculo?.Vehiculo?.placa || ''})`,
        price: work.precio,
        observations: work.observaciones_finalizacion
      }))
    });
  } catch (error) {
    console.error("Error generating completed works report:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};


//REPORTES DE FACTURACIÓN

// Reporte de ingresos y egresos por período
const getIncomeExpensesByPeriod = async (req, res) => {
  try {
    //Obtenemos las fechas de inicio y fin
    const { startDate, endDate } = req.query;

    // Validamos las fechas
    if (!startDate || !endDate) {
      return res.status(400).json({ error: "Se requieren fechas de inicio y fin" });
    }

    // Obtenemos todas las facturas pagadas (ingresos)
    const invoices = await FacturaServicioVehiculo.findAll({
      where: {
        estado_pago: 'PAGADO',
        fecha_emision: {
          [Op.between]: [new Date(startDate), new Date(endDate)]
        }
      },
      include: [
        {
          model: RegistroServicioVehiculo,
          include: [
            {
              model: Vehiculo,
              attributes: ['marca', 'modelo', 'placa'],
              include: [
                {
                  model: Usuario,
                  attributes: ['id_usuario', 'nombre_usuario'],
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
        }
      ],
      order: [['fecha_emision', 'DESC']]
    });

    // Obtenemos todos los pagos a proveedores (egresos)
    const providerPayments = await PagosProveedor.findAll({
      where: {
        fecha_pago: {
          [Op.between]: [new Date(startDate), new Date(endDate)]
        }
      },
      include: [
        {
          model: PedidoProveedor,
          include: [
            {
              model: Proveedor,
              include: [
                {
                  model: Usuario,
                  attributes: ['id_usuario', 'nombre_usuario'],
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
        },
        {
          model: Usuario,
          attributes: ['id_usuario', 'nombre_usuario']
        }
      ],
      order: [['fecha_pago', 'DESC']]
    });

    // Calcular ingresos totales
    const totalIncome = invoices.reduce((sum, invoice) => sum + Number(invoice.total || 0), 0);

    // Calcular egresos totales
    const totalExpenses = providerPayments.reduce((sum, payment) => sum + Number(payment.monto || 0), 0);

    // Calcular utilidad neta
    const netProfit = totalIncome - totalExpenses;

    // Agrupar ingresos por día
    const incomeByDay = {};
    invoices.forEach(invoice => {
      const day = new Date(invoice.fecha_emision).toISOString().split('T')[0];
      incomeByDay[day] = (incomeByDay[day] || 0) + Number(invoice.total || 0);
    });

    // Agrupar egresos por día
    const expensesByDay = {};
    providerPayments.forEach(payment => {
      const day = new Date(payment.fecha_pago).toISOString().split('T')[0];
      expensesByDay[day] = (expensesByDay[day] || 0) + Number(payment.monto || 0);
    });

    // Crear resumen diario para gráficos
    const allDays = [...new Set([...Object.keys(incomeByDay), ...Object.keys(expensesByDay)])].sort();
    const dailySummary = allDays.map(day => ({
      date: day,
      income: incomeByDay[day] || 0,
      expenses: expensesByDay[day] || 0,
      profit: (incomeByDay[day] || 0) - (expensesByDay[day] || 0)
    }));

    res.json({
      summary: {
        totalIncome,
        totalExpenses,
        netProfit,
        profitMargin: totalIncome ? (netProfit / totalIncome * 100).toFixed(2) + '%' : '0%'
      },
      dailySummary,
      invoices: invoices.map(invoice => ({
        invoiceId: invoice.id_factura,
        invoiceNumber: invoice.numero_factura,
        date: invoice.fecha_emision,
        customer: `${invoice.RegistroServicioVehiculo?.Vehiculo?.Usuario?.Persona?.nombre || ''} ${invoice.RegistroServicioVehiculo?.Vehiculo?.Usuario?.Persona?.apellido || ''}`,
        vehicle: `${invoice.RegistroServicioVehiculo?.Vehiculo?.marca || ''} ${invoice.RegistroServicioVehiculo?.Vehiculo?.modelo || ''} (${invoice.RegistroServicioVehiculo?.Vehiculo?.placa || ''})`,
        subtotal: invoice.subtotal,
        taxes: invoice.impuestos,
        discounts: invoice.descuentos,
        total: invoice.total,
        paymentMethod: invoice.metodo_pago_preferido
      })),
      expenses: providerPayments.map(payment => ({
        paymentId: payment.id_pago_proveedor,
        date: payment.fecha_pago,
        provider: payment.PedidoProveedor?.Proveedor?.Persona?.nombre || 'No disponible',
        amount: payment.monto,
        reference: payment.referencia,
        paymentMethod: payment.metodo_pago,
        registeredBy: payment.Usuario?.nombre_usuario,
        observations: payment.observaciones
      }))
    });
  } catch (error) {
    console.error("Error generating income and expenses report:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

// Obtenemos proveedores
const getProviders = async (req, res) => {
  try {
    const providers = await Proveedor.findAll(
        {
            attributes: ['id_proveedor'],
          include: [
            {
              model: Usuario,
              attributes: ['id_usuario', 'nombre_usuario']
            }
          ]
        }
    );
    res.json(providers);
  } catch (error) {
    console.error("Error fetching providers:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

// Reporte de egresos a proveedores
const getProviderExpenses = async (req, res) => {
  try {
    //Obtenemos las fechas de inicio y fin y el ID del proveedor
    const { startDate, endDate, providerId } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({ error: "Se requieren fechas de inicio y fin" });
    }

    // Construimos la cláusula WHERE
    const whereClause = {
      fecha_pago: {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      }
    };

    // Construimos la cláusula INCLUDE
    const includeClause = [
      {
        model: PedidoProveedor,
        include: [
          {
            model: Proveedor,
            attributes: ['id_proveedor'],
            include: [
              {
                model: Usuario,
                attributes: ['id_usuario', 'nombre_usuario']
              }
            ]
          },
          {
            model: DetallePedido,
            include: [
              {
                model: CatalogoProveedor,
                include: [
                  {
                    model: Repuesto,
                    attributes: ['nombre', 'descripcion', 'codigo_parte']
                  }
                ]
              }
            ]
          }
        ]
      },
      {
        model: Usuario,
        attributes: ['id_usuario', 'nombre_usuario']
      }
    ];

    // Si se proporciona un ID de proveedor, filtramos por ese ID
    if (providerId) {
      includeClause[0].where = { id_proveedor: providerId };
    }

    // Buscamos los pagos de proveedores
    const providerPayments = await PagosProveedor.findAll({
      where: whereClause,
      include: includeClause,
      order: [['fecha_pago', 'DESC']]
    });

    // Agrupamos los pagos por proveedor
    const paymentsByProvider = {};
    providerPayments.forEach(payment => {
      const providerName = payment.PedidoProveedor?.Proveedor?.Usuario?.nombre_usuario || 'Desconocido';
      if (!paymentsByProvider[providerName]) {
        paymentsByProvider[providerName] = {
          providerId: payment.PedidoProveedor?.Proveedor?.id_proveedor,
          providerName,
          totalPaid: 0,
          payments: []
        };
      }

      console.log(payment.monto);

      // Agrupamos los pagos por proveedor
      paymentsByProvider[providerName].totalPaid += Number(payment.monto || 0);
      paymentsByProvider[providerName].payments.push({
        paymentId: payment.id_pago_proveedor,
        date: payment.fecha_pago,
        amount: payment.monto,
        reference: payment.referencia_pago,
        paymentMethod: payment.metodo_pago,
        registeredBy: payment.Usuario?.nombre_usuario,
        observations: payment.observaciones
      });
    });

    // Calculamos el total de gastos
    const totalExpenses = providerPayments.reduce((sum, payment) => sum + Number(payment.monto || 0), 0);

    res.json({
      summary: {
        totalExpenses,
        totalProviders: Object.keys(paymentsByProvider).length,
        topProviders: Object.values(paymentsByProvider)
          .sort((a, b) => b.totalPaid - a.totalPaid)
          .slice(0, 5)
          .map(p => ({ name: p.providerName, amount: p.totalPaid }))
      },
      providerExpenses: Object.values(paymentsByProvider),
      allPayments: providerPayments.map(payment => ({
        paymentId: payment.id_pago_proveedor,
        date: payment.fecha_pago,
        provider: payment.PedidoProveedor?.Proveedor?.nombre,
        amount: payment.monto,
        reference: payment.referencia_pago,
        paymentMethod: payment.metodo_pago,
        registeredBy: payment.Usuario?.nombre_usuario,
        orderId: payment.PedidoProveedor?.id_pedido,
        orderDate: payment.PedidoProveedor?.fecha_pedido,
        orderTotal: payment.PedidoProveedor?.total_pedido,
        items: payment.PedidoProveedor?.DetallePedidos?.map(detail => ({
          item: detail.CatalogoProveedor?.Repuesto?.nombre,
          quantity: detail.cantidad,
          unitPrice: detail.precio_unitario,
          subtotal: detail.cantidad * detail.precio_unitario
        }))
      }))
    });
  } catch (error) {
    console.error("Error generating provider expenses report:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};


//REPORTES DE REPUESTOS

// Uso de repuestos por período
const getPartUsageByPeriod = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({ error: "Se requieren fechas de inicio y fin" });
    }

    // Obtenemos todas las solicitudes de uso de repuestos aprobadas y usadas en el período
    const partUsage = await SolicitudUsoRepuesto.findAll({
      where: {
        estado: 'USADO',
        estado: 'APROBADO',
        fecha_uso: {
          [Op.between]: [new Date(startDate), new Date(endDate)]
        }
      },
      include: [
        {
          model: Inventario,
          include: [
            {
              model: Repuesto,
              attributes: ['id_repuesto', 'nombre', 'descripcion', 'codigo_parte', 'marca_compatible']
            }
          ]
        },
        {
          model: AsignacionTrabajo,
          include: [
            {
              model: TipoMantenimiento,
              attributes: ['nombre_tipo']
            },
            {
              model: RegistroServicioVehiculo,
              include: [
                {
                  model: Vehiculo,
                  attributes: ['marca', 'modelo', 'placa']
                }
              ]
            }
          ]
        },
        {
          model: Usuario,
          attributes: ['id_usuario', 'nombre_usuario']
        }
      ],
      order: [['fecha_uso', 'DESC']]
    });

    // Calculamos el total de repuestos usados y el costo total
    const totalPartsUsed = partUsage.reduce((sum, usage) => sum + Number(usage.cantidad || 0), 0);
    const totalCost = partUsage.reduce(
      (sum, usage) => sum + (Number(usage.cantidad || 0) * Number(usage.Inventario?.precio_unitario || 0)), 
      0
    );

    // Agrupamos el uso por repuesto
    const usageByPart = {};
    partUsage.forEach(usage => {
      const partName = usage.Inventario?.Repuesto?.nombre || 'Desconocido';
      if (!usageByPart[partName]) {
        usageByPart[partName] = {
          partId: usage.Inventario?.Repuesto?.id_repuesto,
          partName,
          partCode: usage.Inventario?.Repuesto?.codigo_parte,
          description: usage.Inventario?.Repuesto?.descripcion,
          totalQuantity: 0,
          totalCost: 0,
          usages: []
        };
      }
      
      const quantity = Number(usage.cantidad || 0);
      const unitCost = Number(usage.Inventario?.precio_unitario || 0);
      
      usageByPart[partName].totalQuantity += quantity;
      usageByPart[partName].totalCost += quantity * unitCost;
      usageByPart[partName].usages.push({
        date: usage.fecha_uso,
        quantity,
        unitCost,
        subtotal: quantity * unitCost,
        vehicle: `${usage.AsignacionTrabajo?.RegistroServicioVehiculo?.Vehiculo?.marca || ''} ${usage.AsignacionTrabajo?.RegistroServicioVehiculo?.Vehiculo?.modelo || ''} (${usage.AsignacionTrabajo?.RegistroServicioVehiculo?.Vehiculo?.placa || ''})`,
        workType: usage.AsignacionTrabajo?.TipoMantenimiento?.nombre_tipo,
        approvedBy: usage.Usuario?.nombre_usuario
      });
    });

    // Ordenamos los repuestos por cantidad usada
    const partsSortedByUsage = Object.values(usageByPart)
      .sort((a, b) => b.totalQuantity - a.totalQuantity);

    res.json({
      summary: {
        totalPartsUsed,
        totalCost,
        uniquePartsCount: Object.keys(usageByPart).length,
        mostUsedParts: partsSortedByUsage.slice(0, 10)
      },
      usageByPart: partsSortedByUsage,
      allUsages: partUsage.map(usage => ({
        usageId: usage.id_solicitud_uso_repuesto,
        part: usage.Inventario?.Repuesto?.nombre,
        partCode: usage.Inventario?.Repuesto?.codigo_parte,
        date: usage.fecha_uso,
        quantity: usage.cantidad,
        unitPrice: usage.Inventario?.precio_unitario,
        subtotal: Number(usage.cantidad || 0) * Number(usage.Inventario?.precio_unitario || 0),
        vehicle: `${usage.AsignacionTrabajo?.RegistroServicioVehiculo?.Vehiculo?.marca || ''} ${usage.AsignacionTrabajo?.RegistroServicioVehiculo?.Vehiculo?.modelo || ''} (${usage.AsignacionTrabajo?.RegistroServicioVehiculo?.Vehiculo?.placa || ''})`,
        workType: usage.AsignacionTrabajo?.TipoMantenimiento?.nombre_tipo,
        workId: usage.id_asignacion_trabajo,
        description: usage.descripcion,
        approvedBy: usage.usuarioAceptacion?.nombre_usuario
      }))
    });
  } catch (error) {
    console.error("Error generating part usage report:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

// Repuestos más usados por tipo de vehículo
const getMostUsedPartsByVehicleType = async (req, res) => {
  try {
    // Obtenemos los parámetros de la consulta
    const { brand, model, startDate, endDate } = req.query;
    

    // Creamos la cláusula where base para el rango de fechas
    const whereClause = {};
    if (startDate && endDate) {
      whereClause.fecha_uso = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      };
    }

    whereClause.estado = 'USADO'; // Solo consideramos repuestos usados y aprobados
    whereClause.estado = 'APROBADO';

    // Obtenemos las solicitudes de uso de repuestos aprobadas
    const partUsage = await SolicitudUsoRepuesto.findAll({
      where: whereClause,
      include: [
        {
          model: Inventario,
          include: [
            {
              model: Repuesto,
              attributes: ['id_repuesto', 'nombre', 'descripcion', 'codigo_parte', 'marca_compatible']
            }
          ]
        },
        {
          model: AsignacionTrabajo,
          include: [
            {
              model: RegistroServicioVehiculo,
              include: [
                {
                  model: Vehiculo,
                  attributes: ['marca', 'modelo', 'anio', 'placa'],
                  where: {
                    ...(brand && { marca: brand }),
                    ...(model && { modelo: model })
                  }
                }
              ]
            }
          ]
        }
      ]
    });

    // Agrupamos los repuestos por tipo de vehículo
    const partsByVehicle = {};
    partUsage.forEach(usage => {

      // Obtenemos el vehículo asociado a la solicitud
      const vehicle = usage.AsignacionTrabajo?.RegistroServicioVehiculo?.Vehiculo;
      if (!vehicle) return;

      // Creamos una clave única para el vehículo
      const vehicleKey = `${vehicle.marca || 'Desconocido'} ${vehicle.modelo || 'Desconocido'}`;
      if (!partsByVehicle[vehicleKey]) {
        partsByVehicle[vehicleKey] = {
          brand: vehicle.marca,
          model: vehicle.modelo,
          parts: {}
        };
      }

      // Obtenemos el repuesto asociado a la solicitud
      const part = usage.Inventario?.Repuesto;
      if (!part) return;

      // Creamos una clave única para el repuesto
      const partKey = part.nombre || 'Desconocido';
      if (!partsByVehicle[vehicleKey].parts[partKey]) {
        partsByVehicle[vehicleKey].parts[partKey] = {
          partId: part.id_repuesto,
          partName: part.nombre,
          partCode: part.codigo_parte,
          description: part.descripcion,
          compatibleBrand: part.marca_compatible,
          count: 0,
          totalCost: 0
        };
      }

      // Obtenemos la cantidad y el precio unitario
      const quantity = Number(usage.cantidad || 0);
      const unitPrice = Number(usage.Inventario?.precio_unitario || 0);
      
        // Acumulamos la cantidad y el costo total
      partsByVehicle[vehicleKey].parts[partKey].count += quantity;
      partsByVehicle[vehicleKey].parts[partKey].totalCost += quantity * unitPrice;
    });

    // Convertimos los objetos de partes en arreglos ordenados
    Object.values(partsByVehicle).forEach(vehicleData => {
      vehicleData.parts = Object.values(vehicleData.parts)
        .sort((a, b) => b.count - a.count);
    });

    // Obtenemos las partes más utilizadas en todos los tipos de vehículos
    const allParts = {};
    partUsage.forEach(usage => {
      const part = usage.Inventario?.Repuesto;
      if (!part) return;
      
      const partKey = part.nombre || 'Desconocido';
      if (!allParts[partKey]) {
        allParts[partKey] = {
          partId: part.id_repuesto,
          partName: part.nombre,
          partCode: part.codigo_parte,
          description: part.descripcion,
          compatibleBrand: part.marca_compatible,
          count: 0,
          totalCost: 0,
          vehicleTypes: new Set()
        };
      }
      
      const vehicle = usage.AsignacionTrabajo?.RegistroServicioVehiculo?.Vehiculo;
      if (vehicle) {
        allParts[partKey].vehicleTypes.add(`${vehicle.marca || ''} ${vehicle.modelo || ''}`);
      }
      
      const quantity = Number(usage.cantidad || 0);
      const unitPrice = Number(usage.Inventario?.precio_unitario || 0);
      
      allParts[partKey].count += quantity;
      allParts[partKey].totalCost += quantity * unitPrice;
    });

    // Convertimos el objeto de todas las partes en un arreglo ordenado
    const overallMostUsedParts = Object.values(allParts)
      .map(part => ({
        ...part,
        vehicleTypes: Array.from(part.vehicleTypes)
      }))
      .sort((a, b) => b.count - a.count);

    res.json({
      summary: {
        totalVehicleTypes: Object.keys(partsByVehicle).length,
        overallMostUsedParts: overallMostUsedParts.slice(0, 10)
      },
      partsByVehicleType: partsByVehicle,
      overallMostUsedParts
    });
  } catch (error) {
    console.error("Error generating most used parts by vehicle type report:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};


//REPORTES DE CLIENTES

//Obtenemos los clientes
const getClients = async (req, res) => {
  try {
    const clients = await Usuario.findAll({
      attributes: ['id_usuario', 'nombre_usuario'],
      include: [
        {
          model: Persona,
          attributes: ['id_persona', 'nombre', 'apellido']
        },
        {
          model: Rol,
          attributes: ['id_rol', 'nombre_rol'],
          where: { nombre_rol: 'CLIENTE' }
        }
      ]
    });
    res.json(clients);
  } catch (error) {
    console.error("Error fetching clients:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

// Historial de servicios por cliente
const getServiceHistoryByClient = async (req, res) => {
  try {

    // Obtener ID del cliente
    const { clientId } = req.params;
    
    if (!clientId) {
      return res.status(400).json({ error: "Se requiere ID del cliente" });
    }

    // Obtener detalles del cliente
    const client = await Usuario.findByPk(clientId, {
      include: [
        {
          model: Persona,
          include: [ContactoPersona]
        },
        {
          model: Rol
        }
      ]
    });

    if (!client) {
      return res.status(404).json({ error: "Cliente no encontrado" });
    }

    // Obtener vehículos del cliente
    const vehicles = await Vehiculo.findAll({
      where: { id_cliente: clientId },
      include: [
        {
          model: RegistroServicioVehiculo,
          include: [
            {
              model: AsignacionTrabajo,
              include: [
                {
                  model: TipoMantenimiento,
                  attributes: ['nombre_tipo', 'descripcion']
                },
                {
                  model: Usuario,
                  as: 'empleadoAsignado',
                  attributes: ['id_usuario', 'nombre_usuario'],
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
              model: FacturaServicioVehiculo,
              attributes: ['id_factura', 'numero_factura', 'fecha_emision', 'total', 'estado_pago']
            },
            {
              model: ComentariosSeguimientoCliente,
              attributes: ['id_comentario', 'fecha_comentario', 'tipo_comentario', 'comentario']
            }
          ]
        }
      ]
    });

    // Calcular estadísticas del cliente
    let totalServices = 0;
    let totalCompletedServices = 0;
    let totalSpent = 0;
    let servicesByVehicle = {};

    vehicles.forEach(vehicle => {
        // Calculamos el total de servicios por vehículo
      const vehicleServices = vehicle.RegistroServicioVehiculos || [];
      totalServices += vehicleServices.length;
      totalCompletedServices += vehicleServices.filter(service => service.estado === 'COMPLETADO').length;

      // Calculamos el total gastado en este vehículo
      const vehicleSpent = vehicleServices.reduce((sum, service) => {
        const invoice = service.FacturaServicioVehiculos?.[0];
        return sum + Number(invoice?.total || 0);
      }, 0);
      // Total gastado en este vehículo
      totalSpent += vehicleSpent;

      // Registramos los servicios de este vehículo
      servicesByVehicle[vehicle.id_vehiculo] = {
        vehicleId: vehicle.id_vehiculo,
        brand: vehicle.marca,
        model: vehicle.modelo,
        year: vehicle.anio,
        plate: vehicle.placa,
        servicesCount: vehicleServices.length,
        totalSpent: vehicleSpent,
        serviceHistory: vehicleServices.map(service => ({
          serviceId: service.id_registro,
          serviceDate: service.fecha_ingreso,
          status: service.estado,
          problemDescription: service.descripcion_problema,
          rating: service.calificacion,
          totalAmount: service.FacturaServicioVehiculos?.[0]?.total || 0,
          works: service.AsignacionTrabajos.map(work => ({
            workId: work.id_asignacion,
            workType: work.TipoMantenimiento?.nombre_tipo,
            assignedTo: `${work.empleadoAsignado?.Persona?.nombre || ''} ${work.empleadoAsignado?.Persona?.apellido || ''}`,
            status: work.estado,
            startDate: work.fecha_inicio_real,
            endDate: work.fecha_finalizacion,
            price: work.precio
          })),
          comments: service.ComentariosSeguimientoClientes.map(comment => ({
            commentId: comment.id_comentario,
            date: comment.fecha_comentario,
            type: comment.tipo_comentario,
            text: comment.comentario
          })),
          invoice: service.FacturaServicioVehiculos?.[0] ? {
            invoiceId: service.FacturaServicioVehiculos[0].id_factura,
            invoiceNumber: service.FacturaServicioVehiculos[0].numero_factura,
            date: service.FacturaServicioVehiculos[0].fecha_emision,
            total: service.FacturaServicioVehiculos[0].total,
            paymentStatus: service.FacturaServicioVehiculos[0].estado_pago
          } : null
        }))
      };
    });

    // Agrupamos los tipos de servicios realizados
    const serviceTypes = {};
    vehicles.forEach(vehicle => {
      (vehicle.RegistroServicioVehiculos || []).forEach(service => {
        (service.AsignacionTrabajos || []).forEach(work => {
          const typeName = work.TipoMantenimiento?.nombre_tipo || 'Desconocido';
          if (!serviceTypes[typeName]) {
            serviceTypes[typeName] = 0;
          }
          serviceTypes[typeName]++;
        });
      });
    });

    res.json({
      client: {
        id: client.id_usuario,
        username: client.nombre_usuario,
        fullName: `${client.Persona?.nombre || ''} ${client.Persona?.apellido || ''}`,
        email: client.Persona?.ContactoPersonas?.[0]?.correo,
        phone: client.Persona?.ContactoPersonas?.[0]?.telefono
      },
      summary: {
        totalVehicles: vehicles.length,
        totalServices,
        completionRate: totalServices ? (totalCompletedServices / totalServices * 100).toFixed(2) + '%' : '0%',
        totalSpent,
        averagePerService: totalServices ? (totalSpent / totalServices).toFixed(2) : 0,
        serviceTypesSummary: Object.entries(serviceTypes).map(([type, count]) => ({ type, count }))
      },
      servicesByVehicle
    });
  } catch (error) {
    console.error("Error generating client service history report:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

// Reporte de calificaciones de servicio
const getServiceRatings = async (req, res) => {
  try {
    // Obtener filtros de consulta
    const { startDate, endDate, minRating, maxRating } = req.query;

    // Construir cláusula WHERE
    const whereClause = {
      calificacion: { [Op.not]: null } // Solo incluir servicios con calificaciones
    };
    
    // Filtrar por rango de fechas si se proporciona
    if (startDate && endDate) {
      whereClause.fecha_ingreso = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      };
    }

    // Filtrar por calificación mínima
    if (minRating) {
      whereClause.calificacion = {
        ...whereClause.calificacion,
        [Op.gte]: Number(minRating)
      };
    }

    // Filtrar por calificación máxima
    if (maxRating) {
      whereClause.calificacion = {
        ...whereClause.calificacion,
        [Op.lte]: Number(maxRating)
      };
    }

    // Buscar servicios con calificaciones
    const ratedServices = await RegistroServicioVehiculo.findAll({
      where: whereClause,
      include: [
        {
          model: Vehiculo,
          attributes: ['marca', 'modelo', 'placa'],
          include: [
            {
              model: Usuario,
              attributes: ['id_usuario', 'nombre_usuario'],
              include: [
                {
                  model: Persona,
                  attributes: ['nombre', 'apellido']
                }
              ]
            }
          ]
        }
      ],
      order: [['fecha_ingreso', 'DESC']]
    });

    // Calcular estadísticas básicas de calificaciones
    const totalRatings = ratedServices.length;
    const ratingSum = ratedServices.reduce((sum, service) => sum + Number(service.calificacion || 0), 0);
    const averageRating = totalRatings ? (ratingSum / totalRatings).toFixed(2) : 0;
    
    // Contar calificaciones por puntuación
    const ratingCounts = {
      1: 0, 2: 0, 3: 0, 4: 0, 5: 0
    };
    
    ratedServices.forEach(service => {
      if (service.calificacion >= 1 && service.calificacion <= 5) {
        ratingCounts[service.calificacion]++;
      }
    });

    res.json({
      summary: {
        totalRatedServices: totalRatings,
        averageRating,
        ratingDistribution: ratingCounts
      },
      services: ratedServices.map(service => ({
        serviceId: service.id_registro,
        serviceDate: service.fecha_ingreso,
        problemDescription: service.descripcion_problema,
        rating: service.calificacion,
        customer: `${service.Vehiculo?.Usuario?.Persona?.nombre || ''} ${service.Vehiculo?.Usuario?.Persona?.apellido || ''}`,
        vehicle: `${service.Vehiculo?.marca || ''} ${service.Vehiculo?.modelo || ''} (${service.Vehiculo?.placa || ''})`
      }))
    });
  } catch (error) {
    console.error("Error generating service ratings report:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

module.exports = {
  // Reportes Operativos
  getWorksByPeriod,
  getMaintenanceHistoryByVehicle,
  getCompletedWorks,
  getVehicles,
  
  // Reportes Financieros
  getProviders,
  getIncomeExpensesByPeriod,
  getProviderExpenses,
  
  // Reportes de Inventario
  getPartUsageByPeriod,
  getMostUsedPartsByVehicleType,
  
  // Reportes de Clientes
  getClients,
  getServiceHistoryByClient,
  getServiceRatings
};
        