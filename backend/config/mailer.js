const nodemailer = require('nodemailer');

// Crear el objeto transporter
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: process.env.EMAIL_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Verificar la conexión
transporter.verify()
  .then(() => console.log('✅ Servidor de correo configurado correctamente'))
  .catch(err => console.error('❌ Error en la configuración del servidor de correo:', err));

module.exports = transporter;