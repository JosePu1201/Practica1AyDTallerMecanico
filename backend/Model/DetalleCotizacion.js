const {DataTypes, Model} = require('sequelize');
const sequelize = require('../config/sequelize');


class DetalleCotizacion extends Model {}
DetalleCotizacion.init({
    id_detalle_cotizacion: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    id_cotizacion: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'cotizacion_productos', key: 'id_cotizacion' }, onDelete: 'CASCADE' },
    id_catalogo: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'catalogo_proveedor', key: 'id_catalogo' } },
    precio_cotizado: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    cantidad: { type: DataTypes.INTEGER, allowNull: false },
    subtotal: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    descuento_porcentaje: { type: DataTypes.DECIMAL(5, 2), defaultValue: 0 },
    observaciones: { type: DataTypes.TEXT },
}, {
    sequelize,
    modelName: 'DetalleCotizacion',
    tableName: 'detalle_cotizacion',
    timestamps: false
});

module.exports = DetalleCotizacion;

