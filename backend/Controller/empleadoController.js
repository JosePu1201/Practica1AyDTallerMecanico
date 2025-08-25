const { AsignacionTrabajo, Usuario, Rol,AvancesTrabajo , ObservacionesProcesoTrabajo,ImprevistosTrabajo} = require('../Model')
const{DaniosAdicionales,SolicitudUsoRepuesto,SolicitudApoyo} = require('../Model');
//consultar asignaciones de trabajo por id_usuario 
const consultarAsignacionesPorUsuario = async (req, res) => {
    try {
        const { id_usuario } = req.params;

        //verificar que el usuario existe y tiene el rol de empleado
        const usuario = await Usuario.findOne({
            where: { id_usuario: id_usuario, estado: 'ACTIVO', id_rol: 2 }
        });
        //console.log(usuario);
        if (!usuario) {
            return res.status(404).json({ message: 'Usuario no encontrado o no es un empleado activo.' });
        }
        //verificar si tiene asignaciones de trabajo    
        const asignaciones = await AsignacionTrabajo.findAll({
            where: { id_usuario_empleado: id_usuario },
            include: [
                // Incluye la relación del empleado asignado
                { model: Usuario, as: 'usuarioEmpleado', attributes: ['id_usuario', 'nombre_usuario'] },
                // Incluye la relación del administrador
                { model: Usuario, as: 'adminAsignacion', attributes: ['id_usuario', 'nombre_usuario'] }
            ]
        });
        //verificar si tiene asignaciones de trabajo  
        if (asignaciones.length === 0) {
            return res.status(404).json({ message: 'No se encontraron asignaciones de trabajo para este usuario.' });
        }
        //retornar las asignaciones de trabajo
        res.status(200).json(asignaciones);
    } catch (error) {
        res.status(500).json({ message: 'Error al consultar las asignaciones de trabajo.', error: error.message });
    }
}

//registrar avance de trabajo
const registrarAvanceTrabajo = async (req, res) => {
    const {id_asingnacion, descripcion, nombre, porcentaje} = req.body;
    //validar que existe una signacion de trabajo con ese id_asingnacion y que el estado sea EN_PROCESO
    try {
        const asignacion = await AsignacionTrabajo.findOne({where: {id_asignacion: id_asingnacion, estado: 'EN_PROCESO'}});
        console.log(asignacion);
        if(!asignacion){
            return res.status(404).json({message: 'No se encontró una asignación de trabajo en proceso con el ID proporcionado.'});
        }
        //registrar el avance de trabajo
        const nuevoAvance = await AvancesTrabajo.create({
            id_asignacion_trabajo: id_asingnacion,
            descripcion,
            nombre,
            porcentaje,
            fecha_avance: new Date()
        });
        res.status(201).json({message: 'Avance de trabajo registrado exitosamente.', avance: nuevoAvance});
    } catch (error) {
        res.status(500).json({message: 'Error al registrar el avance de trabajo.', error: error.message});
    }

}   

//Conultar avances por id_asignacion
const consultarAvancesPorAsignacion = async (req, res) => {
    try {
        const { id_asignacion } = req.params;

        //verificar que la asignacion de trabajo existe
        const asignacion = await AsignacionTrabajo.findOne({
            where: { id_asignacion: id_asignacion }
        });
        if (!asignacion) {
            return res.status(404).json({ message: 'Asignación de trabajo no encontrada.' });
        }
        //consultar los avances de trabajo por id_asignacion
        const avances = await AvancesTrabajo.findAll({
            where: { id_asignacion_trabajo: id_asignacion }
        });
        //verificar si tiene avances de trabajo  
        if (avances.length === 0) {
            return res.status(404).json({ message: 'No se encontraron avances de trabajo para esta asignación.' });
        }
        //retornar los avances de trabajo
        res.status(200).json(avances);
    } catch (error) {
        res.status(500).json({ message: 'Error al consultar los avances de trabajo.', error: error.message });
    }
}

