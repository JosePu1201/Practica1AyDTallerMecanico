const {DataTypes, Model} = require('sequelize');
const sequelize = require('../config/sequelize');


class Vehiculo extends Model {}
Vehiculo.init({
  id_vehiculo: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  modelo: { type: DataTypes.STRING(100), allowNull: false },
  marca: { type: DataTypes.STRING(100), allowNull: false },
  placa: { type: DataTypes.STRING(20), allowNull: false, unique: true },
  anio: { type: DataTypes.INTEGER, allowNull: true },
  color: { type: DataTypes.STRING(50), allowNull: true },
  numero_serie: { type: DataTypes.STRING(100), allowNull: true },
  kilometraje: { type: DataTypes.INTEGER, defaultValue: 0 },
  id_cliente: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'usuario', key: 'id_usuario' }, onDelete: 'CASCADE' },
  fecha_registro: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  fecha_modificacion: { type: DataTypes.DATE, defaultValue: DataTypes.NOW, onUpdate: DataTypes.NOW },
  estado: { type: DataTypes.ENUM('ACTIVO', 'INACTIVO'), defaultValue: 'ACTIVO' }
}, {
  sequelize,
  modelName: 'Vehiculo',
  tableName: 'vehiculo',
  timestamps: false
});

module.exports = Vehiculo;