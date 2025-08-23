const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/sequelize');

class SolucionPropuesta extends Model {}
SolucionPropuesta.init({
  id_solucion: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  id_resultado_prueba: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'resultado_prueba_tecnica', key: 'id_resultado_prueba' }, onDelete: 'CASCADE' },
  descripcion_solucion: { type: DataTypes.TEXT, allowNull: false },
  costo_estimado: { type: DataTypes.DECIMAL(10, 2) },
  tiempo_estimado: { type: DataTypes.INTEGER },
  prioridad: { type: DataTypes.ENUM('BAJA', 'MEDIA', 'ALTA', 'URGENTE'), defaultValue: 'MEDIA' },
  fecha_propuesta: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, {
  sequelize,
  modelName: 'SolucionPropuesta',
  tableName: 'solucion_propuesta',
  timestamps: false
});

module.exports = SolucionPropuesta;
