const {DataTypes, Model} = require('sequelize');
const sequelize = require('../config/sequelize');


class SolicitudUsoRepuesto extends Model {}
SolicitudUsoRepuesto.init({
  id_solicitud_uso_repuesto: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  id_asignacion_trabajo: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'asignacion_trabajo', key: 'id_asignacion_trabajo' }, onDelete: 'CASCADE' },
  fecha_uso: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  descripcion: { type: DataTypes.TEXT },
  cantidad: { type: DataTypes.INTEGER, allowNull: false },
  estado: { type: DataTypes.ENUM('PENDIENTE', 'APROBADO', 'RECHAZADO', 'USADO'), defaultValue: 'PENDIENTE' },
  id_usuario_aceptacion: { type: DataTypes.INTEGER, allowNull: true, references: { model: 'usuario', key: 'id_usuario' } },
  id_inventario_repuesto: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'inventario', key: 'id_inventario_repuesto' } },
  fecha_aprobacion: { type: DataTypes.DATE, allowNull: true },
}, {
  sequelize,
  modelName: 'solicitud_uso_repuesto',
  tableName: 'solicitud_uso_repuesto',
  timestamps: false
});

module.exports = SolicitudUsoRepuesto;