const {DataTypes, Model} = require('sequelize');
const sequelize = require('../config/sequelize');

class Rol extends Model {}
Rol.init({
    id_rol: {type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true},
    nombre_rol: {type: DataTypes.STRING(50), allowNull: false, unique: true},
    descripcion: {type: DataTypes.TEXT, allowNull: true},
    fecha_creacion: {type: DataTypes.DATE, defaultValue: DataTypes.NOW}
},
{
    sequelize,
    modelName: 'Rol',
    tableName: 'rol',
    timestamps: false
});

module.exports = Rol;
