'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {

    await queryInterface.createTable('proveedor', {
      id_proveedor: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      id_usuario: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'usuario', key: 'id_usuario' }, onDelete: 'CASCADE' },
      nit: { type: Sequelize.STRING(20), allowNull: true },
      fecha_registro: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
      estado: { type: Sequelize.ENUM('ACTIVO', 'INACTIVO'), defaultValue: 'ACTIVO' }
    });


    await queryInterface.createTable('repuesto', {
      id_repuesto: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      nombre: { type: Sequelize.STRING(200), allowNull: false },
      descripcion: { type: Sequelize.TEXT, allowNull: true },
      codigo_parte: { type: Sequelize.STRING(100), allowNull: true },
      marca_compatible: { type: Sequelize.STRING(100), allowNull: true },
      id_proveedor: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'proveedor', key: 'id_proveedor' }, onDelete: 'CASCADE' },
      fecha_creacion: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
      estado: { type: Sequelize.ENUM('ACTIVO', 'DESCONTINUADO'), defaultValue: 'ACTIVO' }
    });

    
    await queryInterface.createTable('inventario', {
      id_inventario_repuesto: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      id_repuesto: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'repuesto', key: 'id_repuesto' }, onDelete: 'CASCADE' },
      cantidad: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      precio_unitario: { type: Sequelize.DECIMAL(10, 2), allowNull: false },
      fecha_ultima_actualizacion: { type: Sequelize.DATE, defaultValue: Sequelize.NOW, onUpdate: Sequelize.NOW },
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('inventario');
    await queryInterface.dropTable('repuesto');
    await queryInterface.dropTable('proveedor');
  }
};
