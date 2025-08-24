'use strict';
const bcrypt = require('bcrypt');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    //Crear personas
    await queryInterface.bulkInsert('persona', [
      {
        nombre: 'Juan',
        apellido: 'Pérez',
        dpi: '1234567890101',
        fecha_nacimiento: new Date('1990-01-01'),
        direccion: 'Calle Falsa 123',
        estado: 'ACTIVO',
        fecha_creacion: new Date(),
        fecha_modificacion: new Date()
      },
      {
        nombre: 'María',
        apellido: 'Gómez',
        dpi: '1098765432101',
        fecha_nacimiento: new Date('1995-05-05'),
        direccion: 'Avenida Siempre Viva 742',
        estado: 'ACTIVO',
        fecha_creacion: new Date(),
        fecha_modificacion: new Date()
      },
      {
        nombre: 'Pedro',
        apellido: 'López',
        dpi: '9876543210123',
        fecha_nacimiento: new Date('1988-08-08'),
        direccion: 'Boulevard de los Sueños Rotos 456',
        estado: 'ACTIVO',
        fecha_creacion: new Date(),
        fecha_modificacion: new Date()
      }
    ]);


    await queryInterface.bulkInsert('contacto_persona', [
      {
        id_persona:1,
        correo: 'juan.perez@example.com',
        telefono: '1234-5678',
        fecha_creacion: new Date()
      },
      {
        id_persona: 2,
        correo: 'maria.gomez@example.com',
        telefono: '8765-4321',
        fecha_creacion: new Date()
      },
      {
        id_persona: 3,
        correo: 'pedro.lopez@example.com',
        telefono: '5555-5555',
        fecha_creacion: new Date()
      }
    ]);

    //Crear roles ADMINISTRADOR, EMPLEADO, CLIENTE, ESPECIALISTA
    await queryInterface.bulkInsert('rol', [
      {
        nombre_rol: 'ADMINISTRADOR',
        descripcion: 'Rol con acceso total al sistema',
        fecha_creacion: new Date()
      },
      {
        nombre_rol: 'EMPLEADO',
        descripcion: 'Rol con acceso limitado a funciones específicas',
        fecha_creacion: new Date()
      },
      {
        nombre_rol: 'CLIENTE',
        descripcion: 'Rol para usuarios que utilizan el sistema como clientes',
        fecha_creacion: new Date()
      },
      {
        nombre_rol: 'ESPECIALISTA',
        descripcion: 'Rol para usuarios con habilidades especiales',
        fecha_creacion: new Date()
      }
    ]);

    await queryInterface.bulkInsert('usuario', [
      {
        id_persona: 1,
        nombre_usuario: 'admin',
        contrasena: await bcrypt.hash('admin123', 10), // Contraseña encriptada
        id_rol: 1, // ADMINISTRADOR
        estado: 'ACTIVO',
        ultimo_acceso: null,
        fecha_creacion: new Date(),
        fecha_modificacion: new Date()
      },
      {
        id_persona: 2,
        nombre_usuario: 'empleado',
        contrasena: await bcrypt.hash('empleado123', 10), // Contraseña encriptada
        id_rol: 2, // EMPLEADO
        estado: 'ACTIVO',
        ultimo_acceso: null,
        fecha_creacion: new Date(),
        fecha_modificacion: new Date()
      },
      {
        id_persona: 3,
        nombre_usuario: 'cliente',
        contrasena: await bcrypt.hash('cliente123', 10), // Contraseña encriptada
        id_rol: 3, // CLIENTE
        estado: 'ACTIVO',
        ultimo_acceso: null,
        fecha_creacion: new Date(),
        fecha_modificacion: new Date()
      }
    ]);


  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete('usuario', null, {});
    await queryInterface.bulkDelete('rol', null, {});
    await queryInterface.bulkDelete('contacto_persona', null, {});
    await queryInterface.bulkDelete('persona', null, {});
  }
};
