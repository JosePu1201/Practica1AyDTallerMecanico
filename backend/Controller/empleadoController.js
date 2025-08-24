const { AsignacionTrabajo, Usuario, Rol,AvancesTrabajo } = require('../Model')

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

module.exports = {
    consultarAsignacionesPorUsuario,
    registrarAvanceTrabajo,
    consultarAvancesPorAsignacion
};