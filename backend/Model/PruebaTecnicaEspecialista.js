const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/sequelize');


class PruebaTecnicaEspecialista extends Model {}
PruebaTecnicaEspecialista.init({
  id_prueba_tecnica: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  id_especialista: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'usuario', key: 'id_usuario' } },
  id_asignacion_trabajo: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'asignacion_trabajo', key: 'id_asignacion' }, onDelete: 'CASCADE' },
  descripcion_prueba_tecnica: { type: DataTypes.TEXT, allowNull: false },
  fecha_prueba: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, {
  sequelize,
  modelName: 'PruebaTecnicaEspecialista',
  tableName: 'prueba_tecnica_especialista',
  timestamps: false
});

module.exports = PruebaTecnicaEspecialista;
