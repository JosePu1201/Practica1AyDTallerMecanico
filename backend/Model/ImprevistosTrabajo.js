const {DataTypes, Model} = require('sequelize');
const sequelize = require('../config/sequelize');

/*await queryInterface.createTable('imprevistos_trabajo', {
      id_imprevisto: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      id_asignacion_trabajo: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'asignacion_trabajo', key: 'id_asignacion_trabajo' }, onDelete: 'CASCADE' },
      fecha_imprevisto: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
      descripcion_imprevisto: { type: Sequelize.TEXT, allowNull: false },
      impacto_tiempo: { type: Sequelize.INTEGER },
      impacto_costo: { type: Sequelize.DECIMAL(10, 2) }
    });*/

class ImprevistosTrabajo extends Model {}
ImprevistosTrabajo.init({
  id_imprevisto: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  id_asignacion_trabajo: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'asignacion_trabajo', key: 'id_asignacion' }, onDelete: 'CASCADE' },
  fecha_imprevisto: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  descripcion_imprevisto: { type: DataTypes.TEXT, allowNull: false },
  impacto_tiempo: { type: DataTypes.INTEGER },
  impacto_costo: { type: DataTypes.DECIMAL(10, 2) }
}, {
  sequelize,
  modelName: 'ImprevistosTrabajo',
  tableName: 'imprevistos_trabajo',
  timestamps: false
});

module.exports = ImprevistosTrabajo;