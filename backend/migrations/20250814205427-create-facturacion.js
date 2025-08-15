'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    
    await queryInterface.createTable('factura_servicio_vehiculo', {
      id_factura: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      id_registro: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'registro_servicio_vehiculo', key: 'id_registro' }, onDelete: 'CASCADE' },
      numero_factura: { type: Sequelize.STRING(50), allowNull: false, unique: true },
      fecha_emision: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
      fecha_vencimiento: { type: Sequelize.DATE },
      subtotal: { type: Sequelize.DECIMAL(10, 2), allowNull: false },
      impuestos: { type: Sequelize.DECIMAL(10, 2), defaultValue: 0 },
      descuentos: { type: Sequelize.DECIMAL(10, 2), defaultValue: 0 },
      total: { type: Sequelize.DECIMAL(10, 2), allowNull: false },
      estado_pago: { type: Sequelize.ENUM('PENDIENTE', 'PARCIAL', 'PAGADO', 'VENCIDO'), defaultValue: 'PENDIENTE' },
      metodo_pago_preferido: { type: Sequelize.ENUM('EFECTIVO', 'TARJETA', 'TRANSFERENCIA', 'CHEQUE') },
      observaciones: { type: Sequelize.TEXT },
    });

    await queryInterface.createTable('pagos_factura', {
      id_pago: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      id_factura: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'factura_servicio_vehiculo', key: 'id_factura' }, onDelete: 'CASCADE' },
      monto_pago: { type: Sequelize.DECIMAL(10, 2), allowNull: false },
      fecha_pago: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
      metodo_pago: { type: Sequelize.ENUM('EFECTIVO', 'TARJETA', 'TRANSFERENCIA', 'CHEQUE'), allowNull: false },
      referencia_pago: { type: Sequelize.STRING(100) },
      id_usuario_registro: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'usuario', key: 'id_usuario' }, onDelete: 'CASCADE' },
      observaciones: { type: Sequelize.TEXT },
    });

  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('pagos_factura');
    await queryInterface.dropTable('factura_servicio_vehiculo');
  }
};
