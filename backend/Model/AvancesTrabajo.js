const {DataTypes, Model} = require('sequelize');
const sequelize = require('../config/sequelize');


class AvancesTrabajo extends Model {}

AvancesTrabajo.init({
  id_avance: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  id_asignacion_trabajo: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'asignacion_trabajo', key: 'id_asignacion' }, onDelete: 'CASCADE' },
  descripcion: { type: DataTypes.TEXT, allowNull: false },
  nombre: { type: DataTypes.STRING(200), allowNull: false },
  porcentaje: { type: DataTypes.TINYINT, allowNull: false, validate: { min: 0, max: 100 } },
  fecha_avance: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
}, {
  sequelize,
  modelName: 'AvancesTrabajo',
  tableName: 'avances_trabajo',
  timestamps: false,
});

module.exports = AvancesTrabajo;