const {DataTypes, Model} = require('sequelize');
const sequelize = require('../config/sequelize');

class AreaEspecialista extends Model {}
AreaEspecialista.init({
    id_area_especialista: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    nombre_area: { type: DataTypes.STRING(100), allowNull: false },
    descripcion: { type: DataTypes.TEXT },
    fecha_creacion: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, {
    sequelize,
    modelName: 'AreaEspecialista',
    tableName: 'area_especialista',
    timestamps: false
});

module.exports = AreaEspecialista;