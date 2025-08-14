const {Persona, ContactoPersona, Usuario, sequelize} = require('../Model');
const bcrypt = require('bcrypt');
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
//Crear contactoPersona, usuario y persona al mismo tiempo
const crearContactoUsuario = async (req, res) => {
    const transaction = await sequelize.transaction(); // Iniciar transacción
    
    try {
        const { nombre, apellido, dpi, fecha_nacimiento, direccion, correo, telefono, nombre_usuario, contrasena, id_rol } = req.body;
        
        // Validaciones básicas
        if (!nombre || !apellido || !dpi || !nombre_usuario || !contrasena || !id_rol) {
            await transaction.rollback();
            return res.status(400).json({ error: 'Faltan datos obligatorios' });
        }                   
        
        // Verificar si el DPI ya existe
        const existePersona = await Persona.findOne({ 
            where: { dpi }, 
            transaction 
        });
        if (existePersona) {
            await transaction.rollback();
            return res.status(409).json({ error: 'El DPI ya está registrado' });
        }      

        // Verificar si el correo ya existe
        const existeContacto = await ContactoPersona.findOne({ 
            where: { correo }, 
            transaction 
        });
        if (existeContacto) {
            await transaction.rollback();
            return res.status(409).json({ error: 'El correo ya está registrado' });
        }

        // Verificar si el nombre de usuario ya existe
        const existeUsuario = await Usuario.findOne({ 
            where: { nombre_usuario }, 
            transaction 
        });
        if (existeUsuario) {
            await transaction.rollback();
            return res.status(409).json({ error: 'El nombre de usuario ya está registrado' });
        }   
        
        // Verificar que la contraseña tenga al menos 6 caracteres
        if (contrasena.length < 6) {
            await transaction.rollback();
            return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
        }
        //verificar que el numero de teléfono tenga 8 dígitos
        if (telefono && telefono.length !== 8) {
            await transaction.rollback();
            return res.status(400).json({ error: 'El número de teléfono debe tener 8 dígitos' });
        }
        //verifica que el telefono no exista
        const existeTelefono = await ContactoPersona.findOne({
            where: { telefono },
            transaction
        });
        if (existeTelefono) {
            await transaction.rollback();
            return res.status(409).json({ error: 'El número de teléfono ya está registrado' });
        }
        // Aplicar hash a la contraseña
        const hashedPassword = await bcrypt.hash(contrasena, 10);

        // TODAS LAS OPERACIONES DENTRO DE LA TRANSACCIÓN
        
        // 1. Crear Persona
        const nuevaPersona = await Persona.create({
            nombre,
            apellido,
            dpi,
            fecha_nacimiento,           
            direccion
        }, { transaction }); 
        
        // 2. Crear ContactoPersona
        const nuevoContacto = await ContactoPersona.create({
            id_persona: nuevaPersona.id_persona,
            correo,
            telefono            
        }, { transaction });
        
        // 3. Crear Usuario
        const nuevoUsuario = await Usuario.create({
            id_persona: nuevaPersona.id_persona,
            nombre_usuario,                 
            contrasena: hashedPassword,     
            id_rol,
            estado: 'ACTIVO'
        }, { transaction });
        
        // Si llegamos aquí, todo salió bien - CONFIRMAR TRANSACCIÓN
        await transaction.commit();
        
        return res.status(201).json({ 
            mensaje: `${nombre} creado correctamente`,
            data: {
                persona: nuevaPersona.id_persona,
                contacto: nuevoContacto.id_contacto,
                usuario: nuevoUsuario.id_usuario
            }
        });
        
    } catch (error) {
        // Si hay cualquier error - REVERTIR TODO
        await transaction.rollback();
        console.error('Error al crear contacto y usuario:', error);
        return res.status(500).json({ error: 'Error al crear contacto y usuario' });
    }
}
module.exports = {
    obtenerPersonas,
    crearPersona,
    crearContactoUsuario 
};