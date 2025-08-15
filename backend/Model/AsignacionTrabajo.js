const {DataTypes, Model} = require('sequelize');
const sequelize = require('../config/sequelize');


class AsignacionTrabajo extends Model {}
AsignacionTrabajo.init({
  id_asignacion_trabajo: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  id_tipo_trabajo: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'tipo_mantenimiento', key: 'id_tipo_trabajo' }, onDelete: 'CASCADE' },
  id_registro: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'registro_servicio_vehiculo', key: 'id_registro' }, onDelete: 'CASCADE' },
  id_usuario_empleado: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'usuario', key: 'id_usuario' }, onDelete: 'CASCADE' },
  id_admin_asignacion: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'usuario', key: 'id_usuario' }, onDelete: 'CASCADE' },
  estado: { type: DataTypes.ENUM('ASIGNADO', 'EN_PROCESO', 'COMPLETADO', 'CANCELADO', 'PAUSADO'), defaultValue: 'ASIGNADO' },
  descripcion: { type: DataTypes.TEXT },
  fecha_asignacion: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  fecha_inicio_real: { type: DataTypes.DATE, allowNull: true },
  fecha_finalizacion: { type: DataTypes.DATE, allowNull: true },
  precio: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
  observaciones_finalizacion: { type: DataTypes.TEXT },
}, {
  sequelize,
  modelName: 'AsignacionTrabajo',
  tableName: 'asignacion_trabajo',
  timestamps: false
});

module.exports = AsignacionTrabajo;
