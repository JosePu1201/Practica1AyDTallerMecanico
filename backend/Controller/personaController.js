const {Persona, ContactoPersona, Usuario} = require('../Model');

//Obtener todas las personas
const obtenerPersonas = async (req, res) => {
    try {
        const personas = await Persona.findAll();
        return res.status(200).json(personas);
    } catch (error) {
        console.error('Error al obtener personas:', error);
        return res.status(500).json({ error: 'Error al obtener personas' });
    }
}

//Crear Personas
const crearPersona = async (req, res) => {
    try {
        const { nombre, apellido, dpi, fecha_nacimiento, direccion } = req.body;
        if (!nombre || !apellido || !dpi) {
            return res.status(400).json({ error: 'Faltan datos obligatorios' });
        }

        // Verificar si el DPI ya existe
        const existe = await Persona.findOne({ where: { dpi } });
        if (existe) {
            return res.status(409).json({ error: 'El DPI ya está registrado' });
        }

        const nuevaPersona = await Persona.create({
            nombre,
            apellido,
            dpi,
            fecha_nacimiento,
            direccion
        });
        return res.status(201).json({ mensaje: `${nombre} creada correctamente` });
    } catch (error) {
        console.error('Error al crear persona:', error);
        return res.status(500).json({ error: 'Error al crear persona' });
    }
}

module.exports = {
    obtenerPersonas,
    crearPersona
};