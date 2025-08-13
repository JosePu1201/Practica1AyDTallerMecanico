const {DataTypes, Model} = require('sequelize');
const sequelize = require('../config/sequelize');

class HistorialLogin extends Model {}
HistorialLogin.init({
    id_historial: {type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true},
    id_usuario: {type: DataTypes.INTEGER, allowNull: true, references: {model: 'usuario', key: 'id_usuario'}, onDelete: 'SET NULL'},
    fecha_intento: {type: DataTypes.DATE, defaultValue: DataTypes.NOW},
    ip_address: {type: DataTypes.STRING(45), allowNull: true},
    resultado: {type: DataTypes.ENUM('EXITOSO', 'FALLIDO'), allowNull: false},
    tipo_fallo: {type: DataTypes.ENUM('PASSWORD_INCORRECTO', 'USUARIO_BLOQUEADO', 'USUARIO_INACTIVO', '2FA_FALLIDO'), allowNull: true},
    navegador: {type: DataTypes.STRING(255), allowNull: true}
},
{
    sequelize,
    modelName: 'HistorialLogin',
    tableName: 'historial_login',
    timestamps: false
});

module.exports = HistorialLogin;