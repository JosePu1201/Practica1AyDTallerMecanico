const {DataTypes, Model} = require('sequelize');
const sequelize = require('../config/sequelize');


class TipoTecnico extends Model {}
TipoTecnico.init({
    id_tipo_tecnico: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    nombre_tipo: { type: DataTypes.STRING(100), allowNull: false },
    descripcion: { type: DataTypes.TEXT },
    fecha_creacion: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, {
    sequelize,
    modelName: 'TipoTecnico',
    tableName: 'tipo_tecnico',
    timestamps: false
});

module.exports = TipoTecnico;