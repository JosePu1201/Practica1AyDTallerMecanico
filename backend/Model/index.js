const sequelize = require('../config/sequelize');

const Persona = require('./persona');
const ContactoPersona = require('./ContactoPersona');
const Rol = require('./rol');
const Usuario = require('./usuario');
const TokenAutenticacion = require('./TokenAutenticacion');
const HistorialLogin = require('./HistorialLogin');

// Definición de relaciones

//Una persona tiene muchos contactos
Persona.hasMany(ContactoPersona, { foreignKey: 'id_persona', sourceKey: 'id_persona' });
ContactoPersona.belongsTo(Persona, { foreignKey: 'id_persona', targetKey: 'id_persona' });

//Un usuario pertenece a una persona
Usuario.belongsTo(Persona, { foreignKey: 'id_persona', targetKey: 'id_persona' });

//Usuario tiene un rol
Usuario.belongsTo(Rol, { foreignKey: 'id_rol', targetKey: 'id_rol' });

//Un usuario tiene un token de autenticación
TokenAutenticacion.belongsTo(Usuario, { foreignKey: 'id_usuario', targetKey: 'id_usuario' });

//Un usuario tiene muchos historiales de login
HistorialLogin.belongsTo(Usuario, { foreignKey: 'id_usuario', targetKey: 'id_usuario' });

module.exports = {
  sequelize,
  Persona,
  ContactoPersona,
  Rol,
  Usuario,
  TokenAutenticacion,
  HistorialLogin
};