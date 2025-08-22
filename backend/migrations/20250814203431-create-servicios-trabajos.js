'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('tipo_mantenimiento', {
      id_tipo_trabajo: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      nombre_tipo: { type: Sequelize.STRING(100), allowNull: false },
      descripcion: { type: Sequelize.TEXT, allowNull: true },
      precio_base: { type: Sequelize.DECIMAL(10, 2), allowNull: true },
      tiempo_estimado: { type: Sequelize.INTEGER, allowNull: true },
      fecha_creacion: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
      estado: { type: Sequelize.ENUM('ACTIVO', 'INACTIVO'), defaultValue: 'ACTIVO' }
    });


    await queryInterface.createTable('registro_servicio_vehiculo', {
      id_registro: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      id_vehiculo: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'vehiculo', key: 'id_vehiculo' }, onDelete: 'CASCADE' },
      descripcion_problema: { type: Sequelize.TEXT, allowNull: false },
      calificacion: { type: Sequelize.TINYINT, validate: { min: 1, max: 5 } },
      estado: { type: Sequelize.ENUM('PENDIENTE', 'EN_PROCESO', 'COMPLETADO', 'CANCELADO'), defaultValue: 'PENDIENTE' },
      fecha_ingreso: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
      fecha_estimada_finalizacion: { type: Sequelize.DATE },
      fecha_finalizacion_real: { type: Sequelize.DATE, allowNull: true },
      observaciones_iniciales: { type: Sequelize.TEXT },
      prioridad: { type: Sequelize.ENUM('BAJA', 'MEDIA', 'ALTA', 'URGENTE'), defaultValue: 'MEDIA' }
    });

    await queryInterface.createTable('asignacion_trabajo', {
      id_asignacion: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      id_tipo_trabajo: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'tipo_mantenimiento', key: 'id_tipo_trabajo' }, onDelete: 'CASCADE' },
      id_registro: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'registro_servicio_vehiculo', key: 'id_registro' }, onDelete: 'CASCADE' },
      id_usuario_empleado: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'usuario', key: 'id_usuario' }, onDelete: 'CASCADE' },
      id_admin_asignacion: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'usuario', key: 'id_usuario' }, onDelete: 'CASCADE' },
      estado: { type: Sequelize.ENUM('ASIGNADO', 'EN_PROCESO', 'COMPLETADO', 'CANCELADO', 'PAUSADO'), defaultValue: 'ASIGNADO' },
      descripcion: { type: Sequelize.TEXT },
      fecha_asignacion: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
      fecha_inicio_real: { type: Sequelize.DATE, allowNull: true },
      fecha_finalizacion: { type: Sequelize.DATE, allowNull: true },
      precio: { type: Sequelize.DECIMAL(10, 2), allowNull: true },
      observaciones_finalizacion: { type: Sequelize.TEXT },
    });


  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('asignacion_trabajo');
    await queryInterface.dropTable('registro_servicio_vehiculo');
    await queryInterface.dropTable('tipo_mantenimiento');
  }
};
