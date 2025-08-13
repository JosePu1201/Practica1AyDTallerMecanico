'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('token_autenticacion', {
      id_token: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      id_usuario: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'usuario', key: 'id_usuario' }, onDelete: 'CASCADE' },
      token: { type: Sequelize.STRING(255), allowNull: false },
      tipo_token: { type: Sequelize.ENUM('2FA', 'RECUPERACION_PASSWORD'), allowNull: false },
      fecha_creacion: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
      fecha_expiracion: { type: Sequelize.DATE, allowNull: false },
      estado: { type: Sequelize.ENUM('ACTIVO', 'USADO', 'EXPIRADO'), defaultValue: 'ACTIVO' },
      codigo_verificacion: { type: Sequelize.STRING(10) }
    });

    await queryInterface.createTable('historial_login', {
      id_historial: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      id_usuario: { type: Sequelize.INTEGER, allowNull: true, references: { model: 'usuario', key: 'id_usuario' }, onDelete: 'SET NULL' },
      fecha_intento: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
      ip_address: { type: Sequelize.STRING(45) },
      resultado: { type: Sequelize.ENUM('EXITOSO', 'FALLIDO'), allowNull: false },
      tipo_fallo: { type: Sequelize.ENUM('PASSWORD_INCORRECTO', 'USUARIO_BLOQUEADO', 'USUARIO_INACTIVO', '2FA_FALLIDO'), allowNull: true },
      navegador: { type: Sequelize.STRING(255) }
    });

  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('historial_login');
    await queryInterface.dropTable('token_autenticacion');
  }
};
