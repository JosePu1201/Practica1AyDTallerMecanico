const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/sequelize');



class SugerirRepuesto extends Model {}
SugerirRepuesto.init({
  id_sugerencia_repuesto: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  id_solicitud_uso_repuesto: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'solicitud_uso_repuesto', key: 'id_solicitud_uso_repuesto' }, onDelete: 'CASCADE' },
  id_inventario_repuesto: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'inventario', key: 'id_inventario_repuesto' } },
  cantidad: { type: DataTypes.INTEGER, allowNull: false },
  estado: { type: DataTypes.ENUM('PENDIENTE', 'ACEPTADO', 'RECHAZADO'), defaultValue: 'PENDIENTE' },
  fecha_sugerencia: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  descripcion_sugerencia: { type: DataTypes.TEXT },
  justificacion: { type: DataTypes.TEXT }
}, {
  sequelize,
  modelName: 'SugerirRepuesto',
  tableName: 'sugerir_repuesto',
  timestamps: false
});

module.exports = SugerirRepuesto;
