const {Persona, ContactoPersona, Usuario, TokenAutenticacion,sequelize} = require('../Model');
const bcrypt = require('bcrypt');
const EmailService = require('../services/emailService');

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

//Login de usuario
const loginUsuario = async (req, res) => {
    try {
        const { nombre_usuario, contrasena } = req.body;
        if (!nombre_usuario || !contrasena) {
            return res.status(400).json({ error: 'Faltan datos obligatorios' });
        }

        // Buscar usuario por nombre de usuario
        const usuario = await Usuario.findOne({ where: { nombre_usuario } });
        if (!usuario) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        // Verificar la contraseña
        const esValida = await bcrypt.compare(contrasena, usuario.contrasena);
        if (!esValida) {
            return res.status(401).json({ error: 'Contraseña incorrecta' });
        }

        // Obtener el correo del usuario desde ContactoPersona
        const contacto = await ContactoPersona.findOne({ where: { id_persona: usuario.id_persona } });
        if (!contacto || !contacto.correo) {
            return res.status(404).json({ error: 'No se encontró correo asociado al usuario' });
        }

        // Generar código de verificación (6 dígitos)
        const codigoVerificacion = Math.floor(100000 + Math.random() * 900000).toString();

        //crear un token de 20 caracteres random
        const token1 = Math.random().toString(36).substring(2, 22);

        // Crear token en la base de datos
        const fechaExpiracion = new Date(Date.now() + 15 * 60 * 1000); // 15 minutos
        await TokenAutenticacion.create({
            id_usuario: usuario.id_usuario,
            token: token1,
            tipo_token: '2FA',
            fecha_creacion: new Date(),
            fecha_expiracion: fechaExpiracion,
            estado: 'ACTIVO',
            codigo_verificacion: codigoVerificacion
        });

        // Enviar el código por correo
        await EmailService.sendVerificationCode({
            to: contacto.correo,
            codigoVerificacion
        });

        return res.status(200).json({ mensaje: 'Código de verificación enviado al correo', user: usuario.id_usuario, token: token1 });
    } catch (error) {
        console.error('Error en el login:', error);
        return res.status(500).json({ error: 'Error en el login' });
    }
}

//Autenticacion de codigo de verificacion
const autenticarCodigoVerificacion = async (req, res) => {
    try {
        const { token, codigo_verificacion } = req.body;
        if (!token || !codigo_verificacion) {
            return res.status(400).json({ error: 'Faltan datos obligatorios' });
        }

        // Buscar el token en la base de datos
        const tokenAutenticacion = await TokenAutenticacion.findOne({ where: { token, estado: 'ACTIVO' } });
        if (!tokenAutenticacion) {
            return res.status(404).json({ error: 'Token no encontrado o no activo' });
        }

        // Verificar el código de verificación
        if (tokenAutenticacion.codigo_verificacion !== codigo_verificacion) {
            return res.status(401).json({ error: 'Código de verificación incorrecto' });
        }

        // Verificar si el token ha expirado
        if (new Date() > tokenAutenticacion.fecha_expiracion) {
            tokenAutenticacion.estado = 'EXPIRADO';
            await tokenAutenticacion.save();
            return res.status(410).json({ error: 'Token expirado' });
        }

        // Marcar el token como usado
        tokenAutenticacion.estado = 'USADO';
        await tokenAutenticacion.save();

        return res.status(200).json({ mensaje: 'Código de verificación autenticado correctamente',
            id_usuario: tokenAutenticacion.id_usuario,
            rol: (await Usuario.findByPk(tokenAutenticacion.id_usuario)).id_rol,
            nombre_usuario: (await Usuario.findByPk(tokenAutenticacion.id_usuario)).nombre_usuario
         });
    } catch (error) {
        console.error('Error al autenticar código de verificación:', error);
        return res.status(500).json({ error: 'Error al autenticar código de verificación' });
    }
}

module.exports = {
    obtenerPersonas,
    crearPersona,
    crearContactoUsuario,
    loginUsuario,
    autenticarCodigoVerificacion
 
};