const {DataTypes, Model} = require('sequelize');
const sequelize = require('../config/sequelize');


class PagosProveedor extends Model {}
PagosProveedor.init({
  id_pago_proveedor: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  id_pedido: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'pedido_proveedor', key: 'id_pedido' }, onDelete: 'CASCADE' },
  monto: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  fecha_pago: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  metodo_pago: { type: DataTypes.ENUM('EFECTIVO', 'CHEQUE', 'TRANSFERENCIA', 'TARJETA'), allowNull: false },
  referencia: { type: DataTypes.STRING(100) },
  estado: { type: DataTypes.ENUM('PENDIENTE', 'PAGADO', 'RECHAZADO'), defaultValue: 'PENDIENTE' },
  observaciones: { type: DataTypes.TEXT },
  id_usuario_registro: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'usuario', key: 'id_usuario' } }
}, {
  sequelize,
  modelName: 'PagosProveedor',
  tableName: 'pagos_proveedor',
  timestamps: false
});


module.exports = PagosProveedor;