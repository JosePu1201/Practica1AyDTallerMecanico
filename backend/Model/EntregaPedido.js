const {DataTypes, Model} = require('sequelize');
const sequelize = require('../config/sequelize');


class EntregaPedido extends Model {}
EntregaPedido.init({
  id_entrega: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  id_pedido: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'pedido_proveedor', key: 'id_pedido' }, onDelete: 'CASCADE' },
  fecha_entrega_real: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  estado_entrega: { type: DataTypes.ENUM('PENDIENTE', 'PARCIAL', 'COMPLETA', 'RETRASADA'), defaultValue: 'PENDIENTE' },
  observaciones_entrega: { type: DataTypes.TEXT },
  id_usuario_recibe: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'usuario', key: 'id_usuario' } },
  documento_entrega: { type: DataTypes.STRING(100) }
}, {
  sequelize,
  modelName: 'EntregaPedido',
  tableName: 'entrega_pedido',
  timestamps: false
});

module.exports = EntregaPedido;
