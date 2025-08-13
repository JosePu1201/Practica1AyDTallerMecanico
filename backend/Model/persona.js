const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const persona = sequelize.define('persona', {
    id_persona: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    nombre: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    apellido: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    dpi: {
        type: DataTypes.STRING(20),
        allowNull: false,
        unique: true
    },
    fecha_nacimiento: {
        type: DataTypes.DATEONLY,
        allowNull: true
    },
    direccion: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    estado: {
        type: DataTypes.ENUM('ACTIVO', 'INACTIVO'),
        defaultValue: 'ACTIVO'
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
    tableName: 'persona',
    indexes: [
        { fields: ['dpi'], name: 'idx_dpi' },
        { fields: ['estado'], name: 'idx_estado' }
    ],
    timestamps: false
});

module.exports =persona;