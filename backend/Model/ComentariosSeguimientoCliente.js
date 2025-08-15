const {DataTypes, Model} = require('sequelize');
const sequelize = require('../config/sequelize');

class ComentariosSeguimientoCliente extends Model {}
ComentariosSeguimientoCliente.init({
  id_comentario: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  id_registro: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'registro_servicio_vehiculo', key: 'id_registro' }, onDelete: 'CASCADE' },
  id_cliente: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'usuario', key: 'id_usuario' } },
  comentario: { type: DataTypes.TEXT, allowNull: false },
  fecha_comentario: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  tipo_comentario: { type: DataTypes.ENUM('CONSULTA', 'QUEJA', 'SUGERENCIA', 'AGRADECIMIENTO'), defaultValue: 'CONSULTA' }
}, {
  sequelize,
  modelName: 'ComentariosSeguimientoCliente',
  tableName: 'comentarios_seguimiento_cliente',
  timestamps: false
});

module.exports = ComentariosSeguimientoCliente;