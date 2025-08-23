const transporter = require('../config/mailer');
const EmailTemplates = require('./emailTemplate');
const recuperarContrasenaTemplate = require('./recuperarTemplate');

class EmailService {
  /**
   * Envía un correo con el código de verificación
   */

    /**
   * Envía un correo 
   * @param {Object} options - Opciones del correo
   * @param {string} options.to - Email del destinatario
   * @param {string} options.codigoVerificacion - Codigo de verificación a enviar
   */
  static async sendVerificationCode(options) {
    const { to, codigoVerificacion } = options;

    try {
      const html = EmailTemplates.verificationCode({ codigoVerificacion });

      const info = await transporter.sendMail({
        from: `"Taller Mecánico" <${process.env.EMAIL_USER}>`,
        to,
        subject: 'Código de verificación de acceso',
        html
      });

      console.log('✉️ Código de verificación enviado: %s', info.messageId);
      return true;
    } catch (error) {
      console.error('❌ Error al enviar código de verificación:', error);
      return false;
    }
  }

  static async sendRecupeartionCode(options) {
    const { to, codigoVerificacion } = options;

    try {
      const html = recuperarContrasenaTemplate.recuperationCode({ codigoVerificacion });

      const info = await transporter.sendMail({
        from: `"Taller Mecánico" <${process.env.EMAIL_USER}>`,
        to,
        subject: 'Código de recuperacion de acceso',
        html
      });

      console.log('✉️ Código de recuperacion enviado: %s', info.messageId);
      return true;
    } catch (error) {
      console.error('❌ Error al enviar código de verificación:', error);
      return false;
    }
  }
}

module.exports = EmailService;