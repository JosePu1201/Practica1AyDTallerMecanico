const {DataTypes, Model} = require('sequelize');
const sequelize = require('../config/sequelize');

class Persona extends Model {}
Persona.init({
    id_persona:{type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true},
    nombre: {type: DataTypes.STRING(100), allowNull: false},
    apellido: {type: DataTypes.STRING(100), allowNull: false},
    dpi: {type: DataTypes.STRING(20), allowNull: false, unique: true},
    fecha_nacimiento: {type: DataTypes.DATE},
    direccion: {type: DataTypes.TEXT},
    estado: {type: DataTypes.ENUM('ACTIVO', 'INACTIVO'), defaultValue: 'ACTIVO'},
    fecha_creacion: {type: DataTypes.DATE, defaultValue: DataTypes.NOW},
    fecha_modificacion: {type: DataTypes.DATE, defaultValue: DataTypes.NOW}
},
{
    sequelize,
    modelName: 'Persona',
    tableName: 'persona',
    timestamps: false   
});

module.exports = Persona;