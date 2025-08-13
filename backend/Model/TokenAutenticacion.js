const {DataTypes, Model} = require('sequelize');
const sequelize = require('../config/sequelize');

class TokenAutenticacion extends Model {}
TokenAutenticacion.init({
    id_token: {type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true},
    id_usuario: {type: DataTypes.INTEGER, allowNull: false, references: {model: 'usuario', key: 'id_usuario'}, onDelete: 'CASCADE'},
    token: {type: DataTypes.STRING(255), allowNull: false},
    tipo_token: {type: DataTypes.ENUM('2FA', 'RECUPERACION_PASSWORD'), allowNull: false},
    fecha_creacion: {type: DataTypes.DATE, defaultValue: DataTypes.NOW},
    fecha_expiracion: {type: DataTypes.DATE, allowNull: false},
    estado: {type: DataTypes.ENUM('ACTIVO', 'USADO', 'EXPIRADO'), defaultValue: 'ACTIVO'},
    codigo_verificacion: {type: DataTypes.STRING(10), allowNull: true}
},
{
    sequelize,
    modelName: 'TokenAutenticacion',
    tableName: 'token_autenticacion',
    timestamps: false
});

module.exports = TokenAutenticacion;