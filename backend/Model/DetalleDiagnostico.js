const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/sequelize');


class DetalleDiagnostico extends Model {}
DetalleDiagnostico.init({
    id_detalle_diagnostico: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    id_diagnostico_especialista: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'diagnostico_especialista', key: 'id_diagnostico_especialista' }, onDelete: 'CASCADE' },
    tipo_diagnostico: { type: DataTypes.STRING(100), allowNull: false },
    descripcion: { type: DataTypes.TEXT, allowNull: false },
    severidad: { type: DataTypes.ENUM('LEVE', 'MODERADO', 'SEVERO', 'CRITICO'), defaultValue: 'MODERADO' }
}, {
    sequelize,
    modelName: 'DetalleDiagnostico',
    tableName: 'detalle_diagnostico',
    timestamps: false
});

module.exports = DetalleDiagnostico;
