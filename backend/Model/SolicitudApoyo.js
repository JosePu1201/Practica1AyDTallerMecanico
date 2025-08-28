const {DataTypes, Model} = require('sequelize');
const sequelize = require('../config/sequelize');


class SolicitudApoyo extends Model {}
SolicitudApoyo.init({
  id_solicitud_apoyo: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  id_asignacion_trabajo: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'asignacion_trabajo', key: 'id_asignacion' }, onDelete: 'CASCADE' },
  id_usuario_especialista: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'usuario', key: 'id_usuario' } },
  descripcion_apoyo: { type: DataTypes.TEXT, allowNull: false },
  fecha_apoyo: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  estado: { type: DataTypes.ENUM('PENDIENTE', 'ACEPTADO', 'RECHAZADO', 'COMPLETADO'), defaultValue: 'PENDIENTE' },
  fecha_respuesta: { type: DataTypes.DATE, allowNull: true },
  observaciones_respuesta: { type: DataTypes.TEXT }
}, {
  sequelize,
  modelName: 'SolicitudApoyo',
  tableName: 'solicitud_apoyo',
  timestamps: false
});

module.exports = SolicitudApoyo;