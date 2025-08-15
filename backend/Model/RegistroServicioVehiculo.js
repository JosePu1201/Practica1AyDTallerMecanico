const {DataTypes, Model} = require('sequelize');
const sequelize = require('../config/sequelize');

class RegistroServicioVehiculo extends Model {}
RegistroServicioVehiculo.init({
  id_registro: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  id_vehiculo: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'vehiculo', key: 'id_vehiculo' }, onDelete: 'CASCADE' },
  descripcion_problema: { type: DataTypes.TEXT, allowNull: false },
  calificacion: { type: DataTypes.TINYINT, validate: { min: 1, max: 5 } },
  estado: { type: DataTypes.ENUM('PENDIENTE', 'EN_PROCESO', 'COMPLETADO', 'CANCELADO'), defaultValue: 'PENDIENTE' },
  fecha_ingreso: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  fecha_estimada_finalizacion: { type: DataTypes.DATE },
  fecha_finalizacion_real: { type: DataTypes.DATE, allowNull: true },
  observaciones_iniciales: { type: DataTypes.TEXT },
  prioridad: { type: DataTypes.ENUM('BAJA', 'MEDIA', 'ALTA', 'URGENTE'), defaultValue: 'MEDIA' }
}, {
  sequelize,
  modelName: 'RegistroServicioVehiculo',
  tableName: 'registro_servicio_vehiculo',
  timestamps: false
});

module.exports = RegistroServicioVehiculo;