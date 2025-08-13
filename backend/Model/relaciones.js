const persona = require('./persona');
const contacto_persona = require('./contacto_persona');
const rol = require('./rol');
const usuario = require('./usuario');
const token_autenticacion = require('./token_autenticacion');
const historial_login  = require('./historial_login');
// Definición de relaciones
//Persona tiene un contacto_persona
persona.hasOne(contacto_persona, {
    foreignKey: 'id_persona',
    sourceKey: 'id_persona',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
    as: 'contacto'
});
//contacto_persona pertenece a una persona
contacto_persona.belongsTo(persona, {
    foreignKey: 'id_persona',
    targetKey: 'id_persona',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
    as: 'persona'
}); 
//Usuario tiene es una persona
usuario.belongsTo(persona, {
    foreignKey: 'id_persona',
    targetKey: 'id_persona',
    onDelete: 'CASCADE',  
    as: 'persona'
}); 
//Usuario tiene un rol
usuario.belongsTo(rol, {
    foreignKey: 'id_rol',
    targetKey: 'id_rol',    
    as: 'rol'
});

//token_autenticacion pertenece a un usuario
token_autenticacion.belongsTo(usuario, {
    foreignKey: 'id_usuario',
    targetKey: 'id_usuario',
    onDelete: 'CASCADE',
    as: 'usuario'
});
//historial_login pertenece a un usuario
historial_login.belongsTo(usuario, {
    foreignKey: 'id_usuario',
    targetKey: 'id_usuario',
    onDelete: 'SET NULL',
    as: 'usuario'
});
module.exports = {
    persona,
    contacto_persona,
    rol,    
    usuario,
    token_autenticacion,
    historial_login
};