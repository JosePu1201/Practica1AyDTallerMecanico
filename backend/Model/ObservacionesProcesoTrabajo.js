const {DataTypes, Model} = require('sequelize');
const sequelize = require('../config/sequelize');

class ObservacionesProcesoTrabajo extends Model {}
ObservacionesProcesoTrabajo.init({
  id_observacion: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  id_asignacion: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'asignacion_trabajo', key: 'id_asignacion' }, onDelete: 'CASCADE' },
  observacion: { type: DataTypes.TEXT, allowNull: false },
  fecha_creacion: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  id_usuario_registro: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'usuario', key: 'id_usuario' }, onDelete: 'CASCADE' },
}, {
  sequelize,
  modelName: 'ObservacionesProcesoTrabajo',
  tableName: 'observaciones_proceso_trabajo',
  timestamps: false,
});

module.exports = ObservacionesProcesoTrabajo;