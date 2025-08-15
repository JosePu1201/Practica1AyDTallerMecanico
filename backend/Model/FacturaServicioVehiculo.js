const {DataTypes, Model} = require('sequelize');
const sequelize = require('../config/sequelize');

class FacturaServicioVehiculo extends Model {}
FacturaServicioVehiculo.init({
  id_factura: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  id_registro: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'registro_servicio_vehiculo', key: 'id_registro' }, onDelete: 'CASCADE' },
  numero_factura: { type: DataTypes.STRING(50), allowNull: false, unique: true },
  fecha_emision: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  fecha_vencimiento: { type: DataTypes.DATE },
  subtotal: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  impuestos: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
  descuentos: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
  total: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  estado_pago: { type: DataTypes.ENUM('PENDIENTE', 'PARCIAL', 'PAGADO', 'VENCIDO'), defaultValue: 'PENDIENTE' },
  metodo_pago_preferido: { type: DataTypes.ENUM('EFECTIVO', 'TARJETA', 'TRANSFERENCIA', 'CHEQUE') },
  observaciones: { type: DataTypes.TEXT },
}, {
  sequelize,
  modelName: 'FacturaServicioVehiculo',
  tableName: 'factura_servicio_vehiculo',
  timestamps: false
});

module.exports = FacturaServicioVehiculo;