const { Persona, ContactoPersona, Usuario, TokenAutenticacion, sequelize, HistorialLogin, Rol } = require('../Model');
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
    //console.log(req.session.user);
    try {
        const { nombre_usuario, contrasena } = req.body;
        if (!nombre_usuario || !contrasena) {
            return res.status(400).json({ error: 'Faltan datos obligatorios' });
        }

        // Buscar usuario por nombre de usuario
        const usuario = await Usuario.findOne({ where: { nombre_usuario } });
        if (!usuario) {
            await HistorialLogin.create({
                id_usuario: null,
                fecha_intento: new Date(),
                ip_address: null,
                navegador: req.headers['user-agent'] || 'Desconocido',
                resultado: 'FALLIDO',
                tipo_fallo: 'USUARIO_INACTIVO'

            });
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        // Verificar la contraseña
        const esValida = await bcrypt.compare(contrasena, usuario.contrasena);
        if (!esValida) {
            await HistorialLogin.create({
                id_usuario: usuario.id_usuario,
                fecha_intento: new Date(),
                ip_address: null,
                navegador: req.headers['user-agent'] || 'Desconocido',
                resultado: 'FALLIDO',
                tipo_fallo: 'PASSWORD_INCORRECTO'

            });
            return res.status(401).json({ error: 'Las credenciales no son correctas, intenta de nuevo' });
        }
        if (usuario.factorAutenticacion) {
            console.log("factorAutenticacion", usuario.factorAutenticacion);
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

            return res.status(200).json({
                autenticacion: {
                    autenticacion: true
                },
                 credenciales: {
                    mensaje: 'Código de verificación enviado al correo',
                    user: usuario.id_usuario,
                    token: token1
                }});

        } else {
            console.log("factorAutenticacion", usuario.factorAutenticacion);
            req.session.user = {
                id_usuario: usuario.id_usuario,
                rol: usuario.id_rol,
                nombre_usuario: usuario.nombre_usuario,
                factorAutenticacion: usuario.factorAutenticacion
            };

            //Guardar ultimo inicio de sesion
            await Usuario.update({
                ultimo_acceso: new Date()
            }, {
                where: {
                    id_usuario: usuario.id_usuario
                }
            });

            //console.log(req.session.user);
            return res.status(200).json({
                autenticacion: {
                    autenticacion: false
                },
                credenciales: {
                    mensaje: 'Código de verificación autenticado correctamente',
                    id_usuario: usuario.id_usuario,
                    rol: usuario.id_rol,
                    nombre_rol: (await Rol.findByPk(usuario.id_rol)).nombre_rol,
                    nombre_usuario: (await Usuario.findByPk(usuario.id_usuario)).nombre_usuario
                   
                }
            });

        }

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
            await HistorialLogin.create({
                id_usuario: tokenAutenticacion ? tokenAutenticacion.id_usuario : null,
                fecha_intento: new Date(),
                ip_address: null,
                navegador: req.headers['user-agent'] || 'Desconocido',
                resultado: 'FALLIDO',
                tipo_fallo: '2FA_FALLIDO'

            });
            return res.status(404).json({ error: 'Token no encontrado o no activo' });

        }

        // Verificar el código de verificación
        if (tokenAutenticacion.codigo_verificacion !== codigo_verificacion) {
            await HistorialLogin.create({
                id_usuario: tokenAutenticacion.id_usuario,
                fecha_intento: new Date(),
                ip_address: null,
                navegador: req.headers['user-agent'] || 'Desconocido',
                resultado: 'FALLIDO',
                tipo_fallo: '2FA_FALLIDO'

            });
            return res.status(401).json({ error: 'Código de verificación incorrecto' });
        }

        // Verificar si el token ha expirado
        if (new Date() > tokenAutenticacion.fecha_expiracion) {
            tokenAutenticacion.estado = 'EXPIRADO';
            await tokenAutenticacion.save();
            await HistorialLogin.create({
                id_usuario: tokenAutenticacion.id_usuario,
                fecha_intento: new Date(),
                ip_address: null,
                navegador: req.headers['user-agent'] || 'Desconocido',
                resultado: 'FALLIDO',
                tipo_fallo: '2FA_FALLIDO'

            });
            return res.status(410).json({ error: 'Token expirado' });
        }

        // Marcar el token como usado
        tokenAutenticacion.estado = 'USADO';
        await tokenAutenticacion.save();
        await HistorialLogin.create({
            id_usuario: tokenAutenticacion.id_usuario,
            fecha_intento: new Date(),
            ip_address: null,
            navegador: req.headers['user-agent'] || 'Desconocido',
            resultado: 'EXITOSO'

        });
        // Guardar datos en la sesión
        const usuario = await Usuario.findByPk(tokenAutenticacion.id_usuario);
        req.session.user = {
            id_usuario: usuario.id_usuario,
            rol: usuario.id_rol,
            nombre_usuario: usuario.nombre_usuario,
            factorAutenticacion: usuario.factorAutenticacion
        };

        //Guardar ultimo inicio de sesion
        await Usuario.update({
            ultimo_acceso: new Date()
        }, {
            where: {
                id_usuario: tokenAutenticacion.id_usuario
            }
        });

        //console.log(req.session.user);
        return res.status(200).json({
            mensaje: 'Código de verificación autenticado correctamente',
            id_usuario: tokenAutenticacion.id_usuario,
            rol: (await Usuario.findByPk(tokenAutenticacion.id_usuario)).id_rol,
            nombre_rol: (await Rol.findByPk((await Usuario.findByPk(tokenAutenticacion.id_usuario)).id_rol)).nombre_rol,
            nombre_usuario: (await Usuario.findByPk(tokenAutenticacion.id_usuario)).nombre_usuario
        });
    } catch (error) {
        console.error('Error al autenticar código de verificación:', error);
        return res.status(500).json({ error: 'Error al autenticar código de verificación' });
    }
}

