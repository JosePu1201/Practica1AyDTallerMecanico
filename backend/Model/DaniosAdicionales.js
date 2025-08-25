const {DataTypes, Model} = require('sequelize');
const sequelize = require('../config/sequelize');


class DaniosAdicionales extends Model {}

DaniosAdicionales.init({
  id_danio: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  id_asignacion_trabajo: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'asignacion_trabajo', key: 'id_asignacion' }, onDelete: 'CASCADE' },
  descripcion_danio: { type: DataTypes.TEXT, allowNull: false },
  fecha_danio: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  costo_estimado: { type: DataTypes.DECIMAL(10, 2) },
  requiere_autorizacion: { type: DataTypes.BOOLEAN, defaultValue: true },
  autorizado: { type: DataTypes.BOOLEAN, defaultValue: false }
}, {
  sequelize,
  modelName: 'DaniosAdicionales',
  tableName: 'danios_adicionales',
  timestamps: false
});

module.exports = DaniosAdicionales;