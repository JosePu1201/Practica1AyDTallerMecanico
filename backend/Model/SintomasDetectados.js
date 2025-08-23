const {DataTypes, Model} = require('sequelize');
const sequelize = require('../config/sequelize');


class SintomasDetectados extends Model {}
SintomasDetectados.init({
  id_sintoma: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  id_asignacion_trabajo: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'asignacion_trabajo', key: 'id_asignacion_trabajo' }, onDelete: 'CASCADE' },
  fecha_sintoma: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  descripcion_sintoma: { type: DataTypes.TEXT, allowNull: false },
  severidad: { type: DataTypes.ENUM('LEVE', 'MODERADO', 'SEVERO'), defaultValue: 'MODERADO' }
}, {
  sequelize,
  modelName: 'SintomasDetectados',
  tableName: 'sintomas_detectados',
  timestamps: false
});

module.exports = SintomasDetectados;