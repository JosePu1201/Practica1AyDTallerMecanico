const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/sequelize');


class RecomendacionesVehiculo extends Model {}
RecomendacionesVehiculo.init({
  id_recomendacion: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  id_asignacion_trabajo: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'asignacion_trabajo', key: 'id_asignacion' }, onDelete: 'CASCADE' },
  id_especialista: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'usuario', key: 'id_usuario' } },
  recomendacion: { type: DataTypes.TEXT, allowNull: false },
  fecha_recomendacion: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  prioridad: { type: DataTypes.ENUM('BAJA', 'MEDIA', 'ALTA', 'URGENTE'), defaultValue: 'MEDIA' },
  tipo_recomendacion: { type: DataTypes.ENUM('MANTENIMIENTO_PREVENTIVO', 'REPARACION_FUTURA', 'CAMBIO_HABITOS'), defaultValue: 'MANTENIMIENTO_PREVENTIVO' }
}, {
  sequelize,
  modelName: 'RecomendacionesVehiculo',
  tableName: 'recomendaciones_vehiculo',
  timestamps: false
});

module.exports = RecomendacionesVehiculo;
