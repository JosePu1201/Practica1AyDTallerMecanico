const {DataTypes, Model} = require('sequelize');
const sequelize = require('../config/sequelize');

class ContactoPersona extends Model {}
ContactoPersona.init({
    id_contacto: {type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true},
    id_persona: {type: DataTypes.INTEGER, allowNull: false, references: {model: 'persona', key: 'id_persona'}, onDelete: 'CASCADE'},
    correo: {type: DataTypes.STRING(150), allowNull: true},
    telefono: {type: DataTypes.STRING(20), allowNull: true},
    fecha_creacion: {type: DataTypes.DATE, defaultValue: DataTypes.NOW}
},
{
    sequelize,
    modelName: 'ContactoPersona',
    tableName: 'contacto_persona',
    timestamps: false
});

module.exports = ContactoPersona;