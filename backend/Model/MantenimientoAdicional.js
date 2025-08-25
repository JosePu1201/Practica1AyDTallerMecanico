const {DataTypes, Model} = require('sequelize');
const sequelize = require('../config/sequelize');


class MantenimientoAdicional extends Model {}
MantenimientoAdicional.init({
  id_mantenimiento_adicional: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  id_asignacion_trabajo: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'asignacion_trabajo', key: 'id_asignacion' }, onDelete: 'CASCADE' },
  id_tipo_trabajo: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'tipo_mantenimiento', key: 'id_tipo_trabajo' } },
  descripcion: { type: DataTypes.TEXT, allowNull: false },
  fecha_solicitud: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  estado: { type: DataTypes.ENUM('PENDIENTE', 'APROBADO', 'RECHAZADO', 'COMPLETADO'), defaultValue: 'PENDIENTE' },
  costo_estimado: { type: DataTypes.DECIMAL(10, 2) }
}, {
  sequelize,
  modelName: 'MantenimientoAdicional',
  tableName: 'mantenimiento_adicional',
  timestamps: false
});

module.exports = MantenimientoAdicional;