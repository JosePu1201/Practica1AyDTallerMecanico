'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    
    await queryInterface.createTable('vehiculo', {
      id_vehiculo: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      modelo: { type: Sequelize.STRING(100), allowNull: false },
      marca: { type: Sequelize.STRING(100), allowNull: false },
      placa: { type: Sequelize.STRING(20), allowNull: false, unique: true },
      anio: { type: Sequelize.INTEGER, allowNull: true }, 
      color: { type: Sequelize.STRING(50), allowNull: true },
      numero_serie: { type: Sequelize.STRING(100), allowNull: true },
      kilometraje: { type: Sequelize.INTEGER, defaultValue: 0 },
      id_cliente: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'usuario', key: 'id_usuario' }, onDelete: 'CASCADE' },
      fecha_registro: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
      fecha_modificacion: { type: Sequelize.DATE, defaultValue: Sequelize.NOW, onUpdate : Sequelize.NOW },
      estado: { type: Sequelize.ENUM('ACTIVO', 'INACTIVO'), defaultValue: 'ACTIVO' }
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('vehiculo');
  }
};
