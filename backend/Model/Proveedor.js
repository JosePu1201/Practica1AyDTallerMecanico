const {DataTypes, Model} = require('sequelize');
const sequelize = require('../config/sequelize');

/*await queryInterface.createTable('proveedor', {
      id_proveedor: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      id_usuario: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'usuario', key: 'id_usuario' }, onDelete: 'CASCADE' },
      nit: { type: Sequelize.STRING(20), allowNull: true },
      fecha_registro: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
      estado: { type: Sequelize.ENUM('ACTIVO', 'INACTIVO'), defaultValue: 'ACTIVO' }
    });*/

class Proveedor extends Model {}
Proveedor.init({
  id_proveedor: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  id_usuario: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'usuario', key: 'id_usuario' }, onDelete: 'CASCADE' },
  nit: { type: DataTypes.STRING(20), allowNull: true },
  fecha_registro: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  estado: { type: DataTypes.ENUM('ACTIVO', 'INACTIVO'), defaultValue: 'ACTIVO' }
}, {
  sequelize,
  modelName: 'Proveedor',
  tableName: 'proveedor',
  timestamps: false
});

module.exports = Proveedor;