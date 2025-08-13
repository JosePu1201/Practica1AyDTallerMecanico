const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const historial_login = sequelize.define('historial_login', {
    id_historial: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    id_usuario: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'usuario',
            key: 'id_usuario'
        },
        onDelete: 'SET NULL'
    },
    fecha_intento: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    },
    ip_address: {
        type: DataTypes.STRING(45),
        allowNull: true
    },
    resultado: {
        type: DataTypes.ENUM('EXITOSO', 'FALLIDO'),
        allowNull: false
    },
    tipo_fallo: {
        type: DataTypes.ENUM('PASSWORD_INCORRECTO', 'USUARIO_BLOQUEADO', 'USUARIO_INACTIVO', '2FA_FALLIDO'),
        allowNull: true
    },
    navegador: {
        type: DataTypes.STRING(255),
        allowNull: true
    }
}, {
    tableName: 'historial_login',
    indexes: [
        { fields: ['id_usuario', 'fecha_intento'], name: 'idx_usuario_fecha' },
        { fields: ['resultado'], name: 'idx_resultado' }
    ],
    timestamps: false
});

module.exports = historial_login;