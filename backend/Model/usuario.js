const {DataTypes, Model} = require('sequelize');
const sequelize = require('../config/sequelize');

class Usuario extends Model {}
Usuario.init({
    id_usuario: {type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true},
    id_persona: {type: DataTypes.INTEGER, allowNull: false, references: {model: 'persona', key: 'id_persona'}, onDelete: 'CASCADE'},
    nombre_usuario: {type: DataTypes.STRING(50), allowNull: false, unique: true},
    contrasena: {type: DataTypes.STRING(255), allowNull: false},
    id_rol: {type: DataTypes.INTEGER, allowNull: false, references: {model: 'rol', key: 'id_rol'}},
    estado: {type: DataTypes.ENUM('ACTIVO', 'INACTIVO', 'BLOQUEADO'), defaultValue: 'ACTIVO'},
    factorAutenticacion:{type: DataTypes.BOOLEAN, defaultValue: false},
    ultimo_acceso: {type: DataTypes.DATE, allowNull: true},
    fecha_creacion: {type: DataTypes.DATE, defaultValue: DataTypes.NOW},
    fecha_modificacion: {type: DataTypes.DATE, defaultValue: DataTypes.NOW}
},
{
    sequelize,
    modelName: 'Usuario',
    tableName: 'usuario',
    timestamps: false
});

module.exports = Usuario;
