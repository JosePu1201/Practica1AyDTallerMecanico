const { parse } = require('dotenv');
const { FacturaServicioVehiculo,ServiciosAdicionales, Inventario, SolicitudUsoRepuesto, AsignacionTrabajo, MantenimientoAdicional } = require('../Model')
const { RegistroServicioVehiculo } = require('../Model');

//hacer sumatoria para factura de servicios 
const generarFacturaServicios = async (req, res) => {
    try {
        // console.log('generarFacturaServicios');
        const { id_registro,impuestos,descuento,observaciones } = req.body;
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
        console.log (req)
        const facturaNueva = await generarFactura(total,id_registro,impuestos,descuento,observaciones);
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

async function generarFactura (total,id_registro,impuestos,descuento,obsercvaciones){
    const ultimaFactura = await FacturaServicioVehiculo.findOne({ order: [['id_factura', 'DESC']], limit: 1 });
    const numeroFactura = 'F-'+(ultimaFactura ? parseInt(ultimaFactura.id_factura) + 1 : 1).toString();
    const impuestosCalculdados = parseFloat(total)*parseFloat(impuestos);
    const descuentoCalculado = parseFloat(total)*parseFloat(descuento);
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
    });
    return factura;
}
module.exports = {
    generarFacturaServicios
}