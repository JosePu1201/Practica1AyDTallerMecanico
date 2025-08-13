const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const usuario = sequelize.define('usuario', {
    id_usuario: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    id_persona: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'persona',
            key: 'id_persona'
        },
        onDelete: 'CASCADE'
    },
    nombre_usuario: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true
    },
    contrasena: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    id_rol: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'rol',
            key: 'id_rol'
        }
    },
    estado: {
        type: DataTypes.ENUM('ACTIVO', 'INACTIVO', 'BLOQUEADO'),
        defaultValue: 'ACTIVO'
    },
    ultimo_acceso: {
        type: DataTypes.DATE,
        allowNull: true
    },
    fecha_creacion: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    },
    fecha_modificacion: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
}, {
    tableName: 'usuario',
    indexes: [
        { fields: ['nombre_usuario'], name: 'idx_username' },
        { fields: ['estado'], name: 'idx_estado' }
    ],
    timestamps: false
});

module.exports = usuario;