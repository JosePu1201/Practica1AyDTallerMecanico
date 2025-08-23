const {DataTypes, Model} = require('sequelize');
const sequelize = require('../config/sequelize');


class TrabajosCotizacion extends Model {}

TrabajosCotizacion.init({
  id_trabajo_cotizacion: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  id_tipo_trabajo: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'tipo_mantenimiento', key: 'id_tipo_trabajo' } },
  id_registro_cotizacion: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'cotizacion_servicio_vehiculo', key: 'id_registro_cotizacion' }, onDelete: 'CASCADE' },
  estado: { type: DataTypes.ENUM('INCLUIDO', 'OPCIONAL', 'EXCLUIDO'), defaultValue: 'INCLUIDO' },
  fecha_asignacion: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  fecha_finalizacion: { type: DataTypes.DATE },
  precio: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  descripcion_trabajo: { type: DataTypes.TEXT }
}, {
  sequelize,
  modelName: 'TrabajosCotizacion',
  tableName: 'trabajos_cotizacion',
  timestamps: false
});

module.exports = TrabajosCotizacion;
