'use strict';



/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('tipo_tecnico', {
      id_tipo_tecnico: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      nombre_tipo: { type: Sequelize.STRING(100), allowNull: false },
      descripcion: { type: Sequelize.TEXT },
      fecha_creacion: { type: Sequelize.DATE, defaultValue: Sequelize.NOW }
    });

    await queryInterface.createTable('area_especialista', {
      id_area_especialista: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      nombre_area: { type: Sequelize.STRING(100), allowNull: false },
      descripcion: { type: Sequelize.TEXT },
      fecha_creacion: { type: Sequelize.DATE, defaultValue: Sequelize.NOW }
    });

    await queryInterface.createTable('usuario_especialista', {
      id_usuario_especialista: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      id_usuario: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'usuario', key: 'id_usuario' }, onDelete: 'CASCADE' },
      id_tipo_tecnico: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'tipo_tecnico', key: 'id_tipo_tecnico' } },
      id_area_especialista: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'area_especialista', key: 'id_area_especialista' } },
      fecha_asignacion: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
      estado: { type: Sequelize.ENUM('ACTIVO', 'INACTIVO'), defaultValue: 'ACTIVO' }
    });

  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('usuario_especialista');
    await queryInterface.dropTable('area_especialista');
    await queryInterface.dropTable('tipo_tecnico');
  }
};
