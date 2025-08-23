const {DataTypes, Model}= require('sequelize');
const sequelize = require('../config/sequelize');


class ServiciosAdicionales extends Model {}

ServiciosAdicionales.init({
  id_servicio_adicional: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  id_registro: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'registro_servicio_vehiculo', key: 'id_registro' }, onDelete: 'CASCADE' },
  id_tipo_trabajo: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'tipo_mantenimiento', key: 'id_tipo_trabajo' } },
  descripcion: { type: DataTypes.TEXT, allowNull: false },
  estado: { type: DataTypes.ENUM('SOLICITADO', 'APROBADO', 'RECHAZADO', 'COMPLETADO'), defaultValue: 'SOLICITADO' },
  fecha_solicitud: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  costo_estimado: { type: DataTypes.DECIMAL(10, 2) }
}, {
  sequelize,
  modelName: 'ServiciosAdicionales',
  tableName: 'servicios_adicionales',
  timestamps: false
});

module.exports = ServiciosAdicionales;