//recuperar Contraseña

const recuperarContrasena = async (req, res) => {
    try {
        const { username } = req.body;
        if (!username) {
            return res.status(400).json({ error: 'Falta el nombre de usuario' });
        }
        //buscar usuario por nombre de usuario
        const usuario = await Usuario.findOne({ where: { nombre_usuario: username } });
        if (!usuario) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }
        //obtener el correo del usuario
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
            tipo_token: 'RECUPERACION_PASSWORD',
            fecha_creacion: new Date(),
            fecha_expiracion: fechaExpiracion,
            estado: 'ACTIVO',
            codigo_verificacion: codigoVerificacion
        });
        // Enviar el código por correo
        const emailSent = await EmailService.sendRecupeartionCode({
            to: contacto.correo,
            codigoVerificacion: codigoVerificacion
        });
        //responder con el token y el id del usuario
        return res.status(200).json({
            mensaje: 'Código de recuperación enviado al correo',
            user: usuario.id_usuario,
            token: token1
        });
        // Si el correo no se envió, responder con error

    } catch (error) {
        console.error('Error al recuperar contraseña:', error);
        return res.status(500).json({ error: 'Error al recuperar contraseña' });
    }
}
//validar codigo de recuperacion y responder con codigo correcto
const validarCodigoRecuperacion = async (req, res) => {
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
        return res.status(200).json({
            mensaje: 'Código de verificación autenticado correctamente',
            token: tokenAutenticacion.token,
            id_usuario: tokenAutenticacion.id_usuario,
            nombre_usuario: (await Usuario.findByPk(tokenAutenticacion.id_usuario)).nombre_usuario
        });
    } catch (error) {
        console.error('Error al autenticar código de verificación:', error);
        return res.status(500).json({ error: 'Error al autenticar código de verificación' });
    }
}
const cambiarContrasena = async (req, res) => {
    try {
        const { id_usuario, nueva_contrasena, token } = req.body;
        if (!id_usuario || !nueva_contrasena || !token) {
            return res.status(400).json({ error: 'Faltan datos obligatorios' });
        }
        if (nueva_contrasena.length < 6) {
            return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
        }

        // Buscar el token y verificar estado
        const tokenAutenticacion = await TokenAutenticacion.findOne({
            where: { token, tipo_token: 'RECUPERACION_PASSWORD', estado: 'USADO' }
        });
        if (!tokenAutenticacion) {
            return res.status(404).json({ error: 'Token inválido o no autenticado' });
        }
        if (new Date() > tokenAutenticacion.fecha_expiracion) {
            tokenAutenticacion.estado = 'EXPIRADO';
            await tokenAutenticacion.save();
            return res.status(410).json({ error: 'Token expirado' });
        }
        // Validar que el id_usuario del token sea igual al recibido
        if (Number(tokenAutenticacion.id_usuario) !== Number(id_usuario)) {
            return res.status(403).json({ error: 'El usuario no coincide con el token de recuperación' });
        }

        // Buscar usuario por id
        const usuario = await Usuario.findByPk(id_usuario);
        if (!usuario) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        // Aplicar hash a la nueva contraseña
        const hashedPassword = await bcrypt.hash(nueva_contrasena, 10);
        usuario.contrasena = hashedPassword;
        await usuario.save();

        return res.status(200).json({ mensaje: 'Contraseña actualizada correctamente' });
    } catch (error) {
        console.error('Error al cambiar la contraseña:', error);
        return res.status(500).json({ error: 'Error al cambiar la contraseña' });
    }
}
// Logout para eliminar la sesión
const logout = (req, res) => {
    console.log('Cerrando sesión para el usuario:', req.session.user);
    if (!req.session.user) {
        return res.status(400).json({ mensaje: 'No hay sesión activa' });
    }
    // Eliminar la sesión
    req.session.destroy();
    return res.status(200).json({ mensaje: 'Sesión cerrada correctamente' });
};

