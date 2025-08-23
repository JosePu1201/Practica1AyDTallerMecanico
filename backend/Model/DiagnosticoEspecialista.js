const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/sequelize');

class DiagnosticoEspecialista extends Model {}
DiagnosticoEspecialista.init({
  id_diagnostico_especialista: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  id_asignacion_trabajo: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'AsignacionTrabajo', key: 'id_asignacion_trabajo' } },
  id_usuario_especialista: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'Usuario', key: 'id_usuario' } },
  fecha_diagnostico: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  observaciones_generales: { type: DataTypes.TEXT }
}, {
  sequelize,
  modelName: 'DiagnosticoEspecialista',
  tableName: 'diagnostico_especialista',
  timestamps: false
});

module.exports = DiagnosticoEspecialista;
