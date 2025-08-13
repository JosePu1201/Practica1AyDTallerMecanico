const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const token_autenticacion = sequelize.define('token_autenticacion', {
    id_token: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    id_usuario: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'usuario',
            key: 'id_usuario'
        },
        onDelete: 'CASCADE'
    },
    token: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    tipo_token: {
        type: DataTypes.ENUM('2FA', 'RECUPERACION_PASSWORD'),
        allowNull: false
    },
    fecha_creacion: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    },
    fecha_expiracion: {
        type: DataTypes.DATE,
        allowNull: false
    },
    estado: {
        type: DataTypes.ENUM('ACTIVO', 'USADO', 'EXPIRADO'),
        defaultValue: 'ACTIVO'
    },
    codigo_verificacion: {
        type: DataTypes.STRING(10),
        allowNull: true
    }
}, {
    tableName: 'token_autenticacion',
    indexes: [
        { fields: ['token'], name: 'idx_token' },
        { fields: ['id_usuario', 'tipo_token'], name: 'idx_usuario_tipo' },
        { fields: ['estado'], name: 'idx_estado' }
    ],
    timestamps: false
});

module.exports = token_autenticacion;