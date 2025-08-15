'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {

    await queryInterface.createTable('catalogo_proveedor', {
      id_catalogo: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      id_proveedor: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'proveedor', key: 'id_proveedor' }, onDelete: 'CASCADE' },
      id_repuesto: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'repuesto', key: 'id_repuesto' } },
      precio: { type: Sequelize.DECIMAL(10, 2), allowNull: false },
      cantidad_disponible: { type: Sequelize.INTEGER, defaultValue: 0 },
      tiempo_entrega: { type: Sequelize.INTEGER },
      fecha_actualizacion: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
      estado: { type: Sequelize.ENUM('DISPONIBLE', 'AGOTADO', 'DESCONTINUADO'), defaultValue: 'DISPONIBLE' }
    });

    await queryInterface.createTable('pedido_proveedor', {
      id_pedido: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      id_proveedor: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'proveedor', key: 'id_proveedor' } },
      numero_pedido: { type: Sequelize.STRING(50), unique: true },
      total: { type: Sequelize.DECIMAL(10, 2), allowNull: false },
      fecha_pedido: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
      fecha_entrega_solicitada: { type: Sequelize.DATE },
      estado: { type: Sequelize.ENUM('PENDIENTE', 'CONFIRMADO', 'EN_TRANSITO', 'ENTREGADO', 'CANCELADO'), defaultValue: 'PENDIENTE' },
      observaciones: { type: Sequelize.TEXT },
    });


    await queryInterface.createTable('detalle_pedido', {
      id_detalle_pedido: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      id_pedido: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'pedido_proveedor', key: 'id_pedido' }, onDelete: 'CASCADE' },
      id_catalogo: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'catalogo_proveedor', key: 'id_catalogo' } },
      cantidad: { type: Sequelize.INTEGER, allowNull: false },
      precio_unitario: { type: Sequelize.DECIMAL(10, 2), allowNull: false },
      subtotal: { type: Sequelize.DECIMAL(10, 2), allowNull: false }
    });

    await queryInterface.createTable('entrega_pedido', {
      id_entrega: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      id_pedido: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'pedido_proveedor', key: 'id_pedido' }, onDelete: 'CASCADE' },
      fecha_entrega_real: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
      estado_entrega: { type: Sequelize.ENUM('PENDIENTE', 'PARCIAL', 'COMPLETA', 'RETRASADA'), defaultValue: 'PENDIENTE' },
      observaciones_entrega: { type: Sequelize.TEXT },
      id_usuario_recibe: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'usuario', key: 'id_usuario' } },
      documento_entrega: { type: Sequelize.STRING(100) }
    });

    
    await queryInterface.createTable('pagos_proveedor', {
      id_pago_proveedor: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      id_pedido: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'pedido_proveedor', key: 'id_pedido' }, onDelete: 'CASCADE' },
      monto: { type: Sequelize.DECIMAL(10, 2), allowNull: false },
      fecha_pago: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
      metodo_pago: { type: Sequelize.ENUM('EFECTIVO', 'CHEQUE', 'TRANSFERENCIA', 'TARJETA'), allowNull: false },
      referencia: { type: Sequelize.STRING(100) },
      estado: { type: Sequelize.ENUM('PENDIENTE', 'PAGADO', 'RECHAZADO'), defaultValue: 'PENDIENTE' },
      observaciones: { type: Sequelize.TEXT },
      id_usuario_registro: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'usuario', key: 'id_usuario' } }
    });

    await queryInterface.createTable('articulos_sugeridos', {
      id_sugerencia_articulo: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      nombre_articulo: { type: Sequelize.STRING(200), allowNull: false },
      descripcion: { type: Sequelize.TEXT },
      precio: { type: Sequelize.DECIMAL(10, 2) },
      estado: { type: Sequelize.ENUM('PENDIENTE', 'EVALUADO', 'APROBADO', 'RECHAZADO'), defaultValue: 'PENDIENTE' },
      id_proveedor: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'proveedor', key: 'id_proveedor' }, onDelete: 'CASCADE' },
      fecha_sugerencia: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
      categoria: { type: Sequelize.STRING(100) },
      marca_compatible: { type: Sequelize.STRING(100) }
    });

    
    await queryInterface.createTable('cotizacion_productos', {
      id_cotizacion: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      id_proveedor: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'proveedor', key: 'id_proveedor' }, onDelete: 'CASCADE' },
      numero_cotizacion: { type: Sequelize.STRING(50), unique: true },
      fecha_cotizacion: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
      fecha_vencimiento: { type: Sequelize.DATE },
      estado: { type: Sequelize.ENUM('PENDIENTE', 'ENVIADO', 'APROBADO', 'RECHAZADO', 'VENCIDO'), defaultValue: 'PENDIENTE' },
      total: { type: Sequelize.DECIMAL(10, 2), allowNull: false },
      observaciones: { type: Sequelize.TEXT },
      id_usuario_solicita: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'usuario', key: 'id_usuario' } }
    });

    await queryInterface.createTable('detalle_cotizacion', {
      id_detalle_cotizacion: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      id_cotizacion: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'cotizacion_productos', key: 'id_cotizacion' }, onDelete: 'CASCADE' },
      id_catalogo: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'catalogo_proveedor', key: 'id_catalogo' } },
      precio_cotizado: { type: Sequelize.DECIMAL(10, 2), allowNull: false },
      cantidad: { type: Sequelize.INTEGER, allowNull: false },
      subtotal: { type: Sequelize.DECIMAL(10, 2), allowNull: false },
      descuento_porcentaje: { type: Sequelize.DECIMAL(5, 2), defaultValue: 0 },
      observaciones: { type: Sequelize.TEXT },
    });


  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('detalle_cotizacion');
    await queryInterface.dropTable('cotizacion_productos');
    await queryInterface.dropTable('articulos_sugeridos');
    await queryInterface.dropTable('pagos_proveedor');
    await queryInterface.dropTable('entrega_pedido');
    await queryInterface.dropTable('detalle_pedido');
    await queryInterface.dropTable('pedido_proveedor');
    await queryInterface.dropTable('catalogo_proveedor');
  }
};
