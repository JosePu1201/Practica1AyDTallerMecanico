'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    
    await queryInterface.createTable('comentarios_seguimiento_cliente', {
      id_comentario: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      id_registro: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'registro_servicio_vehiculo', key: 'id_registro' }, onDelete: 'CASCADE' },
      id_cliente: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'usuario', key: 'id_usuario' } },
      comentario: { type: Sequelize.TEXT, allowNull: false },
      fecha_comentario: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
      tipo_comentario: { type: Sequelize.ENUM('CONSULTA', 'QUEJA', 'SUGERENCIA', 'AGRADECIMIENTO'), defaultValue: 'CONSULTA' }
    });

    await queryInterface.createTable('servicios_adicionales', {
      id_servicio_adicional: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      id_registro: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'registro_servicio_vehiculo', key: 'id_registro' }, onDelete: 'CASCADE' },
      id_tipo_trabajo: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'tipo_mantenimiento', key: 'id_tipo_trabajo' } },
      descripcion: { type: Sequelize.TEXT, allowNull: false },
      estado: { type: Sequelize.ENUM('SOLICITADO', 'APROBADO', 'RECHAZADO', 'COMPLETADO'), defaultValue: 'SOLICITADO' },
      fecha_solicitud: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
      costo_estimado: { type: Sequelize.DECIMAL(10, 2) }
    });


    await queryInterface.createTable('cotizacion_servicio_vehiculo', {
      id_registro_cotizacion: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      id_vehiculo: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'vehiculo', key: 'id_vehiculo' } },
      descripcion_problema: { type: Sequelize.TEXT, allowNull: false },
      estado: { type: Sequelize.ENUM('PENDIENTE', 'ENVIADO', 'APROBADO', 'RECHAZADO'), defaultValue: 'PENDIENTE' },
      fecha_cotizacion: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
      fecha_vencimiento: { type: Sequelize.DATE },
      total_cotizacion: { type: Sequelize.DECIMAL(10, 2) }
    });

    await queryInterface.createTable('trabajos_cotizacion', {
      id_trabajo_cotizacion: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      id_tipo_trabajo: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'tipo_mantenimiento', key: 'id_tipo_trabajo' } },
      id_registro_cotizacion: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'cotizacion_servicio_vehiculo', key: 'id_registro_cotizacion' }, onDelete: 'CASCADE' },
      estado: { type: Sequelize.ENUM('INCLUIDO', 'OPCIONAL', 'EXCLUIDO'), defaultValue: 'INCLUIDO' },
      fecha_asignacion: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
      fecha_finalizacion: { type: Sequelize.DATE },
      precio: { type: Sequelize.DECIMAL(10, 2), allowNull: false },
      descripcion_trabajo: { type: Sequelize.TEXT }
    });

  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('trabajos_cotizacion');
    await queryInterface.dropTable('cotizacion_servicio_vehiculo');
    await queryInterface.dropTable('servicios_adicionales');
    await queryInterface.dropTable('comentarios_seguimiento_cliente');
  }
};
