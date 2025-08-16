const {DataTypes, Model} = require('sequelize');
const sequelize = require('../config/sequelize');

class DetallePedido extends Model {}
DetallePedido.init({
  id_detalle_pedido: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  id_pedido: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'pedido_proveedor', key: 'id_pedido' }, onDelete: 'CASCADE' },
  id_catalogo: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'catalogo_proveedor', key: 'id_catalogo' } },
  cantidad: { type: DataTypes.INTEGER, allowNull: false },
  precio_unitario: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  subtotal: { type: DataTypes.DECIMAL(10, 2), allowNull: false }
}, {
  sequelize,
  modelName: 'DetallePedido',
  tableName: 'detalle_pedido',
  timestamps: false
});

module.exports = DetallePedido;