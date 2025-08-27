const { Inventario, Repuesto, Usuario , Proveedor} = require('../Model');

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
                    attributes: ['id_proveedor', 'nit','id_usuario','estado'],
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

module.exports = {
    getInventarioRepuesto,
};