const listarUsuariosClientes = async (req, res) => {
    //validar que el rol de la sesion sea administrador (el rol es un id)
    /*if (req.session.user.rol !== 1) {
        return res.status(403).json({ error: 'No tienes permiso para realizar esta acción' });
    }*/
    //paginacion
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;
    try {
        const { count, rows } = await Usuario.findAndCountAll({
            where: { id_rol: 3, estado: "ACTIVO" }, // 3 es el id del rol cliente
            limit: Number(limit),
            offset: Number(offset),
            attributes: { exclude: ['contrasena'] }, // Excluir la contraseña
        });
        return res.json({ total: count, usuarios: rows });
    } catch (error) {
        return res.status(500).json({ error: 'Error al listar usuarios clientes' });
    }
};

//cambiar autenticacion de usuiaro 
const cambiarAutenticacion = async (req, res) => {
    try {
        if (!req.session || !req.session.user || !req.session.user.id_usuario) {
            return res.status(401).json({ message: 'No hay una sesión de usuario válida.' });
        }
        const id_usuario = req.session.user.id_usuario;
        // Buscar usuario por id
        const usuario = await Usuario.findByPk(id_usuario);
        if (!usuario) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }   
        usuario.factorAutenticacion = !usuario.factorAutenticacion;
        await usuario.save();       
        return res.status(200).json({ mensaje: 'Autenticación de dos factores actualizada correctamente' });
    } catch (error) {
        console.error('Error al cambiar la autenticación de dos factores:', error);
        return res.status(500).json({ error: 'Error al cambiar la autenticación de dos factores' });
    }  
}
module.exports = {
    obtenerPersonas,
    crearPersona,
    crearContactoUsuario,
    loginUsuario,
    autenticarCodigoVerificacion,
    recuperarContrasena,
    validarCodigoRecuperacion,
    logout,
    cambiarContrasena,
    listarUsuariosClientes,
    cambiarAutenticacion
};