const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const rol = sequelize.define('rol', {
    id_rol: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    nombre_rol: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true
    },
    descripcion: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    fecha_creacion: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
}, {
    tableName: 'rol',
    timestamps: false
});

module.exports = rol;