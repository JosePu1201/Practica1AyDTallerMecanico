const {DataTypes, Model} = require('sequelize');
const sequelize = require('../config/sequelize');


class PedidoProveedor extends Model {}
PedidoProveedor.init({
  id_pedido: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  id_proveedor: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'proveedor', key: 'id_proveedor' } },
  numero_pedido: { type: DataTypes.STRING(50), unique: true },
  total: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  fecha_pedido: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  fecha_entrega_solicitada: { type: DataTypes.DATE },
  estado: { type: DataTypes.ENUM('PENDIENTE', 'CONFIRMADO', 'EN_TRANSITO', 'ENTREGADO', 'CANCELADO'), defaultValue: 'PENDIENTE' },
  observaciones: { type: DataTypes.TEXT },
}, {
  sequelize,
  modelName: 'PedidoProveedor',
  tableName: 'pedido_proveedor',
  timestamps: false
});

module.exports = PedidoProveedor;