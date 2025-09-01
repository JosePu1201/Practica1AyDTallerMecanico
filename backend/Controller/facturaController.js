const { parse } = require('dotenv');
const { FacturaServicioVehiculo, ServiciosAdicionales, Inventario, SolicitudUsoRepuesto, AsignacionTrabajo, MantenimientoAdicional, Vehiculo } = require('../Model')
const { RegistroServicioVehiculo, PagosFactura } = require('../Model');

//Obtener los registro de servicios completados
const obtenerServiciosCompletados = async (req, res) => {
    try {
        const servicios = await RegistroServicioVehiculo.findAll(
            { 
                where: { estado: 'COMPLETADO' },
                attributes: ['id_registro', 'id_vehiculo', 'descripcion_problema', 'calificacion', 'estado', 'fecha_ingreso', 'fecha_estimada_finalizacion', 'fecha_finalizacion_real', 'observaciones_iniciales', 'prioridad'],
                include: [
                    {
                        model: Vehiculo,
                        attributes: ['id_vehiculo', 'marca', 'modelo', 'anio', 'color']
                    },
                    {
                        model: AsignacionTrabajo,
                        attributes: ['id_asignacion', 'descripcion', 'precio']
                    }
                ]
            });
        res.json(servicios);
    } catch (error) {
        console.error('Error al obtener los servicios completados:', error);
        res.status(500).json({ message: 'Error al obtener los servicios completados' });
    }
};


//hacer sumatoria para factura de servicios 
const generarFacturaServicios = async (req, res) => {
    try {
        // console.log('generarFacturaServicios');
        const { id_registro, impuestos, descuento, observaciones, metodo_pago } = req.body;
        if (!id_registro) {
            return res.status(400).json({ message: 'El id_registro es obligatorio' });
        }
        //validar que no exista una factura de servicios para ese id_registro
        const factura = await FacturaServicioVehiculo.findOne({ where: { id_registro } });
        if (factura) {
            return res.status(400).json({ message: 'Ya existe una factura de servicios para este registro' });
        }
        //validar que registro existe y tiene un estado Completado 
        const registro = await RegistroServicioVehiculo.findOne({ where: { id_registro, estado: 'COMPLETADO' } });
        if (!registro) {
            return res.status(400).json({ message: 'El registro no existe o no está completado' });
        }
        // Obtener todos los servicios adicionales asociados al id_registro
        const servicios = await ServiciosAdicionales.findAll({ where: { id_registro, estado: 'COMPLETADO' } });
        //console.log('servicios:',servicios);
        if (servicios.length === 0) {
            //return { total: 0, detalles: [] }; // No hay servicios completados
        }

        // Calcular el total sumando los costos estimados de cada servicio
        let total = 0;
        const detalles = servicios.map(servicio => {
            total += parseFloat(servicio.costo_estimado);
        });
        console.log('total sevicio adicional:', total);

        //obtener el uso de repuestos asociados al id_registro
        const asignacion = await AsignacionTrabajo.findAll({ where: { id_registro } });

        if (!asignacion || asignacion.length === 0) {
            //return res.status(400).json({ message: 'No se encontraron asignaciones de trabajo' }); // No hay asignacion de trabajo
        }
        else {
            //recorrer cada asignacion y asignarle el precio asigncaion usando la fucniontotalPorAsignacion

            for (const asign of asignacion) {
                if (asign.estado === 'COMPLETADO') {
                    //console.log(asign);
                    const totalAsignacion = await totalPorAsignacion(asign.id_asignacion);
                    console.log('totalAsignacion:', totalAsignacion);
                    //total += totalAsignacion;
                    asign.precio = parseFloat(asign.precio) + parseFloat(totalAsignacion);
                    console.log('precio: ', asign.precio);
                    total += parseFloat(asign.precio);
                    //actualizar la asignacion con el total de la asignacion
                    await asign.save();
                }

            }

        }

        // Devolver el total y los detalles de los servicios
        console.log(req)
        const facturaNueva = await generarFactura(total, id_registro, impuestos, descuento, observaciones, metodo_pago);
        console.log('facturaNueva:', facturaNueva);
        //console.log('total:', total);
        //console.log('detalles:', detalles);
        res.json({ message: 'Factura de servicios generada exitosamente', facturaNueva });
    } catch (error) {
        console.error('Error al generar la factura de servicios:', error);
        throw error;
    }
}

async function totalPorAsignacion(id_asignacion) {
    const usosRepuestos = await SolicitudUsoRepuesto.findAll({ where: { id_asignacion_trabajo: id_asignacion, estado: 'USADO' } });
    let total = 0;
    //consultar el inventario para obtener el precio unitario de cada repuesto y sumar al total
    for (const uso of usosRepuestos) {
        const inventario = await Inventario.findOne({ where: { id_inventario_repuesto: uso.id_inventario_repuesto } });
        if (inventario) {
            const costoRepuesto = inventario.precio_unitario * uso.cantidad;
            total += costoRepuesto;
        }

    }
    // consultar todos los mantenimeitos adiconales asociados a una asigncaion trabaj
    const mantenimientos = await MantenimientoAdicional.findAll({ where: { id_asignacion_trabajo: id_asignacion, estado: 'COMPLETADO' } });
    for (const mantenimiento of mantenimientos) {
        total += parseFloat(mantenimiento.costo_estimado);
    }

    return total;

}

