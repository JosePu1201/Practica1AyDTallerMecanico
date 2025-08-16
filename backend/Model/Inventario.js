const {DataTypes, Model} = require('sequelize');
const sequelize = require('../config/sequelize');

/*await queryInterface.createTable('inventario', {
      id_inventario_repuesto: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      id_repuesto: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'repuesto', key: 'id_repuesto' }, onDelete: 'CASCADE' },
      cantidad: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      precio_unitario: { type: Sequelize.DECIMAL(10, 2), allowNull: false },
      fecha_ultima_actualizacion: { type: Sequelize.DATE, defaultValue: Sequelize.NOW, onUpdate: Sequelize.NOW },
    });*/

class Inventario extends Model {}
Inventario.init({
  id_inventario_repuesto: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  id_repuesto: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'repuesto', key: 'id_repuesto' }, onDelete: 'CASCADE' },
  cantidad: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  precio_unitario: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  fecha_ultima_actualizacion: { type: DataTypes.DATE, defaultValue: DataTypes.NOW, onUpdate: DataTypes.NOW },
}, {
  sequelize,
  modelName: 'Inventario',
  tableName: 'inventario',
  timestamps: false
});

module.exports = Inventario;