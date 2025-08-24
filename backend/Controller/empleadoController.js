const { AsignacionTrabajo, Usuario, Rol } = require('../Model')

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

module.exports = {
    consultarAsignacionesPorUsuario
};