async function generarFactura(total, id_registro, impuestos, descuento, obsercvaciones, metodo_pago) {
    const ultimaFactura = await FacturaServicioVehiculo.findOne({ order: [['id_factura', 'DESC']], limit: 1 });
    const numeroFactura = 'F-' + (ultimaFactura ? parseInt(ultimaFactura.id_factura) + 1 : 1).toString();
    const impuestosCalculdados = parseFloat(total) * parseFloat(impuestos);
    const descuentoCalculado = parseFloat(total) * parseFloat(descuento);
    const totalFactura = parseFloat(total) - parseFloat(descuentoCalculado) - parseFloat(impuestosCalculdados);
    const fechaEmision = new Date();
    const fechaVEncimiento = new Date(fechaEmision);
    fechaVEncimiento.setDate(fechaVEncimiento.getDate() + 30);
    console.log('totalFactura:', totalFactura);
    const factura = await FacturaServicioVehiculo.create({
        id_registro: id_registro,
        numero_factura: numeroFactura,
        fecha_emision: fechaEmision,
        fecha_vencimiento: fechaVEncimiento,
        subtotal: total,
        impuestos: impuestosCalculdados,
        descuentos: descuentoCalculado,
        total: totalFactura,
        observaciones: obsercvaciones,
        metodo_pago_preferido: metodo_pago
    });
    return factura;
}

const listarFacturas = async (req, res) => {
    try {
        const facturas = await FacturaServicioVehiculo.findAll();
        res.json(facturas);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al obtener las facturas' });
    }

}

//Reigstrar Pago FActura
const registrarPagoFactura = async (req, res) => {
    try {
        const { id_factura, monto_pago, metodo_pago, referencia_pago, observaciones, id_usuario_registro } = req.body;

        const facturas = await FacturaServicioVehiculo.findOne({ where: { id_factura } });
        //valida que la fechade pago faactura sea menor o igual a la fecha actual 
        const fechaActual = new Date();
        let fecha_pago = new Date(facturas.fecha_vencimiento);
        if (fecha_pago < fechaActual) {
            facturas.estado = 'VENCIDO';
            await facturas.save();
            return res.status(400).json({ message: 'La factura ya vencio' });
        }
        //consultar los pagos de la factura
        const pagos = await PagosFactura.findAll({ where: { id_factura } });

        //sumar todos los monto_pago de cada pago Factura y verificar si es igual al de la factura
        let totalPago = parseFloat(monto_pago);
        for (const pagoFactura of pagos) {
            totalPago += parseFloat(pagoFactura.monto_pago);
        }
        if (parseFloat(facturas.total) === totalPago) {
            facturas.estado_pago = 'PAGADO';
            const pago = await PagosFactura.create({
                id_factura,
                monto_pago,
                fecha_pago,
                metodo_pago,
                referencia_pago,
                observaciones,
                id_usuario_registro
            });
            await facturas.save();
            return res.status(200).json({ message: 'El pago de la factura fue registrado correctamente y has completado el pago', pago, facturas });
        } else if (totalPago < facturas.total) {
            facturas.estado_pago = 'PARCIAL';
            const pago = await PagosFactura.create({
                id_factura,
                monto_pago,
                fecha_pago,
                metodo_pago,
                referencia_pago,
                observaciones,
                id_usuario_registro
            });

            await facturas.save();
            return res.status(200).json({ message: 'El monto de los pagos no es igual al total de la factura', pago, facturas })
        } else {
            return res.status(400).json({ message: 'El monto de los pagos es mayor al total de la factura', facturas });
        }
        //console.log('totalPago:',totalPago
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: 'Error al registrar el pago de la factura'
        });
    }
};

//listar pago factura por id factura 
const listarPagosFactura = async (req, res) => {
    try {
        const { id_factura } = req.params;
        const pagos = await PagosFactura.findAll({ where: { id_factura } });

        res.status(200).json(pagos);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al listar los pagos de la factura' });
    }
};
//consultar saldo de pagos 
const consultarSaldoPagos = async (req, res) => {
    try {
        const { id_factura } = req.params;
        const facturas = await FacturaServicioVehiculo.findOne({ where: { id_factura } });
        if (!facturas) {
            return res.status(404).json({ message: 'Factura no encontrada' });
        }

        const pagos = await PagosFactura.findAll({ where: { id_factura } });
        let totalPagos = 0;
        for (const pago of pagos) {
            totalPagos += parseFloat(pago.monto_pago);
        }

        const saldo = parseFloat(facturas.total) - totalPagos;

        return res.status(200).json({ message: 'Saldo de pagos consultado exitosamente', saldo: saldo });

    } catch (error) {

        return res.status(500).json({ message: 'Error al consultar el saldo de pagos' });
    }

};
module.exports = {
    generarFacturaServicios,
    listarFacturas,
    registrarPagoFactura,
    listarPagosFactura,
    consultarSaldoPagos,
    obtenerServiciosCompletados

}