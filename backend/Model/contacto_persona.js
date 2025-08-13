const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const contacto_persona = sequelize.define('contacto_persona', {
    id_contacto: {
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
    correo: {
        type: DataTypes.STRING(150),
        allowNull: true
    },
    telefono: {
        type: DataTypes.STRING(20),
        allowNull: true
    },
    fecha_creacion: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
}, {
    indexes: [
        { fields: ['id_persona'], name: 'idx_persona' },
        { fields: ['correo'], name: 'idx_correo' }
    ],
    timestamps: false
});

module.exports = contacto_persona;