const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/sequelize');


class ResultadoPruebaTecnica extends Model {}
ResultadoPruebaTecnica.init({
  id_resultado_prueba: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  id_prueba_tecnica: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'prueba_tecnica_especialista', key: 'id_prueba_tecnica' }, onDelete: 'CASCADE' },
  descripcion_resultado: { type: DataTypes.TEXT, allowNull: false },
  fecha_resultado: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  resultado_satisfactorio: { type: DataTypes.BOOLEAN, defaultValue: false }
}, {
  sequelize,
  modelName: 'ResultadoPruebaTecnica',
  tableName: 'resultado_prueba_tecnica',
  timestamps: false
});

module.exports = ResultadoPruebaTecnica;
