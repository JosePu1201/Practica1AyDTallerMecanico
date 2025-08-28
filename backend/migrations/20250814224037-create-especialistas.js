'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    
    await queryInterface.createTable('diagnostico_especialista', {
      id_diagnostico_especialista: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      id_asignacion_trabajo: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'asignacion_trabajo', key: 'id_asignacion' }, onDelete: 'CASCADE' },
      id_usuario_especialista: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'usuario', key: 'id_usuario' } },
      fecha_diagnostico: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
      observaciones_generales: { type: Sequelize.TEXT }
    });

    await queryInterface.createTable('detalle_diagnostico', {
      id_detalle_diagnostico: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      id_diagnostico_especialista: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'diagnostico_especialista', key: 'id_diagnostico_especialista' }, onDelete: 'CASCADE' },
      tipo_diagnostico: { type: Sequelize.STRING(100), allowNull: false },
      descripcion: { type: Sequelize.TEXT, allowNull: false },
      severidad: { type: Sequelize.ENUM('LEVE', 'MODERADO', 'SEVERO', 'CRITICO'), defaultValue: 'MODERADO' }
    });


    await queryInterface.createTable('prueba_tecnica_especialista', {
      id_prueba_tecnica: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      id_especialista: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'usuario', key: 'id_usuario' } },
      id_asignacion_trabajo: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'asignacion_trabajo', key: 'id_asignacion' }, onDelete: 'CASCADE' },
      descripcion_prueba_tecnica: { type: Sequelize.TEXT, allowNull: false },
      fecha_prueba: { type: Sequelize.DATE, defaultValue: Sequelize.NOW }
    });

    await queryInterface.createTable('resultado_prueba_tecnica', {
      id_resultado_prueba: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      id_prueba_tecnica: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'prueba_tecnica_especialista', key: 'id_prueba_tecnica' }, onDelete: 'CASCADE' },
      descripcion_resultado: { type: Sequelize.TEXT, allowNull: false },
      fecha_resultado: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
      resultado_satisfactorio: { type: Sequelize.BOOLEAN, defaultValue: false }
    });

    await queryInterface.createTable('solucion_propuesta', {
      id_solucion: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      id_resultado_prueba: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'resultado_prueba_tecnica', key: 'id_resultado_prueba' }, onDelete: 'CASCADE' },
      descripcion_solucion: { type: Sequelize.TEXT, allowNull: false },
      costo_estimado: { type: Sequelize.DECIMAL(10, 2) },
      tiempo_estimado: { type: Sequelize.INTEGER },
      prioridad: { type: Sequelize.ENUM('BAJA', 'MEDIA', 'ALTA', 'URGENTE'), defaultValue: 'MEDIA' },
      fecha_propuesta: { type: Sequelize.DATE, defaultValue: Sequelize.NOW }
    });

    await queryInterface.createTable('comentarios_vehiculo_especialista', {
      id_comentario: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      id_asignacion_trabajo: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'asignacion_trabajo', key: 'id_asignacion' }, onDelete: 'CASCADE' },
      id_especialista: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'usuario', key: 'id_usuario' } },
      comentario: { type: Sequelize.TEXT, allowNull: false },
      fecha_comentario: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
      tipo_comentario: { type: Sequelize.ENUM('OBSERVACION', 'RECOMENDACION', 'ADVERTENCIA'), defaultValue: 'OBSERVACION' }
    });


    await queryInterface.createTable('recomendaciones_vehiculo', {
      id_recomendacion: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      id_asignacion_trabajo: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'asignacion_trabajo', key: 'id_asignacion' }, onDelete: 'CASCADE' },
      id_especialista: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'usuario', key: 'id_usuario' } },
      recomendacion: { type: Sequelize.TEXT, allowNull: false },
      fecha_recomendacion: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
      prioridad: { type: Sequelize.ENUM('BAJA', 'MEDIA', 'ALTA', 'URGENTE'), defaultValue: 'MEDIA' },
      tipo_recomendacion: { type: Sequelize.ENUM('MANTENIMIENTO_PREVENTIVO', 'REPARACION_FUTURA', 'CAMBIO_HABITOS'), defaultValue: 'MANTENIMIENTO_PREVENTIVO' }
    });

    await queryInterface.createTable('sugerir_repuesto', {
      id_sugerencia_repuesto: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      id_solicitud_uso_repuesto: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'solicitud_uso_repuesto', key: 'id_solicitud_uso_repuesto' }, onDelete: 'CASCADE' },
      id_inventario_repuesto: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'inventario', key: 'id_inventario_repuesto' } },
      cantidad: { type: Sequelize.INTEGER, allowNull: false },
      estado: { type: Sequelize.ENUM('PENDIENTE', 'ACEPTADO', 'RECHAZADO'), defaultValue: 'PENDIENTE' },
      fecha_sugerencia: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
      descripcion_sugerencia: { type: Sequelize.TEXT },
      justificacion: { type: Sequelize.TEXT },
    });

  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('sugerir_repuesto');
    await queryInterface.dropTable('recomendaciones_vehiculo');
    await queryInterface.dropTable('comentarios_vehiculo_especialista');
    await queryInterface.dropTable('solucion_propuesta');
    await queryInterface.dropTable('resultado_prueba_tecnica');
    await queryInterface.dropTable('prueba_tecnica_especialista');
    await queryInterface.dropTable('detalle_diagnostico');
    await queryInterface.dropTable('diagnostico_especialista');
  }
};
