const {DataTypes, Model} = require('sequelize');
const sequelize = require('../config/sequelize');


class Repuesto extends Model {}
Repuesto.init({
  id_repuesto: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  nombre: { type: DataTypes.STRING(200), allowNull: false },
  descripcion: { type: DataTypes.TEXT, allowNull: true },
  codigo_parte: { type: DataTypes.STRING(100), allowNull: true },
  marca_compatible: { type: DataTypes.STRING(100), allowNull: true },
  id_proveedor: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'proveedor', key: 'id_proveedor' }, onDelete: 'CASCADE' },
  fecha_creacion: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  estado: { type: DataTypes.ENUM('ACTIVO', 'DESCONTINUADO'), defaultValue: 'ACTIVO' }
}, {
  sequelize,
  modelName: 'Repuesto',
  tableName: 'repuesto',
  timestamps: false
});

module.exports = Repuesto;