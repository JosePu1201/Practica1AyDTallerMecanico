'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('persona', {
      id_persona: {type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true},
      nombre: {type: Sequelize.STRING(100), allowNull: false},
      apellido: {type: Sequelize.STRING(100), allowNull: false},
      dpi: {type: Sequelize.STRING(20), allowNull: false, unique: true},
      fecha_nacimiento: {type: Sequelize.DATE},
      direccion: {type: Sequelize.TEXT},
      estado: {type: Sequelize.ENUM('ACTIVO', 'INACTIVO'), defaultValue: 'ACTIVO'},
      fecha_creacion: {type: Sequelize.DATE, defaultValue: Sequelize.NOW},
      fecha_modificacion: {type: Sequelize.DATE, defaultValue: Sequelize.NOW}
    });

    await queryInterface.createTable('contacto_persona', {
      id_contacto: {type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true},
      id_persona: {type: Sequelize.INTEGER, allowNull: false, references: {model: 'persona', key: 'id_persona'}, onDelete: 'CASCADE'},
      correo: {type: Sequelize.STRING(150)},
      telefono: {type: Sequelize.STRING(20)},
      fecha_creacion: {type: Sequelize.DATE, defaultValue: Sequelize.NOW}
    });


    await queryInterface.createTable('rol', {
      id_rol: {type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true},
      nombre_rol: {type: Sequelize.STRING(50), allowNull: false, unique: true},
      descripcion: {type: Sequelize.TEXT},
      fecha_creacion: {type: Sequelize.DATE, defaultValue: Sequelize.NOW}
    });


    await queryInterface.createTable('usuario', {
      id_usuario: {type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true},
      id_persona: {type: Sequelize.INTEGER, allowNull: false, references: {model: 'persona', key: 'id_persona'}, onDelete: 'CASCADE'},
      nombre_usuario: {type: Sequelize.STRING(50), allowNull: false, unique: true},
      contrasena: {type: Sequelize.STRING(255), allowNull: false},
      factorAutenticacion:{type: Sequelize.BOOLEAN, defaultValue: false},
      id_rol: {type: Sequelize.INTEGER, allowNull: false, references: {model: 'rol', key: 'id_rol'}},
      estado: {type: Sequelize.ENUM('ACTIVO', 'INACTIVO', 'BLOQUEADO'), defaultValue: 'ACTIVO'},
      ultimo_acceso: {type: Sequelize.DATE, allowNull: true},
      fecha_creacion: {type: Sequelize.DATE, defaultValue: Sequelize.NOW},
      fecha_modificacion: {type: Sequelize.DATE, defaultValue: Sequelize.NOW}
    });

  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('usuario');
    await queryInterface.dropTable('rol');
    await queryInterface.dropTable('contacto_persona');
    await queryInterface.dropTable('persona');
  }
};
