const {DataTypes, Model} = require('sequelize');
const sequelize = require('../config/sequelize');


class PagosFactura extends Model {}
PagosFactura.init({
  id_pago: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  id_factura: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'factura_servicio_vehiculo', key: 'id_factura' }, onDelete: 'CASCADE' },
  monto_pago: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  fecha_pago: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  metodo_pago: { type: DataTypes.ENUM('EFECTIVO', 'TARJETA', 'TRANSFERENCIA', 'CHEQUE'), allowNull: false },
  referencia_pago: { type: DataTypes.STRING(100) },
  id_usuario_registro: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'usuario', key: 'id_usuario' }, onDelete: 'CASCADE' },
  observaciones: { type: DataTypes.TEXT },
}, {
  sequelize,
  modelName: 'PagosFactura',
  tableName: 'pagos_factura',
  timestamps: false
});

module.exports = PagosFactura;