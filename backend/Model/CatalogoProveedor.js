const {DataTypes, Model} = require('sequelize');
const sequelize = require('../config/sequelize');

class CatalogoProveedor extends Model {}
CatalogoProveedor.init({
  id_catalogo: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  id_proveedor: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'proveedor', key: 'id_proveedor' }, onDelete: 'CASCADE' },
  id_repuesto: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'repuesto', key: 'id_repuesto' } },
  precio: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  cantidad_disponible: { type: DataTypes.INTEGER, defaultValue: 0 },
  tiempo_entrega: { type: DataTypes.INTEGER },
  fecha_actualizacion: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  estado: { type: DataTypes.ENUM('DISPONIBLE', 'AGOTADO', 'DESCONTINUADO'), defaultValue: 'DISPONIBLE' }
}, {
  sequelize,
  modelName: 'CatalogoProveedor',
  tableName: 'catalogo_proveedor',
  timestamps: false
});

module.exports = CatalogoProveedor;