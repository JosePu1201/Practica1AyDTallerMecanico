const {DataTypes, Model} = require('sequelize');
const sequelize = require('../config/sequelize');


class UsuarioEspecialista extends Model {}
UsuarioEspecialista.init({
    id_usuario_especialista: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    id_usuario: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'usuario', key: 'id_usuario' }, onDelete: 'CASCADE' },
    id_tipo_tecnico: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'tipo_tecnico', key: 'id_tipo_tecnico' } },
    id_area_especialista: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'area_especialista', key: 'id_area_especialista' } },
    fecha_asignacion: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    estado: { type: DataTypes.ENUM('ACTIVO', 'INACTIVO'), defaultValue: 'ACTIVO' }
}, {
    sequelize,
    modelName: 'UsuarioEspecialista',
    tableName: 'usuario_especialista',
    timestamps: false
});

module.exports = UsuarioEspecialista;