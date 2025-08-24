'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    
    await queryInterface.createTable('observaciones_proceso_trabajo', {
      id_observacion: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      id_asignacion_trabajo: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'asignacion_trabajo', key: 'id_asignacion' }, onDelete: 'CASCADE' },
      observacion: { type: Sequelize.TEXT, allowNull: false },
      fecha_observacion: { type: Sequelize.DATE, defaultValue: Sequelize.NOW }
    });

    await queryInterface.createTable('sintomas_detectados', {
      id_sintoma: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      id_asignacion_trabajo: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'asignacion_trabajo', key: 'id_asignacion' }, onDelete: 'CASCADE' },
      fecha_sintoma: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
      descripcion_sintoma: { type: Sequelize.TEXT, allowNull: false },
      severidad: { type: Sequelize.ENUM('LEVE', 'MODERADO', 'SEVERO'), defaultValue: 'MODERADO' }
    });


    await queryInterface.createTable('imprevistos_trabajo', {
      id_imprevisto: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      id_asignacion_trabajo: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'asignacion_trabajo', key: 'id_asignacion' }, onDelete: 'CASCADE' },
      fecha_imprevisto: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
      descripcion_imprevisto: { type: Sequelize.TEXT, allowNull: false },
      impacto_tiempo: { type: Sequelize.INTEGER },
      impacto_costo: { type: Sequelize.DECIMAL(10, 2) }
    });

    await queryInterface.createTable('danios_adicionales', {
      id_danio: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      id_asignacion_trabajo: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'asignacion_trabajo', key: 'id_asignacion' }, onDelete: 'CASCADE' },
      descripcion_danio: { type: Sequelize.TEXT, allowNull: false },
      fecha_danio: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
      costo_estimado: { type: Sequelize.DECIMAL(10, 2) },
      requiere_autorizacion: { type: Sequelize.BOOLEAN, defaultValue: true },
      autorizado: { type: Sequelize.BOOLEAN, defaultValue: false }
    });

    
    await queryInterface.createTable('avances_trabajo', {
      id_avance: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      id_asignacion_trabajo: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'asignacion_trabajo', key: 'id_asignacion' }, onDelete: 'CASCADE' },
      descripcion: { type: Sequelize.TEXT, allowNull: false },
      nombre: { type: Sequelize.STRING(200), allowNull: false },
      porcentaje: { type: Sequelize.TINYINT, allowNull: false, validate: { min: 0, max: 100 } },
      fecha_avance: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
    });

    await queryInterface.createTable('solicitud_apoyo', {
      id_solicitud_apoyo: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      id_asignacion_trabajo: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'asignacion_trabajo', key: 'id_asignacion' }, onDelete: 'CASCADE' },
      id_usuario_especialista: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'usuario', key: 'id_usuario' } },
      descripcion_apoyo: { type: Sequelize.TEXT, allowNull: false },
      fecha_apoyo: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
      estado: { type: Sequelize.ENUM('PENDIENTE', 'ACEPTADO', 'RECHAZADO', 'COMPLETADO'), defaultValue: 'PENDIENTE' },
      fecha_respuesta: { type: Sequelize.DATE, allowNull: true },
      observaciones_respuesta: { type: Sequelize.TEXT }
    });


    await queryInterface.createTable('mantenimiento_adicional', {
      id_mantenimiento_adicional: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      id_asignacion_trabajo: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'asignacion_trabajo', key: 'id_asignacion' }, onDelete: 'CASCADE' },
      id_tipo_trabajo: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'tipo_mantenimiento', key: 'id_tipo_trabajo' } },
      descripcion: { type: Sequelize.TEXT, allowNull: false },
      fecha_solicitud: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
      estado: { type: Sequelize.ENUM('PENDIENTE', 'APROBADO', 'RECHAZADO', 'COMPLETADO'), defaultValue: 'PENDIENTE' },
      costo_estimado: { type: Sequelize.DECIMAL(10, 2) }
    });

    await queryInterface.createTable('solicitud_uso_repuesto', {
      id_solicitud_uso_repuesto: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      id_asignacion_trabajo: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'asignacion_trabajo', key: 'id_asignacion' }, onDelete: 'CASCADE' },
      fecha_uso: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
      descripcion: { type: Sequelize.TEXT },
      cantidad: { type: Sequelize.INTEGER, allowNull: false },
      estado: { type: Sequelize.ENUM('PENDIENTE', 'APROBADO', 'RECHAZADO', 'USADO'), defaultValue: 'PENDIENTE' },
      id_usuario_aceptacion: { type: Sequelize.INTEGER, allowNull: true, references: { model: 'usuario', key: 'id_usuario' } },
      id_inventario_repuesto: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'inventario', key: 'id_inventario_repuesto' } },
      fecha_aprobacion: { type: Sequelize.DATE, allowNull: true },
    });

  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('solicitud_uso_repuesto');
    await queryInterface.dropTable('mantenimiento_adicional');
    await queryInterface.dropTable('solicitud_apoyo');
    await queryInterface.dropTable('avances_trabajo');
    await queryInterface.dropTable('danios_adicionales');
    await queryInterface.dropTable('imprevistos_trabajo');
    await queryInterface.dropTable('sintomas_detectados');
    await queryInterface.dropTable('observaciones_proceso_trabajo');
  }
};
