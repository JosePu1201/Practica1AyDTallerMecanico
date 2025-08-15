const {DataTypes, Model} = require('sequelize');
const sequelize = require('../config/sequelize');

class ArticulosSugeridos extends Model {}
ArticulosSugeridos.init({
  id_sugerencia_articulo: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  nombre_articulo: { type: DataTypes.STRING(200), allowNull: false },
  descripcion: { type: DataTypes.TEXT },
  precio: { type: DataTypes.DECIMAL(10, 2) },
  estado: { type: DataTypes.ENUM('PENDIENTE', 'EVALUADO', 'APROBADO', 'RECHAZADO'), defaultValue: 'PENDIENTE' },
  id_proveedor: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'proveedor', key: 'id_proveedor' }, onDelete: 'CASCADE' },
  fecha_sugerencia: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  categoria: { type: DataTypes.STRING(100) },
  marca_compatible: { type: DataTypes.STRING(100) }
}, {
  sequelize,
  modelName: 'ArticulosSugeridos',
  tableName: 'articulos_sugeridos',
  timestamps: false
});

module.exports = ArticulosSugeridos;