//Crear nueva observacion
const crearObservacion = async (req, res) => {
    const { id_asignacion, observacion} = req.body;
    try { 
        //verificar que la asignacion de trabajo existe
        const asignacion = await AsignacionTrabajo.findOne({where: {id_asignacion: id_asignacion}});
        if(!asignacion){
            return res.status(404).json({message: 'No se encontró una asignación de trabajo con el ID proporcionado.'});
        }
        console.log(asignacion.id_asignacion);
        //registrar la observacion
        const nuevaObservacion = await ObservacionesProcesoTrabajo.create({
            id_asignacion,
            observacion,
            fecha_observacion: new Date(),
            logging: console.log                 //imprimir consulta 

            //id_usuario_registro: req.user.id_usuario //suponiendo que el id del usuario que registra la observacion viene en el token
        });
        res.status(201).json({message: 'Observación registrada exitosamente.', observacion: nuevaObservacion});

    }catch (error) {
        res.status(500).json({message: 'Error al registrar la observación.', error: error.message});
    }
}
//asignar imprevisto a una asignacion de trabajo
const asignarImprevisto = async (req, res) => {
    const { id_asignacion_trabajo, descripcion_imprevisto, impacto_tiempo, impacto_costo } = req.body;
    try {
        //verificar que la asignacion de trabajo existe
        const asignacion = await AsignacionTrabajo.findOne({ where: { id_asignacion: id_asignacion_trabajo } });
        if (!asignacion) {
            return res.status(404).json({ message: 'No se encontró una asignación de trabajo con el ID proporcionado.' });
        }
        //registrar el imprevisto
        const nuevoImprevisto = await ImprevistosTrabajo.create({       
            id_asignacion_trabajo,
            descripcion_imprevisto,
            impacto_tiempo,
            impacto_costo,
            fecha_imprevisto: new Date()
        });
        res.status(201).json({ message: 'Imprevisto registrado exitosamente.', imprevisto: nuevoImprevisto });
    } catch (error) {
        res.status(500).json({ message: 'Error al registrar el imprevisto.', error: error.message });
    }
}   

// Registar Danio Adicional
const registrarDanioAdicional = async (req, res) => {
    const { id_asignacion_trabajo, descripcion_danio, costo_estimado, requiere_autorizacion } = req.body;
    try {
        //verificar que la asignacion de trabajo existe
        const asignacion = await AsignacionTrabajo.findOne({ where: { id_asignacion: id_asignacion_trabajo } });
        if (!asignacion) {          
            return res.status(404).json({ message: 'No se encontró una asignación de trabajo con el ID proporcionado.' });
        }
        //registrar el danio adicional
        const nuevoDanio = await DaniosAdicionales.create({
            id_asignacion_trabajo,
            descripcion_danio,
            costo_estimado,
            requiere_autorizacion,
            fecha_danio: new Date(),
            autorizado: requiere_autorizacion ? false : true // Si requiere autorizacion, inicia como false
        });
        res.status(201).json({ message: 'Daño adicional registrado exitosamente.', danio: nuevoDanio });
    } catch (error) {
        res.status(500).json({ message: 'Error al registrar el daño adicional.', error: error.message });
    }
}
//Crear solicitud de uso de repuesto
const solicitarUsoRepuesto = async (req, res) => {
    const { id_asignacion_trabajo, descripcion, cantidad, id_inventario_repuesto } = req.body;
    try {
        //verificar que la asignacion de trabajo existe
        const asignacion = await AsignacionTrabajo.findOne({ where: { id_asignacion: id_asignacion_trabajo } });
        if (!asignacion) {
            return res.status(404).json({ message: 'No se encontró una asignación de trabajo con el ID proporcionado.' });
        }
        //registrar la solicitud de uso de repuesto
        const nuevaSolicitud = await SolicitudUsoRepuesto.create({
            id_asignacion_trabajo,
            descripcion,
            cantidad,
            id_inventario_repuesto,
            fecha_uso: new Date()
        });
        res.status(201).json({ message: 'Solicitud de uso de repuesto registrada exitosamente.', solicitud: nuevaSolicitud });
    } catch (error) {
        res.status(500).json({ message: 'Error al registrar la solicitud de uso de repuesto.', error: error.message });
    }
}   
//solicitar apoyo de un especialista
const solicitarApoyoEspecialista = async (req, res) => {
    const { id_asignacion_trabajo, id_usuario_especialista, descripcion_apoyo } = req.body;
    try {
        //verificar que la asignacion de trabajo existe
        const asignacion = await AsignacionTrabajo.findOne({ where: { id_asignacion: id_asignacion_trabajo } });
        if (!asignacion) {
            return res.status(404).json({ message: 'No se encontró una asignación de trabajo con el ID proporcionado.' });
        }
        //verificar que el usuario especialista existe y tiene el rol de especialista (id_rol = 3)
        const especialista = await Usuario.findOne({ where: { id_usuario: id_usuario_especialista, id_rol: 4, estado: 'ACTIVO' } });            
        if (!especialista) {
            return res.status(404).json({ message: 'No se encontró un especialista activo con el ID proporcionado.' });
        }
        //registrar la solicitud de apoyo
        const nuevaSolicitudApoyo = await SolicitudApoyo.create({
            id_asignacion_trabajo,
            id_usuario_especialista,
            descripcion_apoyo,
            fecha_apoyo: new Date()
        });
        res.status(201).json({ message: 'Solicitud de apoyo a especialista registrada exitosamente.', solicitudApoyo: nuevaSolicitudApoyo });
    } catch (error) {
        res.status(500).json({ message: 'Error al registrar la solicitud de apoyo a especialista.', error: error.message });
    }
}   
module.exports = {
    consultarAsignacionesPorUsuario,
    registrarAvanceTrabajo,
    consultarAvancesPorAsignacion,
    crearObservacion,
    asignarImprevisto,
    registrarDanioAdicional,
    solicitarUsoRepuesto,
    solicitarApoyoEspecialista
};