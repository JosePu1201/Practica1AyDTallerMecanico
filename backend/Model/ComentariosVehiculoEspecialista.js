const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/sequelize');


class ComentariosVehiculoEspecialista extends Model {}
ComentariosVehiculoEspecialista.init({
  id_comentario: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  id_asignacion_trabajo: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'asignacion_trabajo', key: 'id_asignacion' }, onDelete: 'CASCADE' },
  id_especialista: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'usuario', key: 'id_usuario' } },
  comentario: { type: DataTypes.TEXT, allowNull: false },
  fecha_comentario: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  tipo_comentario: { type: DataTypes.ENUM('OBSERVACION', 'RECOMENDACION', 'ADVERTENCIA'), defaultValue: 'OBSERVACION' }
}, {
  sequelize,
  modelName: 'ComentariosVehiculoEspecialista',
  tableName: 'comentarios_vehiculo_especialista',
  timestamps: false
});

module.exports = ComentariosVehiculoEspecialista;
