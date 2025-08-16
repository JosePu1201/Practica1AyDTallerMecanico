const {DataTypes, Model} = require('sequelize');
const sequelize = require('../config/sequelize');


class CotizacionProductos extends Model {}
CotizacionProductos.init({
  id_cotizacion: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  id_proveedor: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'proveedor', key: 'id_proveedor' }, onDelete: 'CASCADE' },
  numero_cotizacion: { type: DataTypes.STRING(50), unique: true },
  fecha_cotizacion: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  fecha_vencimiento: { type: DataTypes.DATE },
  estado: { type: DataTypes.ENUM('PENDIENTE', 'ENVIADO', 'APROBADO', 'RECHAZADO', 'VENCIDO'), defaultValue: 'PENDIENTE' },
  total: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  observaciones: { type: DataTypes.TEXT },
  id_usuario_solicita: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'usuario', key: 'id_usuario' } }
}, {
  sequelize,
  modelName: 'CotizacionProductos',
  tableName: 'cotizacion_productos',
  timestamps: false
});


module.exports = CotizacionProductos;
