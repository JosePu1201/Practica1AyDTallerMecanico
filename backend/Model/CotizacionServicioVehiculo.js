const {DataTypes, Model} = require('sequelize');
const sequelize = require('../config/sequelize');


class CotizacionServicioVehiculo extends Model {}
CotizacionServicioVehiculo.init({
  id_registro_cotizacion: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  id_vehiculo: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'vehiculo', key: 'id_vehiculo' } },
  descripcion_problema: { type: DataTypes.TEXT, allowNull: false },
  estado: { type: DataTypes.ENUM('PENDIENTE', 'ENVIADO', 'APROBADO', 'RECHAZADO'), defaultValue: 'PENDIENTE' },
  fecha_cotizacion: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  fecha_vencimiento: { type: DataTypes.DATE },
  total_cotizacion: { type: DataTypes.DECIMAL(10, 2) }
}, {
  sequelize,
  modelName: 'CotizacionServicioVehiculo',
  tableName: 'cotizacion_servicio_vehiculo',
  timestamps: false
});

module.exports = CotizacionServicioVehiculo;
