const e = require('express');
const {Persona, Usuario, UsuarioEspecialista, AreaEspecialista, TipoTecnico, ContactoPersona} = require('../Model');
const {Rol, Proveedor, sequelize} = require('../Model');
const bcrypt = require('bcrypt');

//Obtener usuarios 
const getUsers = async (req, res) => {
  try {
    //Datos completos de persona direccion, usuario y rol
    const users = await Usuario.findAll({
      attributes: { exclude: ['contrasena'] },
      include: [
        {
          model: Persona, //excluir contrasena
          
          include: [
            {
              model: ContactoPersona,
            },
          ],
        },
        {
          model: Rol,
        },
      ],
    });

    res.json(users);
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    res.status(500).json({ error: 'Error al obtener usuarios' });
  }
};

const createUser = async (req, res) => {
    //Iniciamos transaccion
    const transaction = await sequelize.transaction();
  try {
    const { nombre, apellido, dpi, fecha_nacimiento, direccion, correo, telefono, nombre_usuario, contrasena, id_rol } = req.body;

    // Crear persona

    //verficamos dpi
    const existingPersona = await Persona.findOne({ where: { dpi }, transaction });
    if (existingPersona) {
      await transaction.rollback();
      return res.status(400).json({ error: 'DPI ya existe' });
    }

    const persona = await Persona.create({
      nombre,
      apellido,
      dpi,
      fecha_nacimiento,
      direccion,
      estado: 'ACTIVO',
      fecha_creacion: new Date(),
      fecha_modificacion: new Date()
    }, { transaction });

    // Crear contacto
    //verificamos correo
    const existingContacto = await ContactoPersona.findOne({ where: { correo }, transaction });
    if (existingContacto) {
      await transaction.rollback();
      return res.status(400).json({ error: 'Correo ya existe' });
    }


    await ContactoPersona.create({
      id_persona: persona.id_persona,
      correo,
      telefono,
      fecha_creacion: new Date()
    }, { transaction });

    // Crear usuario
    const usuario = await Usuario.create({
      id_persona: persona.id_persona,
      nombre_usuario,
      contrasena: await bcrypt.hash(contrasena, 10),
      id_rol,
      estado: 'ACTIVO',
      ultimo_acceso: null,
      fecha_creacion: new Date(),
      fecha_modificacion: new Date()
    }, { transaction });

    await transaction.commit();
    res.status(201).json(usuario);
  } catch (error) {
    await transaction.rollback();
    console.error('Error al crear usuario:', error);
    res.status(500).json({ error: 'Error al crear usuario' });
  }
};


//Actualizar usuario
const updateUser = async (req, res) => {
  const { id } = req.params;
  const { nombre, apellido, dpi, fecha_nacimiento, direccion, correo, telefono, nombre_usuario, contrasena, id_rol } = req.body;

  const transaction = await sequelize.transaction();
  try {
    // Verificar si el usuario existe
    const usuario = await Usuario.findByPk(id, {
      include: [
        {
          model: Persona,
          include: [ContactoPersona]
        },
        {
          model: Rol
        }
      ]
    });

    if (!usuario) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    // Actualizar persona
    await Persona.update({
      nombre,
      apellido,
      dpi,
      fecha_nacimiento,
      direccion
    }, {
      where: { id_persona: usuario.id_persona },
      transaction
    });

    // Actualizar contacto
    await ContactoPersona.update({
      correo,
      telefono
    }, {
      where: { id_persona: usuario.id_persona },
      transaction
    });

    // Actualizar usuario
    //si no se proporciona una nueva contraseña, no la actualizamos
    if (!contrasena) {
      await Usuario.update({
        nombre_usuario,
        id_rol
      }, {
      where: { id_usuario: id },
      transaction
    });
  }else {
      await Usuario.update({
        nombre_usuario,
        contrasena: await bcrypt.hash(contrasena, 10),
        id_rol
      }, {
        where: { id_usuario: id },
        transaction
      });
    }
    await transaction.commit();
    res.json({ message: 'Usuario actualizado exitosamente' });
  } catch (error) {
    await transaction.rollback();
    console.error('Error al actualizar usuario:', error);
    res.status(500).json({ error: 'Error al actualizar usuario' });
  }
};

//Eliminar usuario (INACTIVO)

const deleteUser = async (req, res) => {
    const { id } = req.params;

    const transaction = await sequelize.transaction();
    try {
        // Verificar si el usuario existe
        const usuario = await Usuario.findByPk(id, {
            include: [
                {
                    model: Persona,
                    include: [ContactoPersona]
                },
                {
                    model: Rol
                }
            ]
        });

        if (!usuario) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        // Marcar usuario como inactivo
        await Usuario.update({
            estado: 'INACTIVO',
            fecha_modificacion: new Date()
        }, {
            where: { id_usuario: id },
            transaction
        });

        //Marcar Persona como inactiva
        await Persona.update({
            estado: 'INACTIVO',
            fecha_modificacion: new Date()
        }, {
            where: { id_persona: usuario.id_persona },
            transaction
        });

        await transaction.commit();
        res.json({ message: 'Usuario eliminado exitosamente' });
    } catch (error) {
        await transaction.rollback();
        console.error('Error al eliminar usuario:', error);
        res.status(500).json({ error: 'Error al eliminar usuario' });
    }
};

//Obtener roles
const getRol = async (req, res) => {
  try {
    const roles = await Rol.findAll();
    res.json(roles);
  } catch (error) {
    console.error('Error al obtener roles:', error);
    res.status(500).json({ error: 'Error al obtener roles' });
  }
}

//Obtener Especialistas
const getSpecialist = async (req, res) => {
  try {
    const specialists = await UsuarioEspecialista.findAll(
        {
            include: [
            {
                model: Usuario,
                attributes: { exclude: ['contrasena'] },
                include: [Persona]
            },
            {
                model: TipoTecnico
            },
            {
                model: AreaEspecialista
            }
            ]
        }
    );
    res.json(specialists);
  } catch (error) {
    console.error('Error al obtener especialistas:', error);
    res.status(500).json({ error: 'Error al obtener especialistas' });
  }
}

const getAreasEspecialista = async (req, res) => {
  try {
    const areas = await AreaEspecialista.findAll();
    res.json(areas);
  } catch (error) {
    console.error('Error al obtener áreas de especialistas:', error);
    res.status(500).json({ error: 'Error al obtener áreas de especialistas' });
  }
}

const getTipoTecnico = async (req, res) => {
  try {
    const tipos = await TipoTecnico.findAll();
    res.json(tipos);
  } catch (error) {
    console.error('Error al obtener tipos de técnico:', error);
    res.status(500).json({ error: 'Error al obtener tipos de técnico' });
  }
}

const asignarEspecializacion = async (req, res) => {
    const { id_usuario, id_area_especialista, id_tipo_tecnico } = req.body;

    const transaction = await sequelize.transaction();
    try {
        // Verificar si el usuario existe
        const usuario = await Usuario.findByPk(id_usuario);
        if (!usuario) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        // Asignar especialización
        await UsuarioEspecialista.create({
            id_usuario,
            id_area_especialista,
            id_tipo_tecnico
        }, { transaction });

        await transaction.commit();
        res.json({ message: 'Especialización asignada exitosamente' });
    } catch (error) {
        await transaction.rollback();
        console.error('Error al asignar especialización:', error);
        res.status(500).json({ error: 'Error al asignar especialización' });
    }
}

const getUserById = async (req, res) => {
    const { id } = req.params;

    try {
        const user = await Usuario.findByPk(id, {
            include: [
                {
                    model: Persona,
                    include: [ContactoPersona]
                },
                {
                    model: Rol
                }
            ]
        });

        if (!user) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        res.json(user);
    } catch (error) {
        console.error('Error al obtener usuario por ID:', error);
        res.status(500).json({ error: 'Error al obtener usuario por ID' });
    }
}

const createRol = async (req, res) => {
  const { nombre_rol, descripcion } = req.body;
  try {
    const newRol = await Rol.create({ nombre_rol, descripcion });
    res.status(201).json(newRol);
  } catch (error) {
    console.error('Error al crear rol:', error);
    res.status(500).json({ error: 'Error al crear rol' });
  }
};

module.exports = {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  getRol,
  getSpecialist,
  getAreasEspecialista,
  getTipoTecnico,
  asignarEspecializacion,
  getUserById,
  createRol
};
