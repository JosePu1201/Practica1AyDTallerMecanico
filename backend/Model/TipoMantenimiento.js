const {DataTypes, Model} = require('sequelize');
const sequelize = require('../config/sequelize');

class TipoMantenimiento extends Model {}
TipoMantenimiento.init({
  id_tipo_trabajo: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  nombre_tipo: { type: DataTypes.STRING(100), allowNull: false },
  descripcion: { type: DataTypes.TEXT, allowNull: true },
  precio_base: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
  tiempo_estimado: { type: DataTypes.INTEGER, allowNull: true },
  fecha_creacion: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  estado: { type: DataTypes.ENUM('ACTIVO', 'INACTIVO'), defaultValue: 'ACTIVO' }
}, {
  sequelize,
  modelName: 'TipoMantenimiento',
  tableName: 'tipo_mantenimiento',
  timestamps: false
});

module.exports = TipoMantenimiento